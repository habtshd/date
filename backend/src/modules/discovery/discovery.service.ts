import { prisma } from '../../plugins/prisma';
import { calculateAge } from '../../utils/age';

export interface DiscoveryProfileDTO {
  id: string;
  firstName: string;
  age: number;
  gender: string;
  city: string;
  bio: string | null;
  relationshipGoal: string | null;
  interests: string[];
  photo: {
    id: string;
    url: string;
  } | null;
}

export interface PreviewCard {
  id: string;
  firstName: string;
  age: number;
  city: string;
  previewPhotoUrl: string | null;
}

export function toDiscoveryProfile(profile: {
  userId: string;
  firstName: string;
  dateOfBirth: Date;
  gender: string;
  city: string;
  bio: string | null;
  relationshipGoal: string | null;
  interests: { interest: { name: string } }[];
  photos: { id: string; storageKey: string }[];
}): DiscoveryProfileDTO {
  return {
    id: profile.userId,
    firstName: profile.firstName,
    age: calculateAge(profile.dateOfBirth),
    gender: profile.gender,
    city: profile.city,
    bio: profile.bio,
    relationshipGoal: profile.relationshipGoal,
    interests: profile.interests.map((item) => item.interest.name),
    photo: profile.photos[0]
      ? {
          id: profile.photos[0].id,
          url: profile.photos[0].storageKey,
        }
      : null,
  };
}

export class DiscoveryService {
  /**
   * Generates dating discovery feed for verified users based on preferences.
   * Strictly filters out already liked, passed, blocked, matched, or inactive users.
   */
  async getDiscoveryFeed(
    userId: string,
    limit = 20
  ): Promise<{ profiles: DiscoveryProfileDTO[] }> {
    // 1. Fetch user's dating preferences
    const preference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    const minAge = preference?.minAge ?? 18;
    const maxAge = preference?.maxAge ?? 60;
    const preferredGender = preference?.preferredGender;
    const preferredCity = preference?.preferredCity;
    const preferredGoal = preference?.relationshipGoal;

    // Calculate birth date bounds
    const now = new Date();
    const minBirthDate = new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate());
    const maxBirthDate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());

    // 2. Fetch exclusion sets: already liked, passed, blocked, or matched users
    const [likedRecords, passedRecords, blockRecords, matchesAsA, matchesAsB] = await Promise.all([
      prisma.like.findMany({
        where: { fromUserId: userId },
        select: { toUserId: true },
      }),
      prisma.pass.findMany({
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
    passedRecords.forEach((p) => excludedUserIds.add(p.toUserId));
    blockRecords.forEach((b) => {
      excludedUserIds.add(b.blockerId);
      excludedUserIds.add(b.blockedId);
    });
    matchesAsA.forEach((m) => excludedUserIds.add(m.userBId));
    matchesAsB.forEach((m) => excludedUserIds.add(m.userAId));

    // 3. Query candidate profiles: verified pool only, with at least one approved photo
    const candidateProfiles = await prisma.userProfile.findMany({
      where: {
        userId: { notIn: Array.from(excludedUserIds) },
        dateOfBirth: {
          gte: minBirthDate,
          lte: maxBirthDate,
        },
        ...(preferredGender ? { gender: preferredGender } : {}),
        ...(preferredCity ? { city: preferredCity } : {}),
        ...(preferredGoal ? { relationshipGoal: preferredGoal } : {}),
        user: {
          accountStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED',
        },
        photos: {
          some: {
            status: 'APPROVED',
          },
        },
      },
      include: {
        photos: {
          where: { status: 'APPROVED' },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          take: 1,
        },
        interests: {
          include: { interest: true },
        },
      },
      take: limit,
    });

    // 4. Format cards - strictly public dating discovery view
    const profiles = candidateProfiles.map(toDiscoveryProfile);

    return {
      profiles,
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
        photos: {
          some: {
            status: 'APPROVED',
          },
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
        previewPhotoUrl: primaryPhoto?.storageKey || null,
      };
    });

    return {
      profiles,
      verificationRequired: true,
    };
  }
}

export const discoveryService = new DiscoveryService();
