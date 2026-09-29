import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { sendSuccess } from '../../common/response';

export class AdminController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await adminService.login(email, password);
      sendSuccess(res, result, 'Admin login successful');
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as any;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await adminService.getReports(status, page, limit);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async takeModerationAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin!.id;
      const { targetUserId, actionType, reason, reportId, durationHours } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const result = await adminService.executeModerationAction(
        adminId,
        targetUserId,
        actionType,
        reason,
        reportId,
        durationHours,
        ipAddress
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getDashboardMetrics();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await adminService.getAuditLogs(page, limit);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
