import { profileService } from '../profiles/profile.service';
import { prisma } from '../../plugins/prisma';

export class PhotoService {
  async getPhotoUploadUrl(userId: string, mimeType: string) {
    return profileService.getPhotoUploadUrl(userId, mimeType);
  }

  async completePhotoUpload(userId: string, storageKey: string, isPrimary = false) {
    return profileService.completePhotoUpload(userId, storageKey, isPrimary);
  }

  async deletePhoto(userId: string, photoId: string) {
    return profileService.deletePhoto(userId, photoId);
  }

  async setPrimaryPhoto(userId: string, photoId: string) {
    return profileService.setPrimaryPhoto(userId, photoId);
  }

  async getUserPhotos(userId: string) {
    return prisma.profilePhoto.findMany({
      where: { userId, status: { not: 'DELETED' } },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }
}

export const photoService = new PhotoService();
