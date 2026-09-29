import { prisma } from '../../database/prisma';
import { NotFoundError } from '../../common/errors';

export class MatchesService {
  /**
   * List all active matches for the authenticated user
   */
  async getUserMatches(userId: string) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userLowId: userId }, { userHighId: userId }],
        isActive: true,
      },
      include: {
        userLow: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                birthDate: true,
                city: true,
              },
            },
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        userHigh: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                birthDate: true,
                city: true,
              },
            },
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        conversation: {
          select: {
            id: true,
            isUnlocked: true,
            unlockedAt: true,
            lastMessageId: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { matchedAt: 'desc' },
    });

    return matches.map((m) => {
      const isLow = m.userLowId === userId;
      const partnerUser = isLow ? m.userHigh : m.userLow;
      const birthYear = partnerUser.profile?.birthDate.getFullYear() ?? 2000;
      const age = new Date().getFullYear() - birthYear;

      return {
        matchId: m.id,
        matchedAt: m.matchedAt,
        conversationId: m.conversation?.id,
        isUnlocked: m.conversation?.isUnlocked ?? false,
        partner: {
          userId: partnerUser.id,
          displayName: partnerUser.profile?.displayName ?? 'Anonymous',
          age,
          city: partnerUser.profile?.city ?? '',
          primaryPhotoUrl: partnerUser.photos[0]?.originalUrl ?? null,
        },
      };
    });
  }

  /**
   * Unmatch a partner
   */
  async unmatch(userId: string, matchId: string) {
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ userLowId: userId }, { userHighId: userId }],
        isActive: true,
      },
    });

    if (!match) {
      throw new NotFoundError('Match not found or already ended');
    }

    await prisma.match.update({
      where: { id: matchId },
      data: {
        isActive: false,
        unmatchedAt: new Date(),
        unmatchedByUserId: userId,
      },
    });

    return { message: 'Successfully unmatched' };
  }
}

export const matchesService = new MatchesService();
