import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { sendSuccess } from '../../common/response';

export class PaymentsController {
  async initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId, provider } = req.body;
      const result = await paymentsService.initiateConversationPayment(userId, conversationId, provider || 'CHAPA');
      sendSuccess(res, result, 'Payment initiated', 201);
    } catch (error) {
      next(error);
    }
  }

  async handleChapaWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentsService.processProviderWebhook('CHAPA', req.body);
      sendSuccess(res, result, 'Webhook processed');
    } catch (error) {
      next(error);
    }
  }

  async mockCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = req.params.orderId as string;
      const result = await paymentsService.completePayment(paymentId);
      sendSuccess(res, result, 'Mock payment completed');
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
