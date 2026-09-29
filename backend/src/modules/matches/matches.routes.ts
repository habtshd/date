import { Router } from 'express';
import { matchesController } from './matches.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireVerified } from '../../middleware/verification.guard';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireVerified,
  matchesController.getMyMatches
);

router.post(
  '/:matchId/unmatch',
  requireAuth,
  matchesController.unmatch
);

export const matchesRouter = router;
