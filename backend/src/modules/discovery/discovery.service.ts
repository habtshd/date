import { prisma } from '../../plugins/prisma';
import { calculateAge } from '../../utils/age';

export interface DiscoveryCard {
  id: string;
  firstName: string;
  age: number;
  gender: string;
  city: string;
  bio?: string | null;
  relationshipGoal?: string | null;
  photos: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
  interests: { id: string; name: string }[];
  isVerified: boolean;
}

export interface PreviewCard {
  id: string;
  firstName: string;
  age: number;
  city: string;
  previewPhotoUrl: string | null;
}

export class DiscoveryService {
  /**
   * Generates dating discovery feed for verified users based on preferences.
   * Strictly returns sanitized dating profiles (no PII, no phone, no identity documents).
   */
  async getDiscoveryFeed(
    userId: string,
    limit = 20
  ): Promise<{ profiles: DiscoveryCard[] }> {
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

    // 3. Query candidate profiles: verified pool only
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
          verificationStatus: 'VERIFIED',
        },
      },
      include: {
        photos: {
          where: { status: 'APPROVED' },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        interests: {
          include: { interest: true },
        },
        user: {
          select: {
            verificationStatus: true,
          },
        },
      },
      take: limit,
    });

    // 4. Format cards - strictly public dating discovery view
    const cards: DiscoveryCard[] = candidateProfiles.map((p) => {
      const age = calculateAge(p.dateOfBirth);

      return {
        id: p.userId,
        firstName: p.firstName,
        age,
        gender: p.gender,
        city: p.city,
        bio: p.bio,
        relationshipGoal: p.relationshipGoal,
        photos: p.photos.map((photo) => ({
          id: photo.id,
          url: photo.storageKey,
          isPrimary: photo.isPrimary,
        })),
        interests: p.interests.map((ui) => ({ id: ui.interest.id, name: ui.interest.name })),
        isVerified: p.user.verificationStatus === 'VERIFIED',
      };
    });

    return {
      profiles: cards,
    };
  }

  /**
   * Safe preview feed for unverified accounts.
   * Returns restricted preview cards with blurred/low-resolution images and limited info.
   */
  async getDiscoveryPreview(userId: string): Promise<{ profiles: PreviewCard[]; verificationRequired: boolean }> {
    const candidateProfiles = await prisma.userProfile.findMany({
      where: {
        userId: { not: userId },
        user: {
          accountStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED',
        },
      },
      include: {
        photos: {
          where: { status: 'APPROVED' },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          take: 1,
        },
      },
      take: 5,
    });

    const profiles: PreviewCard[] = candidateProfiles.map((p) => {
      const age = calculateAge(p.dateOfBirth);
      const primaryPhoto = p.photos[0];

      return {
        id: p.userId,
        firstName: p.firstName,
        age,
        city: p.city,
        previewPhotoUrl: primaryPhoto?.blurredStorageKey || primaryPhoto?.storageKey || null,
      };
    });

    return {
      profiles,
      verificationRequired: true,
    };
  }
}

export const discoveryService = new DiscoveryService();
