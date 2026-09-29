import jwt from 'jsonwebtoken';
import { prisma } from '../../plugins/prisma';
import { env } from '../../config/env';
import { hashSecret, verifySecret } from '../../utils/crypto';
import { VerifyOtpInput } from './auth.schema';
import { otpService } from './otp.service';

export class AuthService {
  /**
   * Request OTP code for an E.164 phone number
   */
  async requestOtp(phoneNumber: string) {
    return otpService.requestOtp(phoneNumber);
  }

  /**
   * Verify OTP and establish user session with Argon2id-hashed refresh token
   */
  async verifyOtp(input: VerifyOtpInput) {
    const normalizedPhone = input.phoneNumber.trim();

    // Validate code via OtpService
    await otpService.validateOtp(normalizedPhone, input.code);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
      include: { profile: true },
    });

    let isNewUser = false;
    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: normalizedPhone,
          phoneVerified: true,
          accountStatus: 'ACTIVE',
          verificationStatus: 'UNVERIFIED',
        },
        include: { profile: true },
      });
      isNewUser = true;
    } else if (!user.phoneVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
        include: { profile: true },
      });
    }

    // Generate Access & Refresh Tokens
    const accessToken = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, deviceId: input.deviceId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    // Hash refresh token using Argon2id
    const refreshTokenHash = await hashSecret(refreshToken);
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Record session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        deviceId: input.deviceId,
        expiresAt: sessionExpiresAt,
      },
    });

    // Register device
    await prisma.device.create({
      data: {
        userId: user.id,
        deviceType: input.deviceType,
        pushToken: `PUSH_${input.deviceId}`,
      },
    }).catch(() => {});

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    return {
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
      },
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        accountStatus: user.accountStatus,
        verificationStatus: user.verificationStatus,
        hasProfile: !!user.profile,
        isNewUser,
      },
    };
  }

  /**
   * Rotate access token using valid refresh token
   */
  async refreshToken(refreshToken: string) {
    let payload: { userId: string; deviceId: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string; deviceId: string };
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    const session = await prisma.session.findFirst({
      where: {
        userId: payload.userId,
        deviceId: payload.deviceId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new Error('Session expired or revoked');
    }

    const isMatch = await verifySecret(session.refreshTokenHash, refreshToken);
    if (!isMatch) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw new Error('Session invalidation detected');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, phoneNumber: true, accountStatus: true, verificationStatus: true },
    });

    if (!user || user.accountStatus === 'BANNED' || user.accountStatus === 'DELETED') {
      throw new Error('User account is restricted');
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    return {
      accessToken: newAccessToken,
      tokenType: 'Bearer',
    };
  }

  /**
   * Logout user and revoke active sessions
   */
  async logout(userId: string) {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }
}

export const authService = new AuthService();
