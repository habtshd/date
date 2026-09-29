import { Router } from 'express';
import { verificationController } from './verification.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { SubmitVerificationSchema, VerificationWebhookSchema } from './verification.schemas';

const router = Router();

router.post(
  '/submit',
  requireAuth,
  validate(SubmitVerificationSchema),
  verificationController.submitVerification
);

router.get(
  '/status',
  requireAuth,
  verificationController.getStatus
);

router.post(
  '/webhook',
  validate(VerificationWebhookSchema),
  verificationController.handleWebhook
);

export const verificationRouter = router;
