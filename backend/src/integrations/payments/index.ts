import { PaymentProvider } from './payment.types';
import { ChapaPaymentProvider, TelebirrPaymentProvider } from './provider';
import { MockPaymentProvider } from './mock.provider';
import { PaymentIntegrationService } from './payment.service';

export * from './payment.types';
export * from './provider';
export * from './mock.provider';
export * from './payment.service';

export function getPaymentProvider(name = 'CHAPA'): PaymentProvider {
  if (process.env.NODE_ENV === 'test' || name.toUpperCase() === 'MOCK') {
    return new MockPaymentProvider();
  }

  switch (name.toUpperCase()) {
    case 'TELEBIRR':
      return new TelebirrPaymentProvider();
    default:
      return new ChapaPaymentProvider();
  }
}

const defaultProvider = getPaymentProvider(process.env.PAYMENT_PROVIDER || 'CHAPA');
export const defaultPaymentIntegrationService = new PaymentIntegrationService(
  defaultProvider,
  defaultProvider instanceof MockPaymentProvider
    ? 'MOCK'
    : defaultProvider instanceof TelebirrPaymentProvider
    ? 'TELEBIRR'
    : 'CHAPA'
);
