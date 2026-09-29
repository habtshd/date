import assert from 'assert';
import jwt from 'jsonwebtoken';
import { buildApp } from '../src/app';
import { env } from '../src/config/env';
import { isBlocked } from '../src/modules/blocks/blocks.service';
import { FileReportSchema } from '../src/modules/reports/reports.schema';
import { AdminModerationActionSchema, AdminUpdateReportSchema } from '../src/modules/admin/admin.schema';

export async function runSafetyTests() {
  console.log('  ▶ Testing Blocks, Reports, Moderation & Safety Policies (Phase 3F)...');

  // 1. Policy helper unit tests
  assert.strictEqual(typeof isBlocked, 'function');
  console.log('    ✓ Reusable isBlocked policy helper exported');

  // 2. Report validation schema tests
  const validReport = FileReportSchema.safeParse({
    reportedUserId: '00000000-0000-0000-0000-000000000002',
    reason: 'SCAM',
    description: 'User requested money for train ticket before meeting.',
  });
  assert.strictEqual(validReport.success, true);
  console.log('    ✓ Valid report input correctly parsed by schema');

  // Description > 2000 chars rejected
  const longDescription = 'A'.repeat(2001);
  const invalidReport = FileReportSchema.safeParse({
    reportedUserId: '00000000-0000-0000-0000-000000000002',
    reason: 'HARASSMENT',
    description: longDescription,
  });
  assert.strictEqual(invalidReport.success, false);
  console.log('    ✓ Report description > 2000 characters rejected by schema');

  // Invalid reason rejected
  const invalidReason = FileReportSchema.safeParse({
    reportedUserId: '00000000-0000-0000-0000-000000000002',
    reason: 'INVALID_REASON',
  });
  assert.strictEqual(invalidReason.success, false);
  console.log('    ✓ Unknown report reason rejected by schema');

  // 3. Moderation action validation schemas
  const validModerationAction = AdminModerationActionSchema.safeParse({
    targetUserId: '00000000-0000-0000-0000-000000000003',
    actionType: 'TEMPORARY_SUSPENSION',
    reason: 'Multiple verified reports of financial solicitation',
  });
  assert.strictEqual(validModerationAction.success, true);

  const validReportUpdate = AdminUpdateReportSchema.safeParse({
    status: 'RESOLVED',
    resolutionNotes: 'User was temporarily suspended',
  });
  assert.strictEqual(validReportUpdate.success, true);
  console.log('    ✓ Moderation action and report status update schemas verified');

  // 4. Fastify HTTP Endpoints Security & Authorization
  const app = await buildApp();
  await app.ready();

  const userAId = '00000000-0000-0000-0000-000000000001';
  const userBId = '00000000-0000-0000-0000-000000000002';
  const moderatorId = '00000000-0000-0000-0000-000000000004';
  const adminId = '00000000-0000-0000-0000-000000000005';

  const userToken = jwt.sign(
    { userId: userAId, phoneNumber: '+251911000001', role: 'USER', verificationStatus: 'VERIFIED' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const moderatorToken = jwt.sign(
    { userId: moderatorId, phoneNumber: '+251911000004', role: 'MODERATOR', verificationStatus: 'VERIFIED' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  // 5. Unauthenticated safety endpoints rejected with 401
  const unauthBlock = await app.inject({
    method: 'POST',
    url: `/api/v1/blocks/${userBId}`,
  });
  assert.strictEqual(unauthBlock.statusCode, 401);
  console.log('    ✓ Unauthenticated POST /api/v1/blocks/:userId rejected with 401');

  const unauthUnblock = await app.inject({
    method: 'DELETE',
    url: `/api/v1/blocks/${userBId}`,
  });
  assert.strictEqual(unauthUnblock.statusCode, 401);
  console.log('    ✓ Unauthenticated DELETE /api/v1/blocks/:userId rejected with 401');

  const unauthGetBlocks = await app.inject({
    method: 'GET',
    url: '/api/v1/blocks',
  });
  assert.strictEqual(unauthGetBlocks.statusCode, 401);
  console.log('    ✓ Unauthenticated GET /api/v1/blocks rejected with 401');

  const unauthReport = await app.inject({
    method: 'POST',
    url: '/api/v1/reports',
    payload: {
      reportedUserId: userBId,
      reason: 'SPAM',
    },
  });
  assert.strictEqual(unauthReport.statusCode, 401);
  console.log('    ✓ Unauthenticated POST /api/v1/reports rejected with 401');

  // 6. User cannot block self (400 CANNOT_BLOCK_SELF)
  const selfBlockRes = await app.inject({
    method: 'POST',
    url: `/api/v1/blocks/${userAId}`,
    headers: { authorization: `Bearer ${userToken}` },
  });
  assert.strictEqual(selfBlockRes.statusCode, 400);
  const selfBlockBody = JSON.parse(selfBlockRes.payload);
  assert.strictEqual(selfBlockBody.error, 'CANNOT_BLOCK_SELF');
  console.log('    ✓ Self-block rejected with 400 CANNOT_BLOCK_SELF');

  // 7. User cannot report self (400 CANNOT_REPORT_SELF)
  const selfReportRes = await app.inject({
    method: 'POST',
    url: '/api/v1/reports',
    headers: { authorization: `Bearer ${userToken}` },
    payload: {
      reportedUserId: userAId,
      reason: 'HARASSMENT',
    },
  });
  assert.strictEqual(selfReportRes.statusCode, 400);
  const selfReportBody = JSON.parse(selfReportRes.payload);
  assert.strictEqual(selfReportBody.error, 'CANNOT_REPORT_SELF');
  console.log('    ✓ Self-report rejected with 400 CANNOT_REPORT_SELF');

  // 8. Role-based Access Control (RBAC): Regular USER cannot access moderator/admin queue (403)
  const userAccessReports = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/reports',
    headers: { authorization: `Bearer ${userToken}` },
  });
  assert.strictEqual(userAccessReports.statusCode, 403);
  console.log('    ✓ Normal USER role rejected from /admin/reports with 403 FORBIDDEN');

  const userAccessModeration = await app.inject({
    method: 'POST',
    url: '/api/v1/admin/moderation',
    headers: { authorization: `Bearer ${userToken}` },
    payload: {
      targetUserId: userBId,
      actionType: 'WARNING',
      reason: 'Test warning',
    },
  });
  assert.strictEqual(userAccessModeration.statusCode, 403);
  console.log('    ✓ Normal USER role rejected from /admin/moderation with 403 FORBIDDEN');

  // 9. MODERATOR role cannot access admin-only endpoints (/admin/users)
  const modAccessUsers = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/users',
    headers: { authorization: `Bearer ${moderatorToken}` },
  });
  assert.strictEqual(modAccessUsers.statusCode, 403);
  console.log('    ✓ MODERATOR role rejected from admin-only /admin/users with 403 FORBIDDEN');

  await app.close();
}
