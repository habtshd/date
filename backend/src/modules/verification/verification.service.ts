import crypto from 'crypto';
import { prisma } from '../../database/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { generateOpaqueToken } from '../../common/crypto';

export class VerificationService {
  /**
   * Submit identity documents for verification
   */
  async submitVerification(
    userId: string,
    idDocumentType: string,
    idDocumentNumber: string,
    livenessSessionId: string
  ) {
    const existing = await prisma.userVerification.findUnique({
      where: { userId },
    });

    if (existing && existing.status === 'VERIFIED') {
      throw new BadRequestError('User is already identity verified');
    }

    // Check if ID hash is already registered to prevent duplicate identity accounts
    const encryptedIdHash = crypto
      .createHmac('sha256', process.env.JWT_ACCESS_SECRET || 'secret-salt')
      .update(`${idDocumentType}:${idDocumentNumber.trim().toUpperCase()}`)
      .digest('hex');

    const duplicateId = await prisma.identityRecord.findFirst({
      where: { encryptedIdHash },
    });

    if (duplicateId) {
      throw new BadRequestError('This national ID document is already registered to another account');
    }

    const referenceToken = `VERIF_${generateOpaqueToken(16).toUpperCase()}`;

    // 1. Store isolated vault record
    const purgeDate = new Date();
    purgeDate.setDate(purgeDate.getDate() + 30); // 30 days retention policy

    await prisma.identityRecord.create({
      data: {
        referenceToken,
        idDocumentType,
        encryptedIdHash,
        verificationAuditLog: {
          submittedAt: new Date().toISOString(),
          livenessSessionId,
        },
        retentionPurgeDueAt: purgeDate,
      },
    });

    // 2. Upsert dating-side verification state
    const userVerification = await prisma.userVerification.upsert({
      where: { userId },
      create: {
        userId,
        status: 'PENDING_REVIEW',
        provider: 'INTERNAL_LIVENESS',
        referenceToken,
        submittedAt: new Date(),
      },
      update: {
        status: 'PENDING_REVIEW',
        referenceToken,
        rejectionReason: null,
        submittedAt: new Date(),
      },
    });

    return {
      status: userVerification.status,
      referenceToken: userVerification.referenceToken,
      message: 'Identity verification submitted. Your account is being reviewed.',
    };
  }

  /**
   * Get current user's verification standing
   */
  async getStatus(userId: string) {
    const verification = await prisma.userVerification.findUnique({
      where: { userId },
      select: {
        status: true,
        provider: true,
        referenceToken: true,
        rejectionReason: true,
        submittedAt: true,
        verifiedAt: true,
      },
    });

    if (!verification) {
      return {
        status: 'UNVERIFIED',
        isVerified: false,
      };
    }

    return {
      ...verification,
      isVerified: verification.status === 'VERIFIED',
    };
  }

  /**
   * Process webhook from verification partner / Fayda KYC
   */
  async handleWebhook(referenceToken: string, status: 'VERIFIED' | 'REJECTED', rejectionReason?: string) {
    const verification = await prisma.userVerification.findUnique({
      where: { referenceToken },
    });

    if (!verification) {
      throw new NotFoundError('Verification reference not found');
    }

    if (status === 'VERIFIED') {
      await prisma.$transaction([
        prisma.userVerification.update({
          where: { id: verification.id },
          data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
            rejectionReason: null,
          },
        }),
        prisma.user.update({
          where: { id: verification.userId },
          data: { role: 'VERIFIED_USER' },
        }),
      ]);
    } else {
      await prisma.userVerification.update({
        where: { id: verification.id },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'Verification documents could not be validated',
        },
      });
    }

    return { success: true, referenceToken, status };
  }
}

export const verificationService = new VerificationService();
