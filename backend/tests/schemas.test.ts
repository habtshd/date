import assert from 'assert';
import { RequestOtpSchema, VerifyOtpSchema } from '../src/modules/auth/auth.schema';
import {
  createProfileSchema,
  updateProfileSchema,
  updatePreferencesSchema,
  uploadPhotoUrlSchema,
  completePhotoUploadSchema,
} from '../src/modules/profiles/profile.schema';
import { CreatePaymentSchema } from '../src/modules/payments/payments.schema';
import { FileReportSchema } from '../src/modules/reports/reports.schema';
import { calculateAge } from '../src/utils/age';

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

  // 3. Profile Schema (createProfileSchema & updateProfileSchema)
  const validProfile = createProfileSchema.safeParse({
    firstName: 'Sara',
    dateOfBirth: '2000-05-15',
    gender: 'FEMALE',
    city: 'Addis Ababa',
    bio: 'Hello Ethiopia',
    relationshipGoal: 'SERIOUS_RELATIONSHIP',
  });
  assert.strictEqual(validProfile.success, true);

  const invalidProfile = createProfileSchema.safeParse({
    firstName: 'S', // Too short
    dateOfBirth: 'not-a-date',
    gender: 'UNKNOWN',
    city: '',
  });
  assert.strictEqual(invalidProfile.success, false);

  const validPartial = updateProfileSchema.safeParse({
    bio: 'Updated bio text',
  });
  assert.strictEqual(validPartial.success, true);
  console.log('    ✓ Profile create & update schema validation confirmed');

  // 4. Preferences Schema (minAge <= maxAge check)
  const validPref = updatePreferencesSchema.safeParse({
    minAge: 20,
    maxAge: 35,
    preferredGender: 'FEMALE',
    preferredCity: 'Addis Ababa',
  });
  assert.strictEqual(validPref.success, true);

  const invalidPref = updatePreferencesSchema.safeParse({
    minAge: 40,
    maxAge: 25, // minAge > maxAge must fail
  });
  assert.strictEqual(invalidPref.success, false);
  console.log('    ✓ Preferences minAge <= maxAge validation confirmed');

  // 5. Photos Schemas (Allowed MIME types & photo completion)
  assert.strictEqual(uploadPhotoUrlSchema.safeParse({ mimeType: 'image/jpeg' }).success, true);
  assert.strictEqual(uploadPhotoUrlSchema.safeParse({ mimeType: 'image/png' }).success, true);
  assert.strictEqual(uploadPhotoUrlSchema.safeParse({ mimeType: 'image/webp' }).success, true);
  assert.strictEqual(uploadPhotoUrlSchema.safeParse({ mimeType: 'application/pdf' }).success, false);
  assert.strictEqual(uploadPhotoUrlSchema.safeParse({ mimeType: 'image/gif' }).success, false);

  assert.strictEqual(
    completePhotoUploadSchema.safeParse({
      storageKey: 'profiles/uuid/photo.jpg',
      isPrimary: true,
    }).success,
    true
  );
  console.log('    ✓ Photo upload URL & completion schema validation confirmed');

  // 6. Age Calculator (Server-side 18+ enforcement)
  const now = new Date();
  const exactly18 = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  assert.strictEqual(calculateAge(exactly18), 18);

  const almost18 = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate() + 2);
  assert.strictEqual(calculateAge(almost18), 17);

  const adult25 = new Date(now.getFullYear() - 25, now.getMonth(), now.getDate());
  assert.strictEqual(calculateAge(adult25), 25);
  console.log('    ✓ Server-side calculateAge utility verified for adult-only enforcement');

  // 7. Payment Creation Schema
  const validPayment = CreatePaymentSchema.safeParse({
    conversationId: '123e4567-e89b-12d3-a456-426614174000',
    provider: 'CHAPA',
  });
  assert.strictEqual(validPayment.success, true);

  // 8. Report Schema
  const validReport = FileReportSchema.safeParse({
    reportedUserId: '123e4567-e89b-12d3-a456-426614174000',
    reason: 'HARASSMENT',
    description: 'Inappropriate behavior',
  });
  assert.strictEqual(validReport.success, true);
}
