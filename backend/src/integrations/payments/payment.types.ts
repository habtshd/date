export interface CreatePaymentResult {
  providerReference: string;
  paymentUrl: string;
}

export interface PaymentProvider {
  createPayment(input: {
    paymentId: string;
    amount: number;
    currency: string;
    customerReference: string;
  }): Promise<CreatePaymentResult>;

  verifyWebhook(
    payload: unknown,
    signature?: string
  ): Promise<{
    providerReference: string;
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  }>;
}
