import jwt from 'jsonwebtoken';
import { prisma } from '../../plugins/prisma';
import { env } from '../../config/env';
import { hashSecret, verifySecret } from '../../utils/crypto';
import { VerifyOtpInput } from './auth.schema';
import { otpService } from './otp.service';
import { UnauthorizedError, ForbiddenError } from '../../utils/errors';
import { logger } from '../../utils/logger';

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
      { userId: user.id, phoneNumber: user.phoneNumber, role: user.role },
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
   * Rotate access & refresh tokens with reuse/theft detection
   */
  async refreshToken(refreshToken: string) {
    let payload: { userId: string; deviceId: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string; deviceId: string };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const activeSession = await prisma.session.findFirst({
      where: {
        userId: payload.userId,
        deviceId: payload.deviceId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!activeSession) {
      // Check if this token belonged to an already revoked session (Token reuse / theft detection)
      const revokedSessions = await prisma.session.findMany({
        where: {
          userId: payload.userId,
          deviceId: payload.deviceId,
          revokedAt: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      for (const oldSession of revokedSessions) {
        const wasReused = await verifySecret(oldSession.refreshTokenHash, refreshToken).catch(() => false);
        if (wasReused) {
          // Token reuse detected! Invalidate all sessions for this user (Section 4)
          await prisma.session.updateMany({
            where: { userId: payload.userId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          logger.warn('Refresh token reuse detected. Revoking all sessions for security.', {
            userId: payload.userId,
          });
          throw new UnauthorizedError(
            'Security violation: Refresh token reuse detected. All sessions revoked.',
            'TOKEN_THEFT_DETECTED'
          );
        }
      }

      throw new UnauthorizedError('Session expired or revoked', 'SESSION_REVOKED');
    }

    const isMatch = await verifySecret(activeSession.refreshTokenHash, refreshToken);
    if (!isMatch) {
      await prisma.session.update({
        where: { id: activeSession.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Session invalidation detected', 'SESSION_INVALID');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, phoneNumber: true, accountStatus: true, verificationStatus: true, role: true },
    });

    if (!user || user.accountStatus === 'BANNED' || user.accountStatus === 'DELETED') {
      throw new ForbiddenError('User account is restricted');
    }

    // Refresh Token Rotation: Revoke token A, issue token B
    const newAccessToken = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber, role: user.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id, deviceId: payload.deviceId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    const newRefreshTokenHash = await hashSecret(newRefreshToken);

    await prisma.$transaction([
      prisma.session.update({
        where: { id: activeSession.id },
        data: { revokedAt: new Date() },
      }),
      prisma.session.create({
        data: {
          userId: user.id,
          deviceId: payload.deviceId,
          refreshTokenHash: newRefreshTokenHash,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
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
