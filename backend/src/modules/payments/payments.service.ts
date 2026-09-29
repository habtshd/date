import { prisma } from '../../plugins/prisma';
import { env } from '../../config/env';
import { getPaymentProvider } from '../../integrations/payments';
import { wsManager } from '../../plugins/websocket';
import { logger } from '../../utils/logger';

export class PaymentsService {
  /**
   * Initiate pay-per-conversation unlock order
   */
  async initiateConversationPayment(userId: string, conversationId: string, providerName = 'CHAPA') {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        match: true,
        members: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const isMember = conversation.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new Error('You are not a participant in this conversation');
    }

    if (conversation.status === 'ACTIVE') {
      throw new Error('This conversation is already unlocked and active');
    }

    const partnerId = conversation.match.userAId === userId
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
      throw new Error('Cannot initiate payment for a blocked relationship');
    }

    const provider = getPaymentProvider(providerName);
    const amount = env.CONVERSATION_UNLOCK_PRICE_ETB;

    const initResult = await provider.initiatePayment({
      userId,
      conversationId,
      amount,
      currency: 'ETB',
    });

    // Create payment record (enforcing UNIQUE(userId, conversationId))
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
        provider: provider.name,
        providerReference: initResult.paymentReference,
        amount,
        currency: 'ETB',
        status: 'PENDING',
      },
      update: {
        provider: provider.name,
        providerReference: initResult.paymentReference,
        status: 'PENDING',
      },
    });

    logger.info('Payment order initiated for conversation unlock', {
      userId,
      conversationId,
      paymentId: payment.id,
      reference: initResult.paymentReference,
    });

    return {
      paymentId: payment.id,
      conversationId: payment.conversationId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      checkoutUrl: initResult.checkoutUrl,
      message: 'Payment order created. Complete payment to unlock chat.',
    };
  }

  /**
   * Complete payment and unlock conversation
   * Enforces: One payment unlocks one conversation with one person permanently.
   */
  async completePayment(paymentReferenceOrId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: paymentReferenceOrId },
          { providerReference: paymentReferenceOrId },
        ],
      },
    });

    if (!payment) {
      throw new Error(`Payment record not found for reference ${paymentReferenceOrId}`);
    }

    if (payment.status === 'SUCCESS') {
      return { status: 'SUCCESS', message: 'Payment already completed' };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark payment SUCCESS
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
        },
      });

      // 2. Unlock Conversation (status = ACTIVE)
      const conv = await tx.conversation.update({
        where: { id: payment.conversationId },
        data: {
          status: 'ACTIVE',
          unlockedAt: new Date(),
        },
        include: { match: true },
      });

      // 3. Notify participants via persistent notification
      await tx.notification.createMany({
        data: [
          {
            userId: conv.match.userAId,
            type: 'PAYMENT_SUCCESS',
            title: 'Conversation Unlocked!',
            body: 'Your conversation has been unlocked. You can now chat.',
          },
          {
            userId: conv.match.userBId,
            type: 'PAYMENT_SUCCESS',
            title: 'Conversation Unlocked!',
            body: 'Your conversation has been unlocked. You can now chat.',
          },
        ],
      });

      // 4. Record audit log
      await tx.auditLog.create({
        data: {
          actorUserId: payment.userId,
          action: 'PAYMENT_SUCCESS_CONVERSATION_UNLOCKED',
          targetType: 'CONVERSATION',
          targetId: payment.conversationId,
          metadata: { paymentId: payment.id, amount: Number(payment.amount) },
        },
      });

      return { updatedPayment, conv };
    });

    // Real-time broadcast to both participants via WebSocket
    const unlockPayload = {
      type: 'CONVERSATION_UNLOCKED',
      conversationId: payment.conversationId,
      unlockedAt: result.conv.unlockedAt,
    };
    wsManager.broadcastToUser(result.conv.match.userAId, unlockPayload);
    wsManager.broadcastToUser(result.conv.match.userBId, unlockPayload);

    logger.info('Payment succeeded and conversation unlocked', {
      paymentId: payment.id,
      conversationId: payment.conversationId,
    });

    return {
      status: 'SUCCESS',
      conversationId: payment.conversationId,
      message: 'Conversation unlocked successfully via payment',
    };
  }

  /**
   * Get payment details by ID
   */
  async getPaymentById(userId: string, paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { conversation: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.userId !== userId) {
      throw new Error('Access denied to payment details');
    }

    return {
      id: payment.id,
      conversationId: payment.conversationId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      status: payment.status,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
    };
  }

  /**
   * Process provider webhook (Chapa, Telebirr)
   * Section 15: Signed webhook verified before database is updated
   */
  async processProviderWebhook(
    payload: Record<string, unknown>,
    signature?: string,
    providerName = 'CHAPA'
  ) {
    const provider = getPaymentProvider(providerName);
    const verifiedResult = await provider.verifyWebhook(payload, signature);

    if (!verifiedResult.isSuccessful) {
      logger.warn('Payment webhook reported unsuccessful transaction', { payload });
      return { status: 'FAILED', message: 'Payment gateway reported unsuccessful state' };
    }

    return this.completePayment(verifiedResult.paymentId);
  }
}

export const paymentsService = new PaymentsService();
