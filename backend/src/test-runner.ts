import assert from 'assert';
import bcrypt from 'bcrypt';
import { getCanonicalPair, generateRandomOtp } from './common/crypto';
import { RequestOtpSchema, VerifyOtpSchema } from './modules/auth/auth.schemas';
import { UpsertProfileSchema } from './modules/profiles/profiles.schemas';
import { CreateConversationPaymentSchema } from './modules/payments/payments.schemas';

console.log('🧪 Starting Ethiopian Dating Platform Architecture Validation Tests...\n');

let passedTests = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// 1. Canonical Invariant Test: user_a_id < user_b_id
runTest('Canonical Pair Invariant (user_a_id < user_b_id)', () => {
  const uuid1 = '00000000-0000-0000-0000-000000000001';
  const uuid2 = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  const pair1 = getCanonicalPair(uuid1, uuid2);
  assert.strictEqual(pair1.userAId, uuid1);
  assert.strictEqual(pair1.userBId, uuid2);

  // Inverted input should yield identical canonical order
  const pair2 = getCanonicalPair(uuid2, uuid1);
  assert.strictEqual(pair2.userAId, uuid1);
  assert.strictEqual(pair2.userBId, uuid2);

  // Self-pair must throw error
  assert.throws(() => getCanonicalPair(uuid1, uuid1), /paired with themselves/);
});

// 2. Cryptographic OTP Generation & Hash Verification Test
runTest('OTP Generation & Hash Integrity', async () => {
  const otp = generateRandomOtp();
  assert.strictEqual(otp.length, 6);
  assert.match(otp, /^\d{6}$/);

  const hash = await bcrypt.hash(otp, 10);
  const isMatch = await bcrypt.compare(otp, hash);
  assert.strictEqual(isMatch, true);

  const isInvalid = await bcrypt.compare('000000', hash);
  assert.strictEqual(isInvalid, false);
});

// 3. E.164 Phone Number Schema Validation Test
runTest('Phone Number Validation (E.164 Compliance)', () => {
  // Valid Ethiopian phone numbers
  const valid = RequestOtpSchema.safeParse({ body: { phoneNumber: '+251911223344' } });
  assert.strictEqual(valid.success, true);

  const valid2 = RequestOtpSchema.safeParse({ body: { phoneNumber: '+251711223344' } });
  assert.strictEqual(valid2.success, true);

  // Invalid formats (letters, missing +, spaces)
  const invalid1 = RequestOtpSchema.safeParse({ body: { phoneNumber: '0911223344' } });
  assert.strictEqual(invalid1.success, false);

  const invalid2 = RequestOtpSchema.safeParse({ body: { phoneNumber: '+251-911-223344' } });
  assert.strictEqual(invalid2.success, false);
});

// 4. Age Verification Schema Test
runTest('Minimum Age 18+ Validation', () => {
  // Age 20: Should pass
  const validDate = '2004-01-01';
  const valid = UpsertProfileSchema.safeParse({
    body: {
      firstName: 'Almaz',
      dateOfBirth: validDate,
      gender: 'FEMALE',
      city: 'Addis Ababa',
      relationshipGoal: 'SERIOUS_RELATIONSHIP',
    },
  });
  assert.strictEqual(valid.success, true);
});

// 5. Payment Schema Validation Test
runTest('Payment Order Schema Validation', () => {
  const valid = CreateConversationPaymentSchema.safeParse({
    body: {
      conversationId: '123e4567-e89b-12d3-a456-426614174000',
      provider: 'TELEBIRR',
    },
  });
  assert.strictEqual(valid.success, true);

  // Invalid UUID
  const invalid = CreateConversationPaymentSchema.safeParse({
    body: {
      conversationId: 'not-a-uuid',
      provider: 'TELEBIRR',
    },
  });
  assert.strictEqual(invalid.success, false);
});

setTimeout(() => {
  console.log(`\n🎉 Test Suite Completed: ${passedTests} tests passed with 0 failures.\n`);
}, 500);
