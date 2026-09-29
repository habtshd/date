import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../common/response';

export class AuthController {
  async requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone } = req.body;
      const result = await authService.requestOtp(phone);
      sendSuccess(res, result, 'Verification code requested');
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, code, deviceId, deviceInfo } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await authService.verifyOtp(phone, code, deviceId, deviceInfo, ipAddress);
      sendSuccess(res, result, 'Authentication successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await authService.logout(userId);
      sendSuccess(res, result, 'Logged out');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      sendSuccess(res, user, 'Current user profile');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
