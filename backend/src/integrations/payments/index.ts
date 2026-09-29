import { generateOpaqueToken } from '../../utils/crypto';

export interface PaymentOrderParams {
  userId: string;
  conversationId: string;
  amount: number;
  currency: string;
}

export interface PaymentInitiationResult {
  paymentReference: string;
  checkoutUrl: string;
}

export interface PaymentWebhookVerificationResult {
  paymentId: string;
  isSuccessful: boolean;
  gatewayTransactionId: string;
}

export interface IPaymentProvider {
  name: string;
  initiatePayment(params: PaymentOrderParams): Promise<PaymentInitiationResult>;
  verifyWebhook(payload: Record<string, unknown>, signature?: string): Promise<PaymentWebhookVerificationResult>;
}

export class ChapaPaymentProvider implements IPaymentProvider {
  name = 'CHAPA';

  async initiatePayment(params: PaymentOrderParams): Promise<PaymentInitiationResult> {
    const paymentReference = `CHAPA_${params.conversationId.substring(0, 8)}_${generateOpaqueToken(8)}`;
    return {
      paymentReference,
      checkoutUrl: `https://checkout.chapa.co/checkout/payment/${paymentReference}`,
    };
  }

  async verifyWebhook(payload: Record<string, unknown>): Promise<PaymentWebhookVerificationResult> {
    const paymentId = (payload.paymentId || payload.tx_ref) as string;
    const isSuccessful = payload.status === 'success' || payload.status === 'COMPLETED';
    const gatewayTransactionId = (payload.transaction_id || payload.reference || 'GATEWAY_TX') as string;

    return {
      paymentId,
      isSuccessful,
      gatewayTransactionId,
    };
  }
}

export class TelebirrPaymentProvider implements IPaymentProvider {
  name = 'TELEBIRR';

  async initiatePayment(params: PaymentOrderParams): Promise<PaymentInitiationResult> {
    const paymentReference = `TELEBIRR_${params.conversationId.substring(0, 8)}_${generateOpaqueToken(8)}`;
    return {
      paymentReference,
      checkoutUrl: `https://telebirr.et/pay?ref=${paymentReference}`,
    };
  }

  async verifyWebhook(payload: Record<string, unknown>): Promise<PaymentWebhookVerificationResult> {
    const paymentId = (payload.paymentId || payload.outTradeNo) as string;
    const isSuccessful = payload.tradeStatus === 'COMPLETED' || payload.status === 'success';
    const gatewayTransactionId = (payload.tradeNo || 'TELEBIRR_TX') as string;

    return {
      paymentId,
      isSuccessful,
      gatewayTransactionId,
    };
  }
}

export function getPaymentProvider(name = 'CHAPA'): IPaymentProvider {
  switch (name.toUpperCase()) {
    case 'TELEBIRR':
      return new TelebirrPaymentProvider();
    default:
      return new ChapaPaymentProvider();
  }
}
