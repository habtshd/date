import { Request, Response, NextFunction } from 'express';
import { matchesService } from './matches.service';
import { sendSuccess } from '../../common/response';

export class MatchesController {
  async getMyMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await matchesService.getUserMatches(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async unmatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const matchId = req.params.matchId as string;
      const result = await matchesService.unmatch(userId, matchId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const matchesController = new MatchesController();
