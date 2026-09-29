import { Router } from 'express';
import { blocksController } from './blocks.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const BlockUserSchema = z.object({
  body: z.object({
    targetUserId: z.string().uuid(),
    reason: z.string().max(100).optional(),
  }),
});

router.post(
  '/',
  requireAuth,
  validate(BlockUserSchema),
  blocksController.blockUser
);

router.delete(
  '/:targetUserId',
  requireAuth,
  blocksController.unblockUser
);

router.get(
  '/',
  requireAuth,
  blocksController.getBlockedUsers
);

export const blocksRouter = router;
