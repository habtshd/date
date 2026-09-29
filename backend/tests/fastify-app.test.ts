import assert from 'assert';
import { buildApp } from '../src/app';

export async function runFastifyAppTests() {
  console.log('  ▶ Testing Fastify HTTP & Route Integrations via app.inject()...');

  const app = await buildApp();
  await app.ready();

  // 1. Health check endpoint
  const healthRes = await app.inject({
    method: 'GET',
    url: '/health',
  });
  assert.strictEqual(healthRes.statusCode, 200);
  const healthBody = JSON.parse(healthRes.payload);
  assert.strictEqual(healthBody.status, 'UP');
  assert.strictEqual(healthBody.platform, 'Ethiopian Dating API');
  console.log('    ✓ GET /health returned 200 UP');

  // 2. Unauthenticated request to protected route
  const protectedRes = await app.inject({
    method: 'GET',
    url: '/api/v1/profiles/me',
  });
  assert.strictEqual(protectedRes.statusCode, 401);
  const protectedBody = JSON.parse(protectedRes.payload);
  assert.strictEqual(protectedBody.success, false);
  console.log('    ✓ Unauthenticated GET /api/v1/profiles/me rejected with 401');

  // 3. Validation rejection on invalid phone OTP request
  const invalidOtpRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/send-otp',
    payload: {
      phoneNumber: 'invalid-number',
    },
  });
  assert.strictEqual(invalidOtpRes.statusCode, 422);
  const invalidOtpBody = JSON.parse(invalidOtpRes.payload);
  assert.strictEqual(invalidOtpBody.success, false);
  assert.ok(invalidOtpBody.details.length > 0);
  console.log('    ✓ Invalid payload rejected by Zod error handler with 422');

  // 4. Admin login rejection on bad credentials
  const badAdminLogin = await app.inject({
    method: 'POST',
    url: '/api/v1/admin/login',
    payload: {
      email: 'admin@habeshadate.et',
      password: 'wrong-password',
    },
  });
  assert.strictEqual(badAdminLogin.statusCode, 500); // Throws Error('Invalid credentials') handled gracefully
  console.log('    ✓ Invalid admin login rejected');

  await app.close();
}
