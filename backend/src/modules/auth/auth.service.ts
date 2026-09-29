import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma';
import { config } from '../../config';
import { BadRequestError, UnauthorizedError } from '../../common/errors';
import { generateRandomOtp } from '../../common/crypto';
import { DeviceType } from '@prisma/client';

export class AuthService {
  /**
   * Request OTP code for a given phone number
   */
  async requestOtp(phoneNumber: string) {
    const normalizedPhone = phoneNumber.trim();

    const otpCode = config.otp.smsMockEnabled ? config.otp.defaultCode : generateRandomOtp();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

    // Invalidate previous active OTPs for this phone
    await prisma.phoneVerification.updateMany({
      where: { phoneNumber: normalizedPhone, isConsumed: false },
      data: { isConsumed: true },
    });

    await prisma.phoneVerification.create({
      data: {
        phoneNumber: normalizedPhone,
        otpHash,
        expiresAt,
        attemptsCount: 0,
      },
    });

    return {
      message: 'OTP verification code sent',
      phoneNumber: normalizedPhone,
      expiresInMinutes: config.otp.expiryMinutes,
      ...(config.otp.smsMockEnabled && { debugOtp: otpCode }),
    };
  }

  /**
   * Verify OTP and establish user session
   */
  async verifyOtp(
    phoneNumber: string,
    code: string,
    deviceId: string,
    deviceType: DeviceType = 'ANDROID'
  ) {
    const normalizedPhone = phoneNumber.trim();

    const verification = await prisma.phoneVerification.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        isConsumed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new BadRequestError('Verification code expired or not found. Please request a new code.');
    }

    if (verification.attemptsCount >= config.otp.maxAttempts) {
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { isConsumed: true },
      });
      throw new BadRequestError('Maximum verification attempts exceeded. Please request a new code.');
    }

    const isMatch = await bcrypt.compare(code, verification.otpHash);
    if (!isMatch) {
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { attemptsCount: { increment: 1 } },
      });
      throw new BadRequestError('Invalid verification code');
    }

    // Mark verification consumed
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { isConsumed: true },
    });

    // Upsert user account
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

    // Generate Tokens
    const accessToken = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      config.jwt.accessSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, deviceId },
      config.jwt.refreshSecret,
      { expiresIn: '30d' }
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Record session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        deviceId,
        expiresAt: sessionExpiresAt,
      },
    });

    // Register / update device
    await prisma.device.create({
      data: {
        userId: user.id,
        deviceType,
        pushToken: `DEVICE_${deviceId}`,
      },
    }).catch(() => {
      // Ignore if device already logged
    });

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
      payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string; deviceId: string };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
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
      throw new UnauthorizedError('Session expired or revoked');
    }

    const isTokenMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!isTokenMatch) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Session invalidation detected');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, phoneNumber: true, accountStatus: true, verificationStatus: true },
    });

    if (!user || user.accountStatus === 'BANNED' || user.accountStatus === 'DELETED') {
      throw new UnauthorizedError('User account not active');
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      config.jwt.accessSecret,
      { expiresIn: '15m' }
    );

    return {
      accessToken: newAccessToken,
      tokenType: 'Bearer',
    };
  }

  /**
   * Terminate active user session
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
