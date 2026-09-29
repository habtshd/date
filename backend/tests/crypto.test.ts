import assert from 'assert';
import { getCanonicalPair, hashSecret, verifySecret, generateRandomOtp } from '../src/utils/crypto';

export async function runCryptoTests() {
  console.log('  ▶ Testing Cryptography and Invariants...');

  // 1. Canonical pair ordering (user_a_id < user_b_id)
  const id1 = '00000000-0000-0000-0000-000000000001';
  const id2 = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  const pair1 = getCanonicalPair(id1, id2);
  assert.strictEqual(pair1.userAId, id1);
  assert.strictEqual(pair1.userBId, id2);

  const pair2 = getCanonicalPair(id2, id1);
  assert.strictEqual(pair2.userAId, id1);
  assert.strictEqual(pair2.userBId, id2);

  assert.throws(() => getCanonicalPair(id1, id1), /paired with themselves/);
  console.log('    ✓ Canonical pair invariant (user_a_id < user_b_id) verified');

  // 2. Argon2id Password / Secret Hashing
  const secret = 'super-secret-password-123';
  const hash = await hashSecret(secret);
  assert.ok(hash.startsWith('$argon2id$'), 'Hash must use Argon2id variant');

  const isValid = await verifySecret(hash, secret);
  assert.strictEqual(isValid, true, 'Correct secret must verify successfully');

  const isInvalid = await verifySecret(hash, 'wrong-password');
  assert.strictEqual(isInvalid, false, 'Incorrect secret must fail verification');
  console.log('    ✓ Argon2id hash generation and verification confirmed');

  // 3. Cryptographically random OTP
  const otp = generateRandomOtp();
  assert.strictEqual(otp.length, 6);
  assert.match(otp, /^\d{6}$/);
  console.log('    ✓ 6-digit cryptographic OTP generation confirmed');
}
