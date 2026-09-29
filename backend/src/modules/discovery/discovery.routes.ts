import { Router } from 'express';
import { discoveryController } from './discovery.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Notice: unverified users CAN call this endpoint, but the service automatically
// detects unverified standing and serves only server-blurred teaser cards!
router.get(
  '/feed',
  requireAuth,
  discoveryController.getFeed
);

export const discoveryRouter = router;
