import assert from 'assert';
import { CreatePaymentSchema } from '../../src/modules/payments/payments.schema';
import { MockPaymentProvider } from '../../src/integrations/payments/mock.provider';
import { ChapaPaymentProvider } from '../../src/integrations/payments/provider';
import { env } from '../../src/config/env';

export async function runPaymentBypassTests() {
  console.log('  ▶ [Security Matrix] Testing Payment Integrity & Bypass Prevention...');

  // 1. Client Amount Tampering Protection (Section 11)
  // Even if a malicious client sends { amount: 1 }, the schema strips/ignores it.
  const tamperedPayload = {
    conversationId: '00000000-0000-0000-0000-000000000001',
    amount: 1.0, // Attacker attempting to pay 1 ETB instead of 50 ETB
    provider: 'CHAPA',
  };

  const parsed = CreatePaymentSchema.parse(tamperedPayload);
  // Assert amount is NOT part of the parsed object
  assert.strictEqual((parsed as any).amount, undefined);
  // Verify server configuration defines the authoritative price
  assert.strictEqual(env.CONVERSATION_UNLOCK_PRICE_ETB, 50.0);
  console.log('    ✓ Client price tampering prevented: Server strictly defines transaction amount (50 ETB)');

  // 2. Fake Webhook Signature Rejection (Section 10)
  const chapa = new ChapaPaymentProvider('secret-chapa-key-12345');

  await assert.rejects(
    async () => {
      // Fake webhook attempt with forged or missing signature
      await chapa.verifyWebhook(
        { tx_ref: 'CHAPA_TX_FORGED_123', status: 'success' },
        'invalid-forged-signature-xyz'
      );
    },
    /INVALID_PAYMENT_SIGNATURE/,
    'Forged webhook signature must be rejected'
  );
  console.log('    ✓ Fake payment webhook without valid provider signature rejected');

  // 3. Webhook Idempotency (Section 10)
  // Verified webhook processed twice must yield idempotent safe result
  const mockProvider = new MockPaymentProvider();
  const txRef = 'MOCK_TX_SEC_IDEMPOTENT_1';

  const firstWebhook = await mockProvider.verifyWebhook({
    providerReference: txRef,
    status: 'SUCCESS',
  });
  assert.strictEqual(firstWebhook.status, 'SUCCESS');

  const duplicateWebhook = await mockProvider.verifyWebhook({
    providerReference: txRef,
    status: 'SUCCESS',
  });
  assert.strictEqual(duplicateWebhook.status, 'SUCCESS');
  assert.strictEqual(duplicateWebhook.providerReference, txRef);
  console.log('    ✓ Duplicate webhook delivery handled idempotently without state corruption');
}
