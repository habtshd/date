import { defaultPaymentIntegrationService } from '../../integrations/payments';
import { prisma } from '../../plugins/prisma';

export class PaymentsService {
  /**
   * Create conversation payment session
   */
  async createConversationPayment(userId: string, conversationId: string) {
    return defaultPaymentIntegrationService.createConversationPayment(userId, conversationId);
  }

  /**
   * Compatibility alias for initiateConversationPayment
   */
  async initiateConversationPayment(userId: string, conversationId: string, _providerName = 'CHAPA') {
    return this.createConversationPayment(userId, conversationId);
  }

  /**
   * Process payment provider webhook
   */
  async processProviderWebhook(
    payload: Record<string, unknown>,
    signature?: string,
    _providerName = 'CHAPA'
  ) {
    return defaultPaymentIntegrationService.processWebhook(payload, signature);
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
}

export const paymentsService = new PaymentsService();
