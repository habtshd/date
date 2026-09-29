import { prisma } from '../../database/prisma';
import { UserRole } from '@prisma/client';

export interface DiscoveryCard {
  userId: string;
  displayName: string;
  age: number;
  gender: string;
  city: string;
  region: string;
  bio?: string | null;
  relationshipIntention: string;
  religion?: string | null;
  occupation?: string | null;
  heightCm?: number | null;
  photos: {
    id: string;
    url: string; // clear if user is verified, server-blurred if unverified teaser
    isPrimary: boolean;
  }[];
  interests: { id: string; name: string; category: string }[];
  isVerified: boolean;
}

export class DiscoveryService {
  /**
   * Generates discovery feed based on verification status and user preferences.
   * If requesting user is UNVERIFIED, delivers teaser cards with ONLY server-blurred photos.
   */
  async getDiscoveryFeed(
    userId: string,
    userRole: UserRole,
    limit = 20
  ): Promise<{ profiles: DiscoveryCard[]; isTeaserMode: boolean }> {
    const isTeaserMode = userRole !== 'VERIFIED_USER';

    // 1. Fetch user's dating preferences
    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    });

    const minAge = preferences?.minAge ?? 18;
    const maxAge = preferences?.maxAge ?? 60;
    const interestedGenders = preferences?.interestedInGenders ?? ['FEMALE', 'MALE'];
    const preferredCities = preferences?.preferredCities ?? [];

    // Calculate birth date bounds for age range
    const now = new Date();
    const minBirthDate = new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate());
    const maxBirthDate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());

    // 2. Fetch exclusion sets: passed users, liked users, blocked users, active matches
    const [passedRecords, likedRecords, blockRecords, matchesAsLow, matchesAsHigh] = await Promise.all([
      prisma.profilePass.findMany({
        where: { userId },
        select: { targetUserId: true },
      }),
      prisma.like.findMany({
        where: { likerId: userId },
        select: { likedId: true },
      }),
      prisma.userBlock.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: { blockerId: true, blockedId: true },
      }),
      prisma.match.findMany({
        where: { userLowId: userId, isActive: true },
        select: { userHighId: true },
      }),
      prisma.match.findMany({
        where: { userHighId: userId, isActive: true },
        select: { userLowId: true },
      }),
    ]);

    const excludedUserIds = new Set<string>([userId]);
    passedRecords.forEach((p) => excludedUserIds.add(p.targetUserId));
    likedRecords.forEach((l) => excludedUserIds.add(l.likedId));
    blockRecords.forEach((b) => {
      excludedUserIds.add(b.blockerId);
      excludedUserIds.add(b.blockedId);
    });
    matchesAsLow.forEach((m) => excludedUserIds.add(m.userHighId));
    matchesAsHigh.forEach((m) => excludedUserIds.add(m.userLowId));

    // 3. Query candidate profiles
    const candidateProfiles = await prisma.profile.findMany({
      where: {
        userId: { notIn: Array.from(excludedUserIds) },
        isHidden: false,
        birthDate: {
          gte: minBirthDate,
          lte: maxBirthDate,
        },
        gender: { in: interestedGenders },
        ...(preferredCities.length > 0 ? { city: { in: preferredCities } } : {}),
        user: {
          status: 'ACTIVE',
          role: 'VERIFIED_USER', // only verified members exist in the active dating pool
        },
      },
      include: {
        user: {
          select: {
            role: true,
            verification: { select: { status: true } },
            photos: {
              where: { status: 'APPROVED' },
              orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
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
      const birthYear = p.birthDate.getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;

      return {
        userId: p.userId,
        displayName: isTeaserMode ? `${p.displayName.charAt(0)}***` : p.displayName,
        age,
        gender: p.gender,
        city: p.city,
        region: p.region,
        bio: isTeaserMode ? 'Verify your identity to read full profile bio.' : p.bio,
        relationshipIntention: p.relationshipIntention,
        religion: isTeaserMode ? null : p.religion,
        occupation: isTeaserMode ? null : p.occupation,
        heightCm: isTeaserMode ? null : p.heightCm,
        photos: p.user.photos.map((photo) => ({
          id: photo.id,
          url: isTeaserMode ? photo.blurredUrl : photo.originalUrl,
          isPrimary: photo.isPrimary,
        })),
        interests: isTeaserMode ? [] : p.user.interests.map((pi) => pi.interest),
        isVerified: p.user.role === 'VERIFIED_USER',
      };
    });

    return {
      profiles: cards,
      isTeaserMode,
    };
  }
}

export const discoveryService = new DiscoveryService();
