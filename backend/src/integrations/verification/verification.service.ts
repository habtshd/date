import { prisma } from '../../plugins/prisma';
import { logger } from '../../utils/logger';
import type { VerificationProvider, VerificationResult } from './verification.types';

export class VerificationService {
  constructor(
    private readonly provider: VerificationProvider,
    private readonly providerName: string
  ) {}

  /**
   * Start identity verification for authenticated user
   */
  async start(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (!user.phoneVerified) {
      throw new Error('PHONE_NOT_VERIFIED');
    }

    if (user.verificationStatus === 'VERIFIED') {
      throw new Error('ALREADY_VERIFIED');
    }

    // Check if an existing PENDING verification record is still active
    const existing = await prisma.verificationRecord.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existing) {
      return {
        verificationId: existing.id,
        providerReference: existing.providerReference,
        status: 'PENDING',
        redirectUrl: existing.providerReference
          ? `https://kyc.fayda.et/onboard?ref=${encodeURIComponent(existing.providerReference)}`
          : undefined,
      };
    }

    // Initiate session with the abstracted provider
    const result = await this.provider.start(userId);

    const record = await prisma.verificationRecord.create({
      data: {
        userId,
        provider: this.providerName,
        status: 'PENDING',
        providerReference: result.providerReference,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: 'PENDING',
      },
    });

    // Record non-sensitive audit event
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'VERIFICATION_STARTED',
        targetType: 'USER',
        targetId: userId,
        metadata: {
          provider: this.providerName,
          reference: result.providerReference,
        },
      },
    });

    logger.info('Identity verification started', {
      userId,
      provider: this.providerName,
      reference: result.providerReference,
    });

    return {
      verificationId: record.id,
      providerReference: result.providerReference,
      redirectUrl: result.redirectUrl,
      status: 'PENDING',
    };
  }

  /**
   * Get safe verification status for client (never exposes raw IDs or biometric references)
   */
  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        verificationStatus: true,
        verificationRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            verifiedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const latest = user.verificationRecords[0];

    if (user.verificationStatus === 'VERIFIED') {
      return {
        status: 'VERIFIED',
        verifiedAt: latest?.verifiedAt ?? null,
      };
    }

    return {
      status: user.verificationStatus,
    };
  }

  /**
   * Idempotent webhook processing with atomic status transition
   */
  async processWebhook(payload: unknown, signature: string | undefined) {
    const result: VerificationResult = await this.provider.verifyWebhook(payload, signature);

    const record = await prisma.verificationRecord.findFirst({
      where: {
        providerReference: result.providerReference,
      },
    });

    if (!record) {
      throw new Error('VERIFICATION_RECORD_NOT_FOUND');
    }

    // Idempotent guard: if already marked VERIFIED, skip duplicate processing
    if (record.status === 'VERIFIED') {
      logger.info('Duplicate verification webhook ignored for already verified record', {
        reference: result.providerReference,
      });
      return {
        success: true,
        status: 'VERIFIED',
        idempotent: true,
      };
    }

    if (result.status === 'VERIFIED') {
      const verifiedAt = new Date();

      await prisma.$transaction([
        prisma.verificationRecord.update({
          where: { id: record.id },
          data: {
            status: 'VERIFIED',
            verifiedAt,
          },
        }),
        prisma.user.update({
          where: { id: record.userId },
          data: {
            verificationStatus: 'VERIFIED',
          },
        }),
        prisma.notification.create({
          data: {
            userId: record.userId,
            type: 'VERIFICATION_COMPLETE',
            title: 'Verification complete',
            body: 'Your account is now verified.',
          },
        }),
        prisma.auditLog.create({
          data: {
            actorUserId: record.userId,
            action: 'VERIFICATION_COMPLETED',
            targetType: 'USER',
            targetId: record.userId,
            metadata: {
              provider: record.provider,
              reference: record.providerReference,
            },
          },
        }),
      ]);

      logger.info('User identity successfully verified via webhook', {
        userId: record.userId,
        reference: result.providerReference,
      });

      return {
        success: true,
        status: 'VERIFIED',
      };
    }

    if (result.status === 'FAILED') {
      await prisma.$transaction([
        prisma.verificationRecord.update({
          where: { id: record.id },
          data: {
            status: 'FAILED',
          },
        }),
        prisma.user.update({
          where: { id: record.userId },
          data: {
            verificationStatus: 'FAILED',
          },
        }),
        prisma.auditLog.create({
          data: {
            actorUserId: record.userId,
            action: 'VERIFICATION_FAILED',
            targetType: 'USER',
            targetId: record.userId,
            metadata: {
              provider: record.provider,
              reference: record.providerReference,
            },
          },
        }),
      ]);

      logger.warn('User identity verification failed via webhook', {
        userId: record.userId,
        reference: result.providerReference,
      });

      return {
        success: true,
        status: 'FAILED',
      };
    }

    return {
      success: true,
      status: 'PENDING',
    };
  }

  /**
   * Sanitized admin view of verification records (no raw identity data)
   */
  async getAdminVerificationRecords(limit = 50, offset = 0) {
    const [records, total] = await Promise.all([
      prisma.verificationRecord.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          status: true,
          provider: true,
          verifiedAt: true,
          createdAt: true,
        },
      }),
      prisma.verificationRecord.count(),
    ]);

    return {
      records: records.map((r) => ({
        id: r.id,
        userId: r.userId,
        status: r.status,
        provider: r.provider,
        verifiedAt: r.verifiedAt,
        createdAt: r.createdAt,
      })),
      total,
      limit,
      offset,
    };
  }
}
