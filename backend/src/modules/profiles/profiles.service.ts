import { prisma } from '../../plugins/prisma';
import { Gender, RelationshipGoal } from '@prisma/client';
import { storageService } from '../../integrations/storage';

export class ProfilesService {
  /**
   * Create or update user profile
   */
  async upsertProfile(
    userId: string,
    data: {
      firstName: string;
      dateOfBirth: string;
      gender: Gender;
      city: string;
      bio?: string;
      relationshipGoal: RelationshipGoal;
      interestIds?: string[];
    }
  ) {
    const birthDateObj = new Date(data.dateOfBirth);
    const ageDiffMs = Date.now() - birthDateObj.getTime();
    const ageDate = new Date(ageDiffMs);
    const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (calculatedAge < 18) {
      throw new Error('Users must be at least 18 years of age to use the dating service');
    }

    const { interestIds, ...profileData } = data;

    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...profileData,
        dateOfBirth: birthDateObj,
      },
      update: {
        ...profileData,
        dateOfBirth: birthDateObj,
      },
    });

    // Update interests if provided
    if (interestIds) {
      await prisma.userInterest.deleteMany({ where: { userId } });
      if (interestIds.length > 0) {
        await prisma.userInterest.createMany({
          data: interestIds.map((interestId) => ({ userId, interestId })),
          skipDuplicates: true,
        });
      }
    }

    return this.getMyProfile(userId);
  }

  /**
   * Get authenticated user's own profile
   */
  async getMyProfile(userId: string) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            phoneNumber: true,
            accountStatus: true,
            verificationStatus: true,
            photos: {
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            },
            preference: true,
            interests: {
              include: { interest: true },
            },
          },
        },
      },
    });

    if (!profile) {
      return null;
    }

    return {
      userId: profile.userId,
      firstName: profile.firstName,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      city: profile.city,
      bio: profile.bio,
      relationshipGoal: profile.relationshipGoal,
      verificationStatus: profile.user.verificationStatus,
      photos: profile.user.photos,
      interests: profile.user.interests.map((ui) => ui.interest),
      preference: profile.user.preference,
    };
  }

  /**
   * Request presigned URL to upload a photo
   */
  async getPhotoUploadUrl(userId: string, mimeType: string) {
    const count = await prisma.profilePhoto.count({ where: { userId } });
    if (count >= 6) {
      throw new Error('Maximum of 6 photos permitted per profile');
    }

    return storageService.getPresignedUploadUrl(userId, mimeType);
  }

  /**
   * Add photo to profile
   */
  async addPhoto(userId: string, data: { storageKey: string; blurredStorageKey?: string; isPrimary: boolean }) {
    const existingCount = await prisma.profilePhoto.count({ where: { userId } });
    if (existingCount >= 6) {
      throw new Error('Maximum of 6 photos permitted per profile');
    }

    if (data.isPrimary || existingCount === 0) {
      await prisma.profilePhoto.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
      data.isPrimary = true;
    }

    const photo = await prisma.profilePhoto.create({
      data: {
        userId,
        storageKey: data.storageKey,
        blurredStorageKey: data.blurredStorageKey,
        isPrimary: data.isPrimary,
        status: 'APPROVED',
      },
    });

    // If set as primary, link to user_profile
    if (data.isPrimary) {
      await prisma.userProfile.update({
        where: { userId },
        data: { profilePhotoId: photo.id },
      }).catch(() => {
        // userProfile may not yet be created
      });
    }

    return photo;
  }

  /**
   * Delete photo from profile
   */
  async deletePhoto(userId: string, photoId: string) {
    const photo = await prisma.profilePhoto.findFirst({
      where: { id: photoId, userId },
    });

    if (!photo) {
      throw new Error('Photo not found');
    }

    await prisma.profilePhoto.delete({ where: { id: photoId } });

    // If primary was deleted, promote another photo
    if (photo.isPrimary) {
      const nextPhoto = await prisma.profilePhoto.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      if (nextPhoto) {
        await prisma.profilePhoto.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true },
        });
        await prisma.userProfile.update({
          where: { userId },
          data: { profilePhotoId: nextPhoto.id },
        }).catch(() => {});
      }
    }

    return { message: 'Photo deleted successfully' };
  }

  /**
   * Update preferences
   */
  async updatePreferences(
    userId: string,
    data: {
      minAge: number;
      maxAge: number;
      preferredGender?: Gender;
      preferredCity?: string;
      relationshipGoal?: RelationshipGoal;
      maxDistanceKm?: number;
    }
  ) {
    if (data.minAge > data.maxAge) {
      throw new Error('Minimum age cannot be greater than maximum age');
    }

    const preference = await prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: {
        ...data,
      },
    });

    return preference;
  }

  /**
   * List available predefined interests
   */
  async getAvailableInterests() {
    return prisma.interest.findMany({
      orderBy: { name: 'asc' },
    });
  }
}

export const profilesService = new ProfilesService();
