import { PaymentProvider, CreatePaymentResult } from './payment.types';

export class MockPaymentProvider implements PaymentProvider {
  private nextStatus: 'SUCCESS' | 'FAILED' | 'CANCELLED' = 'SUCCESS';

  setNextStatus(status: 'SUCCESS' | 'FAILED' | 'CANCELLED') {
    this.nextStatus = status;
  }

  async createPayment(input: {
    paymentId: string;
    amount: number;
    currency: string;
    customerReference: string;
  }): Promise<CreatePaymentResult> {
    const providerReference = `MOCK_TX_${input.paymentId.substring(0, 8)}_${Date.now()}`;
    return {
      providerReference,
      paymentUrl: `https://checkout.mockpay.local/pay?ref=${providerReference}`,
    };
  }

  async verifyWebhook(
    payload: unknown,
    _signature?: string
  ): Promise<{
    providerReference: string;
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  }> {
    const data = (payload || {}) as Record<string, unknown>;
    const providerReference = String(data.providerReference || data.reference || 'MOCK_TX_DEFAULT');
    const rawStatus = String(data.status || this.nextStatus).toUpperCase();

    const status: 'SUCCESS' | 'FAILED' | 'CANCELLED' =
      rawStatus === 'FAILED' ? 'FAILED' : rawStatus === 'CANCELLED' ? 'CANCELLED' : 'SUCCESS';

    return {
      providerReference,
      status,
    };
  }
}
