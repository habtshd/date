import { prisma } from '../../plugins/prisma';
import { env } from '../../config/env';
import { hashSecret, verifySecret, generateRandomOtp } from '../../utils/crypto';
import { APP_CONSTANTS } from '../../config/constants';

export class OtpService {
  /**
   * Request OTP code for an E.164 phone number
   */
  async requestOtp(phoneNumber: string) {
    const normalizedPhone = phoneNumber.trim();

    const otpCode = env.OTP_SMS_MOCK_ENABLED ? env.OTP_DEFAULT_CODE : generateRandomOtp();
    const otpHash = await hashSecret(otpCode);
    const expiresAt = new Date(Date.now() + APP_CONSTANTS.OTP_EXPIRATION_MINUTES * 60 * 1000);

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
      expiresInMinutes: APP_CONSTANTS.OTP_EXPIRATION_MINUTES,
      ...(env.OTP_SMS_MOCK_ENABLED && { debugOtp: otpCode }),
    };
  }

  /**
   * Validate OTP code against database record
   */
  async validateOtp(phoneNumber: string, code: string): Promise<boolean> {
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
      throw new Error('Verification code expired or not found. Please request a new code.');
    }

    if (verification.attemptsCount >= APP_CONSTANTS.MAX_OTP_ATTEMPTS) {
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { isConsumed: true },
      });
      throw new Error('Maximum verification attempts exceeded. Please request a new code.');
    }

    const isMatch = await verifySecret(verification.otpHash, code);
    if (!isMatch) {
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { attemptsCount: { increment: 1 } },
      });
      throw new Error('Invalid verification code');
    }

    // Invalidate consumed OTP
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { isConsumed: true },
    });

    return true;
  }
}

export const otpService = new OtpService();
