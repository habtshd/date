import { prisma } from '../../plugins/prisma';
import { getVerificationProvider } from '../../integrations/verification';
import { logger } from '../../utils/logger';

export class VerificationService {
  /**
   * Start identity verification via configured provider abstraction
   */
  async startVerification(userId: string, providerName = 'FAYDA') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.verificationStatus === 'VERIFIED') {
      throw new Error('User is already identity verified');
    }

    const provider = getVerificationProvider(providerName);
    const initResult = await provider.initiate(userId);

    // Save pending record
    const record = await prisma.verificationRecord.create({
      data: {
        userId,
        provider: provider.name,
        status: 'PENDING',
        providerReference: initResult.providerReference,
      },
    });

    // Mark user status as PENDING
    await prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: 'PENDING' },
    });

    logger.info('Identity verification initiated', { userId, provider: provider.name, reference: initResult.providerReference });

    return {
      recordId: record.id,
      providerReference: initResult.providerReference,
      verificationUrl: initResult.verificationUrl,
      status: 'PENDING',
      message: 'Verification flow started with provider. Awaiting completion.',
    };
  }

  /**
   * Check verification standing
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
      throw new Error('User not found');
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
   * Handle signed/verified callback from verification provider
   */
  async handleWebhook(payload: Record<string, unknown>) {
    const provider = getVerificationProvider();
    const verification = await provider.verifyCallback(payload);

    const record = await prisma.verificationRecord.findFirst({
      where: { providerReference: verification.providerReference },
    });

    if (!record) {
      throw new Error(`Verification reference ${verification.providerReference} not found`);
    }

    const newStatus = verification.status === 'VERIFIED' ? 'VERIFIED' : 'FAILED';

    await prisma.$transaction([
      prisma.verificationRecord.update({
        where: { id: record.id },
        data: {
          status: newStatus,
          verifiedAt: newStatus === 'VERIFIED' ? new Date() : null,
        },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: {
          verificationStatus: newStatus,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: record.userId,
          action: `VERIFICATION_${newStatus}`,
          targetType: 'VERIFICATION_RECORD',
          targetId: record.id,
          metadata: { provider: record.provider, reference: record.providerReference },
        },
      }),
    ]);

    logger.info('Verification webhook processed', { reference: verification.providerReference, status: newStatus });

    return {
      success: true,
      providerReference: verification.providerReference,
      status: newStatus,
    };
  }
}

export const verificationService = new VerificationService();
