import { Router } from 'express';
import { reportsController } from './reports.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { CreateReportSchema } from './reports.schemas';

const router = Router();

router.post(
  '/',
  requireAuth,
  validate(CreateReportSchema),
  reportsController.fileReport
);

export const reportsRouter = router;
