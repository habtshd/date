import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { sendSuccess } from '../../common/response';

export class ReportsController {
  async fileReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reporterId = req.user!.id;
      const { reportedUserId, reason, description, conversationId } = req.body;
      const result = await reportsService.fileReport(
        reporterId,
        reportedUserId,
        reason,
        description,
        conversationId
      );
      sendSuccess(res, result, 'Report submitted', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
