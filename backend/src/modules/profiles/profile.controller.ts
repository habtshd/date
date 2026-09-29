import { FastifyRequest, FastifyReply } from 'fastify';
import { profileService } from './profile.service';
import {
  createProfileSchema,
  updateProfileSchema,
  updatePreferencesSchema,
  updateInterestsSchema,
  uploadPhotoUrlSchema,
  completePhotoUploadSchema,
  photoIdParamSchema,
} from './profile.schema';

export async function getMyProfile(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const result = await profileService.getMyProfile(userId);
  return reply.status(200).send({ success: true, ...result });
}

export async function createMyProfile(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const body = createProfileSchema.parse(request.body);
  const profile = await profileService.createProfile(userId, body);
  return reply.status(201).send({
    success: true,
    message: 'Profile created successfully',
    profile,
  });
}

export async function updateMyProfile(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const body = updateProfileSchema.parse(request.body);
  const result = await profileService.updateMyProfile(userId, body);
  return reply.status(200).send({
    success: true,
    message: 'Profile updated successfully',
    ...result,
  });
}

export async function getPreferences(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const preferences = await profileService.getPreferences(userId);
  return reply.status(200).send({ success: true, preferences });
}

export async function updatePreferences(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const body = updatePreferencesSchema.parse(request.body);
  const preferences = await profileService.updatePreferences(userId, body);
  return reply.status(200).send({
    success: true,
    message: 'Preferences updated successfully',
    preferences,
  });
}

export async function getInterests(_request: FastifyRequest, reply: FastifyReply) {
  const interests = await profileService.getAvailableInterests();
  return reply.status(200).send({ success: true, interests });
}

export async function setUserInterests(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const body = updateInterestsSchema.parse(request.body);
  const interests = await profileService.setUserInterests(userId, body.interestIds);
  return reply.status(200).send({
    success: true,
    message: 'Interests updated successfully',
    interests,
  });
}

export async function getPhotoUploadUrl(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const body = uploadPhotoUrlSchema.parse(request.body);
  const presigned = await profileService.getPhotoUploadUrl(userId, body.mimeType);
  return reply.status(200).send({ success: true, ...presigned });
}

export async function completePhotoUpload(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const body = completePhotoUploadSchema.parse(request.body);
  const photo = await profileService.completePhotoUpload(userId, body.storageKey, body.isPrimary);
  return reply.status(201).send({
    success: true,
    message: 'Photo registered successfully',
    photo,
  });
}

export async function deletePhoto(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const params = photoIdParamSchema.parse(request.params);
  const result = await profileService.deletePhoto(userId, params.photoId);
  return reply.status(200).send(result);
}

export async function setPrimaryPhoto(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const params = photoIdParamSchema.parse(request.params);
  const result = await profileService.setPrimaryPhoto(userId, params.photoId);
  return reply.status(200).send(result);
}
