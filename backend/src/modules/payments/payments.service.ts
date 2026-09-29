import { prisma } from '../../database/prisma';
import { config } from '../../config';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { generateOpaqueToken } from '../../common/crypto';

export class PaymentsService {
  /**
   * Initiate pay-per-conversation unlock order
   */
  async initiateConversationPayment(userId: string, conversationId: string, provider: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        match: true,
        members: true,
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isMember = conversation.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    if (conversation.status === 'ACTIVE') {
      throw new BadRequestError('This conversation is already unlocked and active');
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
      throw new ForbiddenError('Cannot initiate payment for a blocked relationship');
    }

    const providerReference = `PAY_${conversationId.substring(0, 8)}_${generateOpaqueToken(8)}`;
    const amount = config.payment.conversationUnlockPriceEtb;

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
        provider,
        providerReference,
        amount,
        currency: 'ETB',
        status: 'PENDING',
      },
      update: {
        provider,
        providerReference,
        status: 'PENDING',
      },
    });

    const checkoutUrl = `/api/v1/payments/mock-gateway-checkout/${payment.id}`;

    return {
      paymentId: payment.id,
      conversationId: payment.conversationId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      checkoutUrl,
      message: 'Payment order created. Complete payment to unlock chat.',
    };
  }

  /**
   * Complete payment and unlock conversation
   * Enforces: One payment unlocks one conversation with one person permanently.
   */
  async completePayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status === 'SUCCESS') {
      return { status: 'SUCCESS', message: 'Payment already completed' };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark payment SUCCESS
      await tx.payment.update({
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

      // 3. Notify participants
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
    });

    return {
      status: 'SUCCESS',
      conversationId: payment.conversationId,
      message: 'Conversation unlocked successfully via payment',
    };
  }

  /**
   * Process provider webhook (Chapa, Telebirr)
   */
  async processProviderWebhook(
    _provider: string,
    payload: Record<string, unknown>
  ) {
    const paymentId = (payload.paymentId || payload.tx_ref) as string;
    if (!paymentId) {
      throw new BadRequestError('Missing transaction reference in webhook payload');
    }

    return this.completePayment(paymentId);
  }
}

export const paymentsService = new PaymentsService();
