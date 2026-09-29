import { Request, Response, NextFunction } from 'express';
import { discoveryService } from './discovery.service';
import { sendSuccess } from '../../common/response';

export class DiscoveryController {
  async getFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await discoveryService.getDiscoveryFeed(user.id, user.role, limit);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const discoveryController = new DiscoveryController();
