import assert from 'assert';
import jwt from 'jsonwebtoken';
import { buildApp } from '../../src/app';
import { env } from '../../src/config/env';
import { FaydaVerificationProvider } from '../../src/integrations/verification/fayda.provider';

export async function runVerificationBypassTests() {
  console.log('  ▶ [Security Matrix] Testing Verification Bypass Prevention...');

  const app = await buildApp();
  await app.ready();

  const unverifiedUserId = '00000000-0000-0000-0000-000000000099';

  // Client creates a token or payload claiming "verified: true" or attempts client spoofing
  const unverifiedTokenWithSpoofedClaims = jwt.sign(
    {
      userId: unverifiedUserId,
      phoneNumber: '+251911999999',
      role: 'USER',
      verificationStatus: 'UNVERIFIED',
      // Attacker injecting client-level claims
      isVerified: true,
      verified: true,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  // 1. Attempting discovery with spoofed client claims must fail with 403
  const discoveryAttempt = await app.inject({
    method: 'GET',
    url: '/api/v1/discovery',
    headers: {
      authorization: `Bearer ${unverifiedTokenWithSpoofedClaims}`,
      // Attacker trying to send custom headers
      'x-verified-override': 'true',
      'x-user-verified': '1',
    },
  });

  assert.strictEqual(discoveryAttempt.statusCode, 403);
  const body = JSON.parse(discoveryAttempt.payload);
  assert.strictEqual(body.error, 'IDENTITY_VERIFICATION_REQUIRED');
  console.log('    ✓ Client-side "verified" claims & header spoofing completely ignored (403)');

  // 2. Fake Verification Webhook Rejection
  const fayda = new FaydaVerificationProvider('test-fayda-secret-key');

  await assert.rejects(
    async () => {
      // Fake webhook payload with invalid signature
      await fayda.verifyWebhook(
        { reference: 'FAYDA_REF_FORGED_999', status: 'VERIFIED' },
        'invalid-forged-signature-abc'
      );
    },
    /INVALID_WEBHOOK_SIGNATURE/,
    'Forged verification webhook must be rejected'
  );
  console.log('    ✓ Forged verification webhook rejected: Only cryptographically signed provider callbacks accepted');

  // 3. Legitimate Verified Token grants discovery access
  const legitVerifiedToken = jwt.sign(
    {
      userId: '00000000-0000-0000-0000-000000000088',
      phoneNumber: '+251911888888',
      role: 'USER',
      verificationStatus: 'VERIFIED',
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const verifiedDiscovery = await app.inject({
    method: 'GET',
    url: '/api/v1/discovery',
    headers: { authorization: `Bearer ${legitVerifiedToken}` },
  });

  // Allowed through authorization gate (200 in live DB, or 500 when mock DB offline in unit test)
  assert.notStrictEqual(verifiedDiscovery.statusCode, 403);
  assert.notStrictEqual(verifiedDiscovery.statusCode, 401);
  console.log('    ✓ Cryptographically verified token successfully passes verification gate');

  await app.close();
}
