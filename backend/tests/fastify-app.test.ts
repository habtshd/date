import assert from 'assert';
import jwt from 'jsonwebtoken';
import { buildApp } from '../src/app';
import { env } from '../src/config/env';

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

  // 2. Unauthenticated request to protected profile route
  const protectedRes = await app.inject({
    method: 'GET',
    url: '/api/v1/profile',
  });
  assert.strictEqual(protectedRes.statusCode, 401);
  const protectedBody = JSON.parse(protectedRes.payload);
  assert.strictEqual(protectedBody.success, false);
  console.log('    ✓ Unauthenticated GET /api/v1/profile rejected with 401');

  // 3. Public interests reference endpoint
  const interestsRes = await app.inject({
    method: 'GET',
    url: '/api/v1/profile/interests',
  });
  assert.strictEqual(interestsRes.statusCode, 200);
  const interestsBody = JSON.parse(interestsRes.payload);
  assert.strictEqual(interestsBody.success, true);
  assert.ok(Array.isArray(interestsBody.interests));
  console.log('    ✓ GET /api/v1/profile/interests returned 200 with interests list');

  // 4. Validation rejection on invalid phone OTP request
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

  // 5. Admin login rejection on bad credentials
  const badAdminLogin = await app.inject({
    method: 'POST',
    url: '/api/v1/admin/login',
    payload: {
      email: 'admin@habeshadate.et',
      password: 'wrong-password',
    },
  });
  assert.strictEqual(badAdminLogin.statusCode, 500);
  console.log('    ✓ Invalid admin login rejected');

  // 6. Authenticated user photo upload authorization test
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testToken = jwt.sign(
    { userId: testUserId, phoneNumber: '+251911223344' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const unauthPhotoUpload = await app.inject({
    method: 'POST',
    url: '/api/v1/photos/upload-url',
    payload: { mimeType: 'image/jpeg' },
  });
  assert.strictEqual(unauthPhotoUpload.statusCode, 401);
  console.log('    ✓ Unauthenticated photo upload rejected with 401');

  await app.close();
}
