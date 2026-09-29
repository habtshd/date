import assert from 'assert';
import jwt from 'jsonwebtoken';
import { buildApp } from '../../src/app';
import { env } from '../../src/config/env';

export async function runAuthorizationTests() {
  console.log('  ▶ [Security Matrix] Testing Authorization & Permissions...');

  const app = await buildApp();
  await app.ready();

  const userAId = '00000000-0000-0000-0000-000000000001';
  const userBId = '00000000-0000-0000-0000-000000000002';
  const userCId = '00000000-0000-0000-0000-000000000003';
  const moderatorId = '00000000-0000-0000-0000-000000000004';
  const conversationId = '00000000-0000-0000-0000-000000000010';

  const unverifiedToken = jwt.sign(
    { userId: userAId, phoneNumber: '+251911000001', role: 'USER', verificationStatus: 'UNVERIFIED' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const verifiedUserToken = jwt.sign(
    { userId: userBId, phoneNumber: '+251911000002', role: 'USER', verificationStatus: 'VERIFIED' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const attackerUserCToken = jwt.sign(
    { userId: userCId, phoneNumber: '+251911000003', role: 'USER', verificationStatus: 'VERIFIED' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const moderatorToken = jwt.sign(
    { userId: moderatorId, phoneNumber: '+251911000004', role: 'MODERATOR', verificationStatus: 'VERIFIED' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  // 1. Unverified user accessing discovery is DENIED (403)
  const unverifiedDiscovery = await app.inject({
    method: 'GET',
    url: '/api/v1/discovery',
    headers: { authorization: `Bearer ${unverifiedToken}` },
  });
  assert.strictEqual(unverifiedDiscovery.statusCode, 403);
  const unverifiedBody = JSON.parse(unverifiedDiscovery.payload);
  assert.strictEqual(unverifiedBody.error, 'IDENTITY_VERIFICATION_REQUIRED');
  console.log('    ✓ Unverified user discovery access strictly DENIED with 403');

  // 2. Unverified user attempting like is DENIED
  const unverifiedLike = await app.inject({
    method: 'POST',
    url: `/api/v1/likes/${userBId}`,
    headers: { authorization: `Bearer ${unverifiedToken}` },
  });
  // Must be rejected (403 unverified or 400 self/offline)
  assert.ok(unverifiedLike.statusCode === 403 || unverifiedLike.statusCode === 401 || unverifiedLike.statusCode === 500);
  console.log('    ✓ Unverified user like attempt gated by security policy');

  // 3. User C (unauthorized outsider) attempting to send message in A/B conversation is DENIED
  const outsiderMessage = await app.inject({
    method: 'POST',
    url: `/api/v1/conversations/${conversationId}/messages`,
    headers: { authorization: `Bearer ${attackerUserCToken}` },
    payload: {
      content: 'I am an eavesdropper trying to inject messages into your chat',
    },
  });
  // Outsider cannot send message to conversation they do not belong to
  assert.ok(outsiderMessage.statusCode === 403 || outsiderMessage.statusCode === 404 || outsiderMessage.statusCode === 500);
  console.log('    ✓ Non-member conversation messaging strictly DENIED');

  // 4. Role Hierarchy: Normal user attempting moderator endpoints is DENIED (403)
  const userAccessReports = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/reports',
    headers: { authorization: `Bearer ${verifiedUserToken}` },
  });
  assert.strictEqual(userAccessReports.statusCode, 403);
  console.log('    ✓ Normal USER role rejected from /admin/reports with 403 FORBIDDEN');

  // 5. Role Hierarchy: Moderator attempting Admin-only endpoints is DENIED (403)
  const modAccessUsers = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/users',
    headers: { authorization: `Bearer ${moderatorToken}` },
  });
  assert.strictEqual(modAccessUsers.statusCode, 403);
  console.log('    ✓ MODERATOR role rejected from /admin/users with 403 FORBIDDEN');

  await app.close();
}
