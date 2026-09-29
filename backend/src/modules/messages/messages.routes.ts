import { Router } from 'express';
import { messagesController } from './messages.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireVerified } from '../../middleware/verification.guard';
import { validate } from '../../middleware/validate';
import { SendMessageSchema } from './messages.schemas';

const router = Router();

router.post(
  '/:conversationId',
  requireAuth,
  requireVerified,
  validate(SendMessageSchema),
  messagesController.sendMessage
);

router.get(
  '/:conversationId',
  requireAuth,
  requireVerified,
  messagesController.getMessages
);

export const messagesRouter = router;
