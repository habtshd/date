import assert from 'assert';
import jwt from 'jsonwebtoken';
import { buildApp } from '../src/app';
import { env } from '../src/config/env';
import { MockPaymentProvider } from '../src/integrations/payments/mock.provider';
import { ChapaPaymentProvider } from '../src/integrations/payments/provider';

export async function runPaymentsChatTests() {
  console.log('  ▶ Testing Payments, Conversation Unlock & Private Chat (Phase 3E)...');

  // 1. Payment Provider Abstraction Unit Tests
  const mockProvider = new MockPaymentProvider();
  const createRes = await mockProvider.createPayment({
    paymentId: '00000000-0000-0000-0000-000000000001',
    amount: 50.0,
    currency: 'ETB',
    customerReference: 'cust-1',
  });
  assert.ok(createRes.providerReference.startsWith('MOCK_TX_'));
  assert.ok(createRes.paymentUrl.includes('checkout'));
  console.log('    ✓ Mock payment provider initiates order with checkout URL');

  const webhookVerify = await mockProvider.verifyWebhook({
    providerReference: createRes.providerReference,
    status: 'SUCCESS',
  });
  assert.strictEqual(webhookVerify.status, 'SUCCESS');
  assert.strictEqual(webhookVerify.providerReference, createRes.providerReference);
  console.log('    ✓ Payment webhook verification confirmed');

  // 2. Chapa Provider reference generation
  const chapa = new ChapaPaymentProvider('test-chapa-secret');
  const chapaRes = await chapa.createPayment({
    paymentId: '11111111-1111-1111-1111-111111111111',
    amount: 50.0,
    currency: 'ETB',
    customerReference: 'cust-2',
  });
  assert.ok(chapaRes.providerReference.startsWith('CHAPA_TX_'));
  console.log('    ✓ Chapa provider generates valid checkout session');

  // 3. Fastify HTTP Endpoints Security & Gating
  const app = await buildApp();
  await app.ready();

  const conversationId = '33333333-3333-3333-3333-333333333333';

  // 4. Unauthenticated access rejected with 401
  const unauthPaymentCreate = await app.inject({
    method: 'POST',
    url: '/api/v1/payments/create',
    payload: { conversationId },
  });
  assert.strictEqual(unauthPaymentCreate.statusCode, 401);
  console.log('    ✓ Unauthenticated POST /api/v1/payments/create rejected with 401');

  const unauthConvPayment = await app.inject({
    method: 'POST',
    url: `/api/v1/conversations/${conversationId}/payment`,
  });
  assert.strictEqual(unauthConvPayment.statusCode, 401);
  console.log('    ✓ Unauthenticated POST /api/v1/conversations/:id/payment rejected with 401');

  const unauthConversations = await app.inject({
    method: 'GET',
    url: '/api/v1/conversations',
  });
  assert.strictEqual(unauthConversations.statusCode, 401);
  console.log('    ✓ Unauthenticated GET /api/v1/conversations rejected with 401');

  const unauthMessages = await app.inject({
    method: 'GET',
    url: `/api/v1/conversations/${conversationId}/messages`,
  });
  assert.strictEqual(unauthMessages.statusCode, 401);
  console.log('    ✓ Unauthenticated GET /api/v1/conversations/:id/messages rejected with 401');

  const unauthSendMessage = await app.inject({
    method: 'POST',
    url: `/api/v1/conversations/${conversationId}/messages`,
    payload: { content: 'Hello there' },
  });
  assert.strictEqual(unauthSendMessage.statusCode, 401);
  console.log('    ✓ Unauthenticated POST /api/v1/conversations/:id/messages rejected with 401');

  // 5. Public payment webhook endpoint accepts valid payloads
  const webhookRes = await app.inject({
    method: 'POST',
    url: '/api/v1/payments/webhook',
    payload: {
      providerReference: 'UNKNOWN_REF',
      status: 'success',
    },
  });
  // Should reject unknown reference or return 500/handled error without crashing
  assert.ok(webhookRes.statusCode !== 401);
  console.log('    ✓ Public payment webhook endpoint reachable without user JWT');

  await app.close();
}
