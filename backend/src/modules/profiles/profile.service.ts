import { prisma } from '../../plugins/prisma';
import { calculateAge } from '../../utils/age';
import { storageService } from '../../integrations/storage';
import { generateOpaqueToken } from '../../utils/crypto';
import {
  CreateProfileInput,
  UpdateProfileInput,
  UpdatePreferencesInput,
} from './profile.schema';

export const PREDEFINED_INTERESTS = [
  'Reading',
  'Travel',
  'Fitness',
  'Business',
  'Technology',
  'Music',
  'Football',
  'Cooking',
  'Art',
  'Education',
  'Entrepreneurship',
  'Movies',
  'Nature',
  'Photography',
  'Volunteering',
];

export class ProfileService {
  /**
   * Create dating profile for the authenticated user
   */
  async createProfile(userId: string, input: CreateProfileInput) {
    const dateOfBirth = new Date(input.dateOfBirth);

    if (Number.isNaN(dateOfBirth.getTime())) {
      throw new Error('Invalid date of birth');
    }

    if (calculateAge(dateOfBirth) < 18) {
      throw new Error('User must be at least 18 years old');
    }

    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new Error('Profile already exists for this user. Use PATCH to update.');
    }

    const profile = await prisma.$transaction(async (tx) => {
      const created = await tx.userProfile.create({
        data: {
          userId,
          firstName: input.firstName,
          dateOfBirth,
          gender: input.gender,
          city: input.city,
          bio: input.bio,
          relationshipGoal: input.relationshipGoal,
        },
      });

      // Initialize default preferences
      await tx.userPreference.create({
        data: {
          userId,
          minAge: 18,
          maxAge: 100,
          preferredCity: input.city,
        },
      });

      return created;
    });

    return profile;
  }

  /**
   * Get the private profile of the authenticated user
   * Formatted strictly as specified in Phase 3B Section 16
   */
  async getMyProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneVerified: true,
        verificationStatus: true,
        profile: {
          include: {
            preferences: true,
            photos: {
              where: { status: { not: 'DELETED' } },
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            },
            interests: {
              include: { interest: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.profile) {
      return {
        user: {
          id: user.id,
          phoneVerified: user.phoneVerified,
          verificationStatus: user.verificationStatus,
        },
        profile: null,
        preferences: null,
        interests: [],
        photos: [],
      };
    }

    const p = user.profile;

    return {
      user: {
        id: user.id,
        phoneVerified: user.phoneVerified,
        verificationStatus: user.verificationStatus,
      },
      profile: {
        firstName: p.firstName,
        dateOfBirth: p.dateOfBirth.toISOString().split('T')[0],
        gender: p.gender,
        city: p.city,
        bio: p.bio,
        relationshipGoal: p.relationshipGoal,
      },
      preferences: p.preferences
        ? {
            minAge: p.preferences.minAge,
            maxAge: p.preferences.maxAge,
            preferredGender: p.preferences.preferredGender,
            preferredCity: p.preferences.preferredCity,
            relationshipGoal: p.preferences.relationshipGoal,
            maxDistanceKm: p.preferences.maxDistanceKm,
          }
        : null,
      interests: p.interests.map((ui) => ui.interest.name),
      photos: p.photos.map((photo) => ({
        id: photo.id,
        url: photo.storageKey,
        blurredUrl: photo.blurredStorageKey,
        isPrimary: photo.isPrimary,
        status: photo.status,
        createdAt: photo.createdAt,
      })),
    };
  }

  /**
   * Update authenticated user's dating profile
   */
  async updateMyProfile(userId: string, input: UpdateProfileInput) {
    const existing = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new Error('Profile does not exist yet. Please create a profile first.');
    }

    let dateOfBirth: Date | undefined;
    if (input.dateOfBirth) {
      dateOfBirth = new Date(input.dateOfBirth);
      if (Number.isNaN(dateOfBirth.getTime())) {
        throw new Error('Invalid date of birth');
      }
      if (calculateAge(dateOfBirth) < 18) {
        throw new Error('User must be at least 18 years old');
      }
    }

    await prisma.userProfile.update({
      where: { userId },
      data: {
        firstName: input.firstName,
        dateOfBirth,
        gender: input.gender,
        city: input.city,
        bio: input.bio,
        relationshipGoal: input.relationshipGoal,
      },
    });

    return this.getMyProfile(userId);
  }

  /**
   * Update preferences
   */
  async updatePreferences(userId: string, input: UpdatePreferencesInput) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile must be created before setting preferences');
    }

    const preferences = await prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        minAge: input.minAge,
        maxAge: input.maxAge,
        preferredGender: input.preferredGender,
        preferredCity: input.preferredCity,
        relationshipGoal: input.relationshipGoal,
        maxDistanceKm: input.maxDistanceKm,
      },
      update: {
        minAge: input.minAge,
        maxAge: input.maxAge,
        preferredGender: input.preferredGender,
        preferredCity: input.preferredCity,
        relationshipGoal: input.relationshipGoal,
        maxDistanceKm: input.maxDistanceKm,
      },
    });

    return preferences;
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string) {
    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    });

    return preferences;
  }

  /**
   * List available predefined interests
   */
  async getAvailableInterests() {
    try {
      const records = await prisma.interest.findMany({
        orderBy: { name: 'asc' },
      });
      if (records.length > 0) {
        return records;
      }
    } catch {
      // Fallback if database is unavailable or not yet seeded
    }

    return PREDEFINED_INTERESTS.map((name, index) => ({
      id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
      name,
    }));
  }

  /**
   * Assign interests to user profile
   */
  async setUserInterests(userId: string, interestIds: string[]) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile must be created before selecting interests');
    }

    await prisma.$transaction(async (tx) => {
      await tx.userInterest.deleteMany({ where: { userId } });
      if (interestIds.length > 0) {
        await tx.userInterest.createMany({
          data: interestIds.map((interestId) => ({ userId, interestId })),
          skipDuplicates: true,
        });
      }
    });

    const updated = await prisma.userInterest.findMany({
      where: { userId },
      include: { interest: true },
    });

    return updated.map((ui) => ui.interest);
  }

  /**
   * Generate secure presigned upload URL for photo
   * Key pattern: profiles/{userId}/{randomUUID}.{ext}
   * Never contains phone number or national ID.
   */
  async getPhotoUploadUrl(userId: string, mimeType: string) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile must be created before uploading photos');
    }

    const photoCount = await prisma.profilePhoto.count({
      where: { userId, status: { not: 'DELETED' } },
    });

    if (photoCount >= 6) {
      throw new Error('Maximum of 6 photos permitted per profile');
    }

    return storageService.getPresignedUploadUrl(userId, mimeType);
  }

  /**
   * Record uploaded photo
   */
  async completePhotoUpload(userId: string, storageKey: string, isPrimary = false) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile must be created before recording photos');
    }

    const photoCount = await prisma.profilePhoto.count({
      where: { userId, status: { not: 'DELETED' } },
    });

    if (photoCount >= 6) {
      throw new Error('Maximum of 6 photos permitted per profile');
    }

    const shouldBePrimary = isPrimary || photoCount === 0;

    return prisma.$transaction(async (tx) => {
      if (shouldBePrimary) {
        await tx.profilePhoto.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Generate blurred key for teaser privacy
      const ext = storageKey.split('.').pop() || 'jpg';
      const blurredStorageKey = storageKey.replace(`.${ext}`, `_blurred.${ext}`);

      const photo = await tx.profilePhoto.create({
        data: {
          userId,
          storageKey,
          blurredStorageKey,
          isPrimary: shouldBePrimary,
          status: 'APPROVED', // Auto-approved for MVP
        },
      });

      if (shouldBePrimary) {
        await tx.userProfile.update({
          where: { userId },
          data: { primaryPhotoId: photo.id },
        });
      }

      return photo;
    });
  }

  /**
   * Set photo as primary inside atomic transaction
   */
  async setPrimaryPhoto(userId: string, photoId: string) {
    const photo = await prisma.profilePhoto.findFirst({
      where: { id: photoId, userId, status: { not: 'DELETED' } },
    });

    if (!photo) {
      throw new Error('Photo not found or has been deleted');
    }

    await prisma.$transaction([
      prisma.profilePhoto.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      }),
      prisma.profilePhoto.update({
        where: { id: photoId },
        data: { isPrimary: true },
      }),
      prisma.userProfile.update({
        where: { userId },
        data: { primaryPhotoId: photoId },
      }),
    ]);

    return { success: true, message: 'Primary photo updated successfully' };
  }

  /**
   * Delete a photo
   */
  async deletePhoto(userId: string, photoId: string) {
    const photo = await prisma.profilePhoto.findFirst({
      where: { id: photoId, userId, status: { not: 'DELETED' } },
    });

    if (!photo) {
      throw new Error('Photo not found or has already been deleted');
    }

    await prisma.$transaction(async (tx) => {
      // Mark deleted
      await tx.profilePhoto.update({
        where: { id: photoId },
        data: { status: 'DELETED', isPrimary: false },
      });

      // If deleted photo was primary, promote another photo
      if (photo.isPrimary) {
        const nextPhoto = await tx.profilePhoto.findFirst({
          where: { userId, id: { not: photoId }, status: { not: 'DELETED' } },
          orderBy: { createdAt: 'asc' },
        });

        if (nextPhoto) {
          await tx.profilePhoto.update({
            where: { id: nextPhoto.id },
            data: { isPrimary: true },
          });
          await tx.userProfile.update({
            where: { userId },
            data: { primaryPhotoId: nextPhoto.id },
          });
        } else {
          await tx.userProfile.update({
            where: { userId },
            data: { primaryPhotoId: null },
          });
        }
      }
    });

    return { success: true, message: 'Photo deleted successfully' };
  }
}

export const profileService = new ProfileService();
