import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma';
import { config } from '../../config';
import { BadRequestError, UnauthorizedError } from '../../common/errors';
import { generateRandomOtp } from '../../common/crypto';

export class AuthService {
  /**
   * Request OTP code for a given phone number
   */
  async requestOtp(phone: string) {
    const normalizedPhone = phone.trim();

    // In mock mode, we can use the default code for predictable mobile testing
    const otpCode = config.otp.smsMockEnabled ? config.otp.defaultCode : generateRandomOtp();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

    // Invalidate previous active OTPs for this phone
    await prisma.phoneVerification.updateMany({
      where: { phone: normalizedPhone, isConsumed: false },
      data: { isConsumed: true },
    });

    await prisma.phoneVerification.create({
      data: {
        phone: normalizedPhone,
        otpHash,
        expiresAt,
        attemptsCount: 0,
      },
    });

    // In production, trigger Ethio Telecom SMS / Twilio gateway here
    return {
      message: 'OTP verification code sent',
      phone: normalizedPhone,
      expiresInMinutes: config.otp.expiryMinutes,
      ...(config.otp.smsMockEnabled && { debugOtp: otpCode }),
    };
  }

  /**
   * Verify OTP and establish user session
   */
  async verifyOtp(phone: string, code: string, deviceId: string, deviceInfo?: Record<string, unknown>, ipAddress?: string) {
    const normalizedPhone = phone.trim();

    const verification = await prisma.phoneVerification.findFirst({
      where: {
        phone: normalizedPhone,
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
      where: { phone: normalizedPhone },
      include: { profile: true, verification: true },
    });

    let isNewUser = false;
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          role: 'UNVERIFIED_USER',
          status: 'ACTIVE',
        },
        include: { profile: true, verification: true },
      });
      isNewUser = true;
    }

    // Generate Tokens
    const accessToken = jwt.sign(
      { userId: user.id, phone: user.phone },
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
        deviceInfo: deviceInfo ? JSON.parse(JSON.stringify(deviceInfo)) : undefined,
        ipAddress,
        expiresAt: sessionExpiresAt,
      },
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
        phone: user.phone,
        role: user.role,
        status: user.status,
        hasProfile: !!user.profile,
        verificationStatus: user.verification?.status ?? 'UNVERIFIED',
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
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedError('Session expired or revoked');
    }

    const isTokenMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!isTokenMatch) {
      // Possible token theft, revoke session
      await prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedError('Session invalidation detected');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, phone: true, role: true, status: true },
    });

    if (!user || user.status === 'BANNED' || user.status === 'DELETED') {
      throw new UnauthorizedError('User account not active');
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, phone: user.phone },
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
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    return { message: 'Logged out successfully' };
  }
}

export const authService = new AuthService();
