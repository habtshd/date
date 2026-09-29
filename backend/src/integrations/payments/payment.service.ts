import crypto from 'crypto';
import { prisma } from '../../plugins/prisma';
import { env } from '../../config/env';
import { wsManager } from '../../plugins/websocket';
import { logger } from '../../utils/logger';
import { PaymentProvider } from './payment.types';

export class PaymentIntegrationService {
  constructor(
    private readonly provider: PaymentProvider,
    private readonly providerName: string
  ) {}

  /**
   * Initiate pay-per-conversation unlock order
   * Strictly enforces: Only active, verified, matched, unblocked participants can pay.
   */
  async createConversationPayment(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        match: true,
        payments: true,
      },
    });

    if (!conversation) {
      throw new Error('CONVERSATION_NOT_FOUND');
    }

    const belongs =
      conversation.match.userAId === userId ||
      conversation.match.userBId === userId;

    if (!belongs) {
      throw new Error('FORBIDDEN');
    }

    if (conversation.match.status !== 'ACTIVE') {
      throw new Error('MATCH_NOT_ACTIVE');
    }

    if (conversation.status === 'ACTIVE') {
      throw new Error('CONVERSATION_ALREADY_UNLOCKED');
    }

    const hasSuccessfulPayment = conversation.payments.some((p) => p.status === 'SUCCESS');
    if (hasSuccessfulPayment) {
      throw new Error('ALREADY_PAID');
    }

    const partnerId =
      conversation.match.userAId === userId
        ? conversation.match.userBId
        : conversation.match.userAId;

    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: partnerId },
          { blockerId: partnerId, blockedId: userId },
        ],
      },
    });

    if (isBlocked) {
      throw new Error('FORBIDDEN');
    }

    const initialRef = crypto.randomUUID();
    const amount = env.CONVERSATION_UNLOCK_PRICE_ETB;

    const payment = await prisma.payment.upsert({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
      create: {
        userId,
        conversationId,
        provider: this.providerName,
        providerReference: initialRef,
        amount,
        currency: 'ETB',
        status: 'PENDING',
      },
      update: {
        status: 'PENDING',
      },
    });

    const providerResult = await this.provider.createPayment({
      paymentId: payment.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      customerReference: userId,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerReference: providerResult.providerReference,
      },
    });

    logger.info('Conversation unlock payment order created', {
      userId,
      conversationId,
      paymentId: payment.id,
      reference: providerResult.providerReference,
    });

    return {
      paymentId: payment.id,
      paymentUrl: providerResult.paymentUrl,
      status: 'PENDING',
    };
  }

  /**
   * Idempotent webhook handler: Only payment provider's verified callback transitions status to SUCCESS
   */
  async processWebhook(payload: unknown, signature?: string) {
    const verified = await this.provider.verifyWebhook(payload, signature);

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: {
          providerReference: verified.providerReference,
        },
        include: {
          conversation: {
            include: { match: true },
          },
        },
      });

      if (!payment) {
        throw new Error('PAYMENT_NOT_FOUND');
      }

      // Idempotency: if already SUCCESS, ignore duplicate webhook safely
      if (payment.status === 'SUCCESS') {
        logger.info('Duplicate payment webhook ignored for already successful transaction', {
          reference: verified.providerReference,
        });
        return {
          success: true,
          status: 'SUCCESS',
          idempotent: true,
        };
      }

      if (verified.status === 'SUCCESS') {
        const completedAt = new Date();

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            completedAt,
          },
        });

        await tx.conversation.update({
          where: { id: payment.conversationId },
          data: {
            status: 'ACTIVE',
            unlockedAt: completedAt,
          },
        });

        // Notify both participants
        await tx.notification.createMany({
          data: [
            {
              userId: payment.conversation.match.userAId,
              type: 'PAYMENT_SUCCESS',
              title: 'Conversation Unlocked!',
              body: 'Your conversation has been unlocked. You can now chat.',
            },
            {
              userId: payment.conversation.match.userBId,
              type: 'PAYMENT_SUCCESS',
              title: 'Conversation Unlocked!',
              body: 'Your conversation has been unlocked. You can now chat.',
            },
          ],
        });

        await tx.auditLog.create({
          data: {
            actorUserId: payment.userId,
            action: 'PAYMENT_SUCCESS_CONVERSATION_UNLOCKED',
            targetType: 'CONVERSATION',
            targetId: payment.conversationId,
            metadata: { paymentId: payment.id, amount: Number(payment.amount) },
          },
        });

        // Real-time broadcast via WebSocket
        const unlockMsg = {
          type: 'CONVERSATION_UNLOCKED',
          conversationId: payment.conversationId,
          unlockedAt: completedAt,
        };
        wsManager.broadcastToUser(payment.conversation.match.userAId, unlockMsg);
        wsManager.broadcastToUser(payment.conversation.match.userBId, unlockMsg);

        logger.info('Payment succeeded and conversation unlocked', {
          paymentId: payment.id,
          conversationId: payment.conversationId,
        });

        return {
          success: true,
          status: 'SUCCESS',
          conversationId: payment.conversationId,
        };
      }

      if (verified.status === 'FAILED' || verified.status === 'CANCELLED') {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: verified.status,
          },
        });

        logger.warn('Payment failed or cancelled', {
          paymentId: payment.id,
          status: verified.status,
        });

        return {
          success: true,
          status: verified.status,
        };
      }

      return {
        success: true,
        status: 'PENDING',
      };
    });
  }
}
