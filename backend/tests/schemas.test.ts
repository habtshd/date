import assert from 'assert';
import { RequestOtpSchema, VerifyOtpSchema } from '../src/modules/auth/auth.schema';
import { UpsertProfileSchema } from '../src/modules/profiles/profile.schema';
import { CreatePaymentSchema } from '../src/modules/payments/payments.schema';
import { FileReportSchema } from '../src/modules/reports/reports.schema';

export function runSchemaTests() {
  console.log('  ▶ Testing Zod Schemas & Validation...');

  // 1. Phone number validation (E.164 compliance)
  assert.strictEqual(RequestOtpSchema.safeParse({ phoneNumber: '+251911223344' }).success, true);
  assert.strictEqual(RequestOtpSchema.safeParse({ phoneNumber: '+251711223344' }).success, true);
  assert.strictEqual(RequestOtpSchema.safeParse({ phoneNumber: '0911223344' }).success, false);
  assert.strictEqual(RequestOtpSchema.safeParse({ phoneNumber: 'invalid-phone-format' }).success, false);
  console.log('    ✓ Ethiopian E.164 phone number validation confirmed');

  // 2. OTP verification schema
  assert.strictEqual(
    VerifyOtpSchema.safeParse({
      phoneNumber: '+251911223344',
      code: '123456',
      deviceId: 'device-uuid-123',
    }).success,
    true
  );
  assert.strictEqual(
    VerifyOtpSchema.safeParse({
      phoneNumber: '+251911223344',
      code: '123',
      deviceId: 'device-uuid-123',
    }).success,
    false
  );
  console.log('    ✓ 6-digit OTP payload validation confirmed');

  // 3. Profile Schema
  const validProfile = UpsertProfileSchema.safeParse({
    firstName: 'Sara',
    dateOfBirth: '2000-05-15',
    gender: 'FEMALE',
    city: 'Addis Ababa',
    bio: 'Hello Ethiopia',
    relationshipGoal: 'SERIOUS_RELATIONSHIP',
  });
  assert.strictEqual(validProfile.success, true);

  const invalidProfile = UpsertProfileSchema.safeParse({
    firstName: 'S', // Too short
    dateOfBirth: 'not-a-date',
    gender: 'UNKNOWN',
    city: '',
  });
  assert.strictEqual(invalidProfile.success, false);
  console.log('    ✓ Profile upsert schema validation confirmed');

  // 4. Payment Creation Schema
  const validPayment = CreatePaymentSchema.safeParse({
    conversationId: '123e4567-e89b-12d3-a456-426614174000',
    provider: 'CHAPA',
  });
  assert.strictEqual(validPayment.success, true);

  const invalidPayment = CreatePaymentSchema.safeParse({
    conversationId: 'not-a-uuid',
    provider: 'CHAPA',
  });
  assert.strictEqual(invalidPayment.success, false);
  console.log('    ✓ Payment order creation schema confirmed');

  // 5. Report Schema
  const validReport = FileReportSchema.safeParse({
    reportedUserId: '123e4567-e89b-12d3-a456-426614174000',
    reason: 'HARASSMENT',
    description: 'Inappropriate behavior',
  });
  assert.strictEqual(validReport.success, true);
  console.log('    ✓ Safety report schema confirmed');
}
