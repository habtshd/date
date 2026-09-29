import { prisma } from '../../database/prisma';
import { VerificationStatus } from '@prisma/client';

export interface DiscoveryCard {
  userId: string;
  firstName: string;
  age: number;
  gender: string;
  city: string;
  bio?: string | null;
  relationshipGoal: string;
  photos: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
  interests: { id: string; name: string }[];
  isVerified: boolean;
}

export class DiscoveryService {
  /**
   * Generates discovery feed based on verification status and user preferences.
   * If requesting user is UNVERIFIED, delivers teaser cards with ONLY server-blurred photos.
   */
  async getDiscoveryFeed(
    userId: string,
    verificationStatus: VerificationStatus,
    limit = 20
  ): Promise<{ profiles: DiscoveryCard[]; isTeaserMode: boolean }> {
    const isTeaserMode = verificationStatus !== 'VERIFIED';

    // 1. Fetch user's dating preferences
    const preference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    const minAge = preference?.minAge ?? 18;
    const maxAge = preference?.maxAge ?? 60;
    const preferredGender = preference?.preferredGender;
    const preferredCity = preference?.preferredCity;

    // Calculate birth date bounds
    const now = new Date();
    const minBirthDate = new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate());
    const maxBirthDate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());

    // 2. Fetch exclusion sets: already liked, blocked, or matched users
    const [likedRecords, blockRecords, matchesAsA, matchesAsB] = await Promise.all([
      prisma.like.findMany({
        where: { fromUserId: userId },
        select: { toUserId: true },
      }),
      prisma.block.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: { blockerId: true, blockedId: true },
      }),
      prisma.match.findMany({
        where: { userAId: userId, status: 'ACTIVE' },
        select: { userBId: true },
      }),
      prisma.match.findMany({
        where: { userBId: userId, status: 'ACTIVE' },
        select: { userAId: true },
      }),
    ]);

    const excludedUserIds = new Set<string>([userId]);
    likedRecords.forEach((l) => excludedUserIds.add(l.toUserId));
    blockRecords.forEach((b) => {
      excludedUserIds.add(b.blockerId);
      excludedUserIds.add(b.blockedId);
    });
    matchesAsA.forEach((m) => excludedUserIds.add(m.userBId));
    matchesAsB.forEach((m) => excludedUserIds.add(m.userAId));

    // 3. Query candidate profiles
    const candidateProfiles = await prisma.userProfile.findMany({
      where: {
        userId: { notIn: Array.from(excludedUserIds) },
        dateOfBirth: {
          gte: minBirthDate,
          lte: maxBirthDate,
        },
        ...(preferredGender ? { gender: preferredGender } : {}),
        ...(preferredCity ? { city: preferredCity } : {}),
        user: {
          accountStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED', // verified pool only
        },
      },
      include: {
        user: {
          select: {
            verificationStatus: true,
            photos: {
              where: { status: 'APPROVED' },
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            },
            interests: {
              include: { interest: true },
            },
          },
        },
      },
      take: isTeaserMode ? 5 : limit,
    });

    // 4. Format cards - strictly apply the image privacy rule
    const cards: DiscoveryCard[] = candidateProfiles.map((p) => {
      const birthYear = p.dateOfBirth.getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;

      return {
        userId: p.userId,
        firstName: isTeaserMode ? `${p.firstName.charAt(0)}***` : p.firstName,
        age,
        gender: p.gender,
        city: p.city,
        bio: isTeaserMode ? 'Verify your identity to read full profile bio.' : p.bio,
        relationshipGoal: p.relationshipGoal,
        photos: p.user.photos.map((photo) => ({
          id: photo.id,
          url: isTeaserMode
            ? (photo.blurredStorageKey || photo.storageKey)
            : photo.storageKey,
          isPrimary: photo.isPrimary,
        })),
        interests: isTeaserMode ? [] : p.user.interests.map((ui) => ui.interest),
        isVerified: p.user.verificationStatus === 'VERIFIED',
      };
    });

    return {
      profiles: cards,
      isTeaserMode,
    };
  }
}

export const discoveryService = new DiscoveryService();
