import { Router } from 'express';
import { likesController } from './likes.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireVerified } from '../../middleware/verification.guard';
import { validate } from '../../middleware/validate';
import { LikeProfileSchema, PassProfileSchema } from './likes.schemas';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireVerified,
  validate(LikeProfileSchema),
  likesController.likeProfile
);

router.post(
  '/pass',
  requireAuth,
  validate(PassProfileSchema),
  likesController.passProfile
);

export const likesRouter = router;
