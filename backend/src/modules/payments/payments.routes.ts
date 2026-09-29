import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireVerified } from '../../middleware/verification.guard';
import { validate } from '../../middleware/validate';
import { CreateConversationPaymentSchema } from './payments.schemas';

const router = Router();

router.post(
  '/initiate',
  requireAuth,
  requireVerified,
  validate(CreateConversationPaymentSchema),
  paymentsController.initiatePayment
);

// Webhook listener called directly by Chapa servers
router.post(
  '/webhooks/chapa',
  paymentsController.handleChapaWebhook
);

// Development mock payment completion endpoint
router.post(
  '/mock-gateway-checkout/:orderId',
  paymentsController.mockCheckout
);

export const paymentsRouter = router;
