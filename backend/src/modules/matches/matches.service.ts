import { prisma } from '../../plugins/prisma';

export class MatchesService {
  /**
   * List all active matches for the authenticated user
   */
  async getUserMatches(userId: string) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        status: 'ACTIVE',
      },
      include: {
        userA: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                dateOfBirth: true,
                city: true,
                photos: {
                  where: { isPrimary: true, status: 'APPROVED' },
                  take: 1,
                },
              },
            },
          },
        },
        userB: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                dateOfBirth: true,
                city: true,
                photos: {
                  where: { isPrimary: true, status: 'APPROVED' },
                  take: 1,
                },
              },
            },
          },
        },
        conversation: {
          select: {
            id: true,
            status: true,
            unlockedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return matches.map((m) => {
      const isA = m.userAId === userId;
      const partnerUser = isA ? m.userB : m.userA;
      const birthYear = partnerUser.profile?.dateOfBirth.getFullYear() ?? 2000;
      const age = new Date().getFullYear() - birthYear;

      return {
        matchId: m.id,
        matchedAt: m.createdAt,
        conversationId: m.conversation?.id,
        conversationStatus: m.conversation?.status ?? 'LOCKED',
        isUnlocked: m.conversation?.status === 'ACTIVE',
        partner: {
          userId: partnerUser.id,
          firstName: partnerUser.profile?.firstName ?? 'Match',
          age,
          city: partnerUser.profile?.city ?? '',
          primaryPhotoUrl: partnerUser.profile?.photos[0]?.storageKey ?? null,
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
        OR: [{ userAId: userId }, { userBId: userId }],
        status: 'ACTIVE',
      },
      include: { conversation: true },
    });

    if (!match) {
      throw new Error('Match not found or already ended');
    }

    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: 'UNMATCHED',
          endedAt: new Date(),
        },
      });

      if (match.conversation) {
        await tx.conversation.update({
          where: { id: match.conversation.id },
          data: { status: 'CLOSED' },
        });
      }
    });

    return { success: true, message: 'Successfully unmatched' };
  }
}

export const matchesService = new MatchesService();
