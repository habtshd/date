import { Request, Response, NextFunction } from 'express';
import { blocksService } from './blocks.service';
import { sendSuccess } from '../../common/response';

export class BlocksController {
  async blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blockerId = req.user!.id;
      const { targetUserId } = req.body;
      const result = await blocksService.blockUser(blockerId, targetUserId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async unblockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blockerId = req.user!.id;
      const targetUserId = req.params.targetUserId as string;
      const result = await blocksService.unblockUser(blockerId, targetUserId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getBlockedUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await blocksService.getBlockedUsers(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const blocksController = new BlocksController();
