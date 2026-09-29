import { Router } from 'express';
import { adminController } from './admin.controller';
import { requireAdmin } from '../../middleware/admin.guard';
import { validate } from '../../middleware/validate';
import { AdminLoginSchema, AdminModerationActionSchema } from './admin.schemas';

const router = Router();

router.post(
  '/login',
  validate(AdminLoginSchema),
  adminController.login
);

router.get(
  '/dashboard',
  requireAdmin(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']),
  adminController.getDashboard
);

router.get(
  '/reports',
  requireAdmin(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']),
  adminController.getReports
);

router.post(
  '/moderation/action',
  requireAdmin(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']),
  validate(AdminModerationActionSchema),
  adminController.takeModerationAction
);

router.get(
  '/audit-logs',
  requireAdmin(['SUPER_ADMIN', 'ADMIN']),
  adminController.getAuditLogs
);

export const adminRouter = router;
