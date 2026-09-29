import { prisma } from '../../database/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { generateOpaqueToken } from '../../common/crypto';

export class VerificationService {
  /**
   * Submit identity verification request
   */
  async submitVerification(userId: string, provider = 'FAYDA') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.verificationStatus === 'VERIFIED') {
      throw new BadRequestError('User is already identity verified');
    }

    const providerReference = `VERIF_${generateOpaqueToken(16).toUpperCase()}`;

    // Record verification request (deliberately minimal personal data)
    const record = await prisma.verificationRecord.create({
      data: {
        userId,
        provider,
        status: 'PENDING',
        providerReference,
      },
    });

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: 'PENDING' },
    });

    return {
      recordId: record.id,
      providerReference: record.providerReference,
      status: record.status,
      message: 'Verification request submitted. Status is pending review.',
    };
  }

  /**
   * Get current verification standing
   */
  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        verificationStatus: true,
        verificationRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const latest = user.verificationRecords[0];

    return {
      status: user.verificationStatus,
      isVerified: user.verificationStatus === 'VERIFIED',
      provider: latest?.provider ?? null,
      providerReference: latest?.providerReference ?? null,
      verifiedAt: latest?.verifiedAt ?? null,
    };
  }

  /**
   * Webhook callback from verification provider (Fayda / KYC)
   */
  async handleWebhook(providerReference: string, status: 'VERIFIED' | 'FAILED') {
    const record = await prisma.verificationRecord.findFirst({
      where: { providerReference },
    });

    if (!record) {
      throw new NotFoundError('Verification reference not found');
    }

    await prisma.$transaction([
      prisma.verificationRecord.update({
        where: { id: record.id },
        data: {
          status,
          verifiedAt: status === 'VERIFIED' ? new Date() : null,
        },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: {
          verificationStatus: status,
        },
      }),
    ]);

    return {
      success: true,
      providerReference,
      status,
    };
  }
}

export const verificationService = new VerificationService();
