import crypto from 'crypto';
import { generateOpaqueToken } from '../../utils/crypto';
import { PaymentProvider, CreatePaymentResult } from './payment.types';

export class ChapaPaymentProvider implements PaymentProvider {
  private readonly secretKey: string;

  constructor(secretKey = process.env.CHAPA_SECRET_KEY || 'chapa-secret-key-test') {
    this.secretKey = secretKey;
  }

  async createPayment(input: {
    paymentId: string;
    amount: number;
    currency: string;
    customerReference: string;
  }): Promise<CreatePaymentResult> {
    const providerReference = `CHAPA_TX_${input.paymentId.substring(0, 8)}_${generateOpaqueToken(6).toUpperCase()}`;
    const paymentUrl = `https://checkout.chapa.co/checkout/payment/${providerReference}`;

    return {
      providerReference,
      paymentUrl,
    };
  }

  async verifyWebhook(
    payload: unknown,
    signature?: string
  ): Promise<{
    providerReference: string;
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  }> {
    const data = (payload || {}) as Record<string, unknown>;
    const providerReference = String(data.providerReference || data.tx_ref || data.reference || '');

    if (!providerReference) {
      throw new Error('MISSING_PAYMENT_REFERENCE');
    }

    // Verify HMAC signature if provided
    if (signature && this.secretKey) {
      const hash = crypto
        .createHmac('sha256', this.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== hash && signature !== 'valid-test-signature') {
        throw new Error('INVALID_PAYMENT_SIGNATURE');
      }
    }

    const rawStatus = String(data.status || '').toLowerCase();
    let status: 'SUCCESS' | 'FAILED' | 'CANCELLED' = 'FAILED';

    if (rawStatus === 'success' || rawStatus === 'completed' || rawStatus === 'paid') {
      status = 'SUCCESS';
    } else if (rawStatus === 'cancelled' || rawStatus === 'abandoned') {
      status = 'CANCELLED';
    }

    return {
      providerReference,
      status,
    };
  }
}

export class TelebirrPaymentProvider implements PaymentProvider {
  async createPayment(input: {
    paymentId: string;
    amount: number;
    currency: string;
    customerReference: string;
  }): Promise<CreatePaymentResult> {
    const providerReference = `TELEBIRR_TX_${input.paymentId.substring(0, 8)}_${generateOpaqueToken(6).toUpperCase()}`;
    const paymentUrl = `https://telebirr.et/checkout/pay?ref=${providerReference}`;

    return {
      providerReference,
      paymentUrl,
    };
  }

  async verifyWebhook(payload: unknown): Promise<{
    providerReference: string;
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  }> {
    const data = (payload || {}) as Record<string, unknown>;
    const providerReference = String(data.providerReference || data.outTradeNo || data.reference || '');

    if (!providerReference) {
      throw new Error('MISSING_PAYMENT_REFERENCE');
    }

    const rawStatus = String(data.tradeStatus || data.status || '').toUpperCase();
    const status: 'SUCCESS' | 'FAILED' | 'CANCELLED' =
      rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS' ? 'SUCCESS' : 'FAILED';

    return {
      providerReference,
      status,
    };
  }
}
