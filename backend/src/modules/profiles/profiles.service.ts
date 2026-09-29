import { prisma } from '../../database/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { GenderType, RelationIntent } from '@prisma/client';

export class ProfilesService {
  /**
   * Create or update current user's dating profile
   */
  async upsertProfile(
    userId: string,
    data: {
      displayName: string;
      birthDate: string;
      gender: GenderType;
      city: string;
      region: string;
      heightCm?: number;
      bio?: string;
      relationshipIntention: RelationIntent;
      religion?: string;
      occupation?: string;
      education?: string;
      languages?: string[];
      interestIds?: string[];
    }
  ) {
    const birthDateObj = new Date(data.birthDate);
    const ageDiffMs = Date.now() - birthDateObj.getTime();
    const ageDate = new Date(ageDiffMs);
    const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (calculatedAge < 18) {
      throw new BadRequestError('Users must be at least 18 years of age to use the dating service');
    }

    const { interestIds, ...profileData } = data;

    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        ...profileData,
        birthDate: birthDateObj,
      },
      update: {
        ...profileData,
        birthDate: birthDateObj,
      },
      include: {
        user: {
          select: {
            role: true,
            verification: { select: { status: true } },
          },
        },
      },
    });

    // Update interests if provided
    if (interestIds) {
      await prisma.profileInterest.deleteMany({ where: { userId } });
      if (interestIds.length > 0) {
        await prisma.profileInterest.createMany({
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
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            phone: true,
            role: true,
            status: true,
            verification: { select: { status: true, verifiedAt: true } },
          },
        },
      },
    });

    if (!profile) {
      return null;
    }

    const userInterests = await prisma.profileInterest.findMany({
      where: { userId },
      include: { interest: true },
    });

    const photos = await prisma.profilePhoto.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
    });

    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    });

    return {
      userId: profile.userId,
      displayName: profile.displayName,
      birthDate: profile.birthDate,
      gender: profile.gender,
      city: profile.city,
      region: profile.region,
      heightCm: profile.heightCm,
      bio: profile.bio,
      relationshipIntention: profile.relationshipIntention,
      religion: profile.religion,
      occupation: profile.occupation,
      education: profile.education,
      languages: profile.languages,
      isHidden: profile.isHidden,
      verificationStatus: profile.user.verification?.status ?? 'UNVERIFIED',
      photos,
      interests: userInterests.map((pi) => pi.interest),
      preferences,
    };
  }

  /**
   * Add photo to profile
   */
  async addPhoto(userId: string, data: { originalUrl: string; blurredUrl: string; isPrimary: boolean; displayOrder: number }) {
    const existingCount = await prisma.profilePhoto.count({ where: { userId } });
    if (existingCount >= 6) {
      throw new BadRequestError('Maximum of 6 photos permitted per profile');
    }

    if (data.isPrimary || existingCount === 0) {
      // Unset previous primary
      await prisma.profilePhoto.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
      data.isPrimary = true;
    }

    const photo = await prisma.profilePhoto.create({
      data: {
        userId,
        originalUrl: data.originalUrl,
        blurredUrl: data.blurredUrl,
        isPrimary: data.isPrimary,
        displayOrder: data.displayOrder ?? existingCount,
        status: 'APPROVED', // Can route through image moderation pipeline
      },
    });

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
      throw new NotFoundError('Photo not found');
    }

    await prisma.profilePhoto.delete({ where: { id: photoId } });

    // If was primary, elect new primary
    if (photo.isPrimary) {
      const nextPhoto = await prisma.profilePhoto.findFirst({
        where: { userId },
        orderBy: { displayOrder: 'asc' },
      });
      if (nextPhoto) {
        await prisma.profilePhoto.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true },
        });
      }
    }

    return { message: 'Photo deleted successfully' };
  }

  /**
   * Update dating preferences
   */
  async updatePreferences(
    userId: string,
    data: {
      minAge: number;
      maxAge: number;
      interestedInGenders: GenderType[];
      preferredCities: string[];
      preferredIntentions: RelationIntent[];
      onlyVerified: boolean;
    }
  ) {
    if (data.minAge > data.maxAge) {
      throw new BadRequestError('Minimum age cannot be greater than maximum age');
    }

    const preferences = await prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: {
        ...data,
      },
    });

    return preferences;
  }

  /**
   * List available predefined interests
   */
  async getAvailableInterests() {
    return prisma.interest.findMany({
      orderBy: { category: 'asc' },
    });
  }
}

export const profilesService = new ProfilesService();
