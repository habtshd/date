import { Request, Response, NextFunction } from 'express';
import { verificationService } from './verification.service';
import { sendSuccess } from '../../common/response';

export class VerificationController {
  async submitVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { provider } = req.body;
      const result = await verificationService.submitVerification(userId, provider);
      sendSuccess(res, result, 'Verification requested');
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await verificationService.getStatus(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { providerReference, status } = req.body;
      const result = await verificationService.handleWebhook(providerReference, status);
      sendSuccess(res, result, 'Webhook processed');
    } catch (error) {
      next(error);
    }
  }
}

export const verificationController = new VerificationController();
