import { Request, Response, NextFunction } from 'express';
import { messagesService } from './messages.service';
import { sendSuccess } from '../../common/response';

export class MessagesController {
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const conversationId = req.params.conversationId as string;
      const result = await messagesService.sendMessage(userId, conversationId, req.body);
      sendSuccess(res, result, 'Message sent', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const conversationId = req.params.conversationId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const beforeMessageId = req.query.before as string | undefined;

      const result = await messagesService.getMessages(userId, conversationId, limit, beforeMessageId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const messagesController = new MessagesController();
