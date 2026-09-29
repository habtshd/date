import { Request, Response, NextFunction } from 'express';
import { likesService } from './likes.service';
import { sendSuccess } from '../../common/response';

export class LikesController {
  async likeProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fromUserId = req.user!.id;
      const { targetUserId, toUserId } = req.body;
      const target = toUserId || targetUserId;
      const result = await likesService.likeProfile(fromUserId, target);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async passProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { targetUserId, toUserId } = req.body;
      const target = toUserId || targetUserId;
      const result = await likesService.passProfile(userId, target);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const likesController = new LikesController();
