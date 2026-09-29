import { FastifyRequest, FastifyReply } from 'fastify';
import { photoService } from './photo.service';
import {
  uploadPhotoUrlSchema,
  completePhotoUploadSchema,
  photoIdParamSchema,
} from '../profiles/profile.schema';

export class PhotoController {
  async getPhotoUploadUrl(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = uploadPhotoUrlSchema.parse(request.body);
    const presigned = await photoService.getPhotoUploadUrl(userId, body.mimeType);
    return reply.status(200).send({ success: true, ...presigned });
  }

  async completePhotoUpload(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = completePhotoUploadSchema.parse(request.body);
    const photo = await photoService.completePhotoUpload(userId, body.storageKey, body.isPrimary);
    return reply.status(201).send({
      success: true,
      message: 'Photo registered successfully',
      photo,
    });
  }

  async deletePhoto(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = photoIdParamSchema.parse(request.params);
    const result = await photoService.deletePhoto(userId, params.photoId);
    return reply.status(200).send(result);
  }

  async setPrimaryPhoto(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = photoIdParamSchema.parse(request.params);
    const result = await photoService.setPrimaryPhoto(userId, params.photoId);
    return reply.status(200).send(result);
  }

  async getMyPhotos(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const photos = await photoService.getUserPhotos(userId);
    return reply.status(200).send({ success: true, photos });
  }
}

export const photoController = new PhotoController();
