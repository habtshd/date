import { Request, Response, NextFunction } from 'express';
import { verificationService } from './verification.service';
import { sendSuccess } from '../../common/response';

export class VerificationController {
  async submitVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { idDocumentType, idDocumentNumber, livenessSessionId } = req.body;
      const result = await verificationService.submitVerification(
        userId,
        idDocumentType,
        idDocumentNumber,
        livenessSessionId
      );
      sendSuccess(res, result, 'Verification documents submitted');
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
      const { referenceToken, status, rejectionReason } = req.body;
      const result = await verificationService.handleWebhook(referenceToken, status, rejectionReason);
      sendSuccess(res, result, 'Webhook processed');
    } catch (error) {
      next(error);
    }
  }
}

export const verificationController = new VerificationController();
