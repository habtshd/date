import { Request, Response, NextFunction } from 'express';
import { profilesService } from './profiles.service';
import { sendSuccess } from '../../common/response';

export class ProfilesController {
  async upsertProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await profilesService.upsertProfile(userId, req.body);
      sendSuccess(res, result, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await profilesService.getMyProfile(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async addPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await profilesService.addPhoto(userId, req.body);
      sendSuccess(res, result, 'Photo added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async deletePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const photoId = req.params.photoId as string;
      const result = await profilesService.deletePhoto(userId, photoId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await profilesService.updatePreferences(userId, req.body);
      sendSuccess(res, result, 'Preferences updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getInterests(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await profilesService.getAvailableInterests();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const profilesController = new ProfilesController();
