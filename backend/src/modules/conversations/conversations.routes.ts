import { Router } from 'express';
import { conversationsController } from './conversations.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireVerified } from '../../middleware/verification.guard';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireVerified,
  conversationsController.getMyConversations
);

router.get(
  '/:conversationId',
  requireAuth,
  requireVerified,
  conversationsController.getConversation
);

export const conversationsRouter = router;
