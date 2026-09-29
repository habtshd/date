import { FastifyRequest, FastifyReply } from 'fastify';
import { profilesService } from './profiles.service';
import { UpsertProfileSchema, AddPhotoSchema, UpdatePreferencesSchema } from './profile.schema';
import { z } from 'zod';

const PhotoIdParamSchema = z.object({
  photoId: z.string().uuid(),
});

const PresignUploadSchema = z.object({
  mimeType: z.string().default('image/jpeg'),
});

export class ProfilesController {
  async getMyProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const profile = await profilesService.getMyProfile(userId);
    return reply.status(200).send({ success: true, profile });
  }

  async upsertProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = UpsertProfileSchema.parse(request.body);
    const profile = await profilesService.upsertProfile(userId, body);
    return reply.status(200).send({ success: true, message: 'Profile updated successfully', profile });
  }

  async presignPhoto(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = PresignUploadSchema.parse(request.body || {});
    const presigned = await profilesService.getPhotoUploadUrl(userId, body.mimeType);
    return reply.status(200).send({ success: true, ...presigned });
  }

  async addPhoto(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = AddPhotoSchema.parse(request.body);
    const photo = await profilesService.addPhoto(userId, body);
    return reply.status(201).send({ success: true, message: 'Photo added successfully', photo });
  }

  async deletePhoto(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = PhotoIdParamSchema.parse(request.params);
    const result = await profilesService.deletePhoto(userId, params.photoId);
    return reply.status(200).send({ success: true, ...result });
  }

  async updatePreferences(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = UpdatePreferencesSchema.parse(request.body);
    const preferences = await profilesService.updatePreferences(userId, body);
    return reply.status(200).send({ success: true, message: 'Preferences updated successfully', preferences });
  }

  async getInterests(_request: FastifyRequest, reply: FastifyReply) {
    const interests = await profilesService.getAvailableInterests();
    return reply.status(200).send({ success: true, interests });
  }
}

export const profilesController = new ProfilesController();
