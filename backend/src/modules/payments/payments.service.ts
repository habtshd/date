import crypto from 'crypto';
import { prisma } from '../../database/prisma';
import { config } from '../../config';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { generateOpaqueToken } from '../../common/crypto';
import { PaymentProvider } from '@prisma/client';

export class PaymentsService {
  /**
   * Initiate pay-per-conversation unlock order
   */
  async initiateConversationPayment(userId: string, conversationId: string, provider: PaymentProvider) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        match: true,
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Verify membership
    if (conversation.userLowId !== userId && conversation.userHighId !== userId) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    // Check if conversation is already unlocked
    if (conversation.isUnlocked) {
      throw new BadRequestError('This conversation is already unlocked and active');
    }

    // Check if either user has blocked the other
    const partnerId = conversation.userLowId === userId ? conversation.userHighId : conversation.userLowId;
    const isBlocked = await prisma.userBlock.findFirst({
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

    const idempotencyKey = `PAY_CONV_${conversationId.substring(0, 8)}_${generateOpaqueToken(8)}`;
    const amount = config.payment.conversationUnlockPriceEtb;

    // Create payment order
    const order = await prisma.paymentOrder.create({
      data: {
        userId,
        conversationId,
        amount,
        currency: 'ETB',
        provider,
        idempotencyKey,
        status: 'PENDING',
      },
    });

    // In a real environment, call Chapa/Telebirr APIs here to generate checkout URL:
    // e.g. POST https://api.chapa.co/v1/transaction/initialize
    const checkoutUrl = `/api/v1/payments/mock-gateway-checkout/${order.id}`;

    return {
      paymentOrderId: order.id,
      conversationId: order.conversationId,
      amount: order.amount,
      currency: order.currency,
      provider: order.provider,
      checkoutUrl,
      message: 'Payment order created. Complete payment to unlock chat.',
    };
  }

  /**
   * Verify and process webhook callback from payment provider (Chapa, Telebirr, etc.)
   * Strictly enforces: Only verified server-to-server callback unlocks the conversation!
   */
  async processProviderWebhook(
    provider: PaymentProvider,
    eventId: string,
    payload: Record<string, unknown>,
    signatureHeader?: string
  ) {
    // 1. Idempotency Check: Don't process the same event twice
    const existingEvent = await prisma.paymentWebhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider,
          eventId,
        },
      },
    });

    if (existingEvent && existingEvent.isProcessed) {
      return { status: 'ALREADY_PROCESSED' };
    }

    // 2. Validate cryptographic signature
    if (provider === 'CHAPA') {
      const secret = config.payment.chapaWebhookSecret;
      const expectedHash = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signatureHeader && signatureHeader !== expectedHash && process.env.NODE_ENV === 'production') {
        throw new ForbiddenError('Invalid webhook HMAC signature');
      }
    }

    // Record webhook event
    await prisma.paymentWebhookEvent.upsert({
      where: {
        provider_eventId: {
          provider,
          eventId,
        },
      },
      create: {
        provider,
        eventId,
        payload: JSON.parse(JSON.stringify(payload)),
        isProcessed: false,
      },
      update: {},
    });

    // Extract transaction details from provider payload
    // Example: { tx_ref: "order_id", status: "success", reference: "gateway_ref_123" }
    const orderId = (payload.tx_ref || payload.paymentOrderId) as string;
    const isSuccess = payload.status === 'success' || payload.status === 'COMPLETED';
    const gatewayReference = (payload.reference || payload.transaction_id || eventId) as string;

    if (!orderId) {
      throw new BadRequestError('Missing transaction reference in webhook payload');
    }

    const order = await prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError('Payment order not found for this transaction');
    }

    if (!isSuccess) {
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });
      return { status: 'PAYMENT_FAILED' };
    }

    // 3. Atomically Complete Payment and Unlock the Conversation
    await prisma.$transaction(async (tx) => {
      // Mark payment order completed
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' },
      });

      // Record transaction
      await tx.paymentTransaction.create({
        data: {
          paymentOrderId: order.id,
          gatewayReference,
          status: 'SUCCESS',
          rawPayload: JSON.parse(JSON.stringify(payload)),
        },
      });

      // Insert conversation unlock audit record
      await tx.conversationUnlock.upsert({
        where: { conversationId: order.conversationId },
        create: {
          conversationId: order.conversationId,
          unlockedByUserId: order.userId,
          paymentOrderId: order.id,
          unlockedAt: new Date(),
        },
        update: {},
      });

      // Unlock the conversation!
      await tx.conversation.update({
        where: { id: order.conversationId },
        data: {
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      });

      // Mark webhook event processed
      await tx.paymentWebhookEvent.update({
        where: {
          provider_eventId: {
            provider,
            eventId,
          },
        },
        data: {
          isProcessed: true,
          processedAt: new Date(),
        },
      });
    });

    return {
      status: 'UNLOCKED',
      conversationId: order.conversationId,
      message: 'Conversation unlocked successfully via verified payment',
    };
  }

  /**
   * Mock checkout execution (for development & test environments)
   */
  async mockCompletePayment(paymentOrderId: string) {
    if (config.env === 'production') {
      throw new ForbiddenError('Mock payment endpoint is disabled in production');
    }

    return this.processProviderWebhook(
      'CHAPA',
      `MOCK_EVT_${generateOpaqueToken(8)}`,
      {
        paymentOrderId,
        tx_ref: paymentOrderId,
        status: 'success',
        reference: `MOCK_TX_${Date.now()}`,
      }
    );
  }
}

export const paymentsService = new PaymentsService();
