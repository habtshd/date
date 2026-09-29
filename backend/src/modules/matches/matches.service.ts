import { prisma } from '../../plugins/prisma';
import { calculateAge } from '../../utils/age';

export class MatchesService {
  /**
   * List all active matches for the authenticated user
   * Returns private match view (other user's matches are never exposed)
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
      const birthDate = partnerUser.profile?.dateOfBirth;
      const age = birthDate ? calculateAge(birthDate) : 25;

      return {
        matchId: m.id,
        profile: {
          id: partnerUser.id,
          firstName: partnerUser.profile?.firstName ?? 'Match',
          age,
          city: partnerUser.profile?.city ?? '',
          photoUrl: partnerUser.profile?.photos[0]?.storageKey ?? null,
        },
        conversation: {
          id: m.conversation?.id,
          status: m.conversation?.status ?? 'LOCKED',
        },
        createdAt: m.createdAt.toISOString(),
      };
    });
  }

  /**
   * Unmatch a partner
   * Transitions Match to UNMATCHED and Conversation to CLOSED
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
