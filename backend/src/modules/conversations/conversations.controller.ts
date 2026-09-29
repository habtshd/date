import { Request, Response, NextFunction } from 'express';
import { conversationsService } from './conversations.service';
import { sendSuccess } from '../../common/response';

export class ConversationsController {
  async getMyConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await conversationsService.getUserConversations(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const conversationId = req.params.conversationId as string;
      const result = await conversationsService.getConversationById(userId, conversationId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const conversationsController = new ConversationsController();
