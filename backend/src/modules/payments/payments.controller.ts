import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { sendSuccess } from '../../common/response';

export class PaymentsController {
  async initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId, provider } = req.body;
      const result = await paymentsService.initiateConversationPayment(userId, conversationId, provider);
      sendSuccess(res, result, 'Payment initiated', 201);
    } catch (error) {
      next(error);
    }
  }

  async handleChapaWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-chapa-signature'] as string | undefined;
      const eventId = (req.body.id || req.body.reference || `evt_${Date.now()}`) as string;
      const result = await paymentsService.processProviderWebhook('CHAPA', eventId, req.body, signature);
      sendSuccess(res, result, 'Webhook processed');
    } catch (error) {
      next(error);
    }
  }

  async mockCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = req.params.orderId as string;
      const result = await paymentsService.mockCompletePayment(orderId);
      sendSuccess(res, result, 'Mock payment completed');
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
