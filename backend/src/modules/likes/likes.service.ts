import { prisma } from '../../plugins/prisma';
import { getCanonicalPair } from '../../utils/crypto';

export class LikesService {
  /**
   * Express a like towards a target profile.
   * Server validates identity, status, blocks, and detects mutual likes atomically.
   */
  async likeProfile(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new Error('CANNOT_LIKE_SELF');
    }

    const target = await prisma.user.findUnique({
      where: { id: toUserId },
      select: {
        id: true,
        accountStatus: true,
        verificationStatus: true,
        profile: {
          select: {
            firstName: true,
          },
        },
      },
    });

    if (!target) {
      throw new Error('USER_NOT_FOUND');
    }

    if (target.accountStatus !== 'ACTIVE') {
      throw new Error('USER_UNAVAILABLE');
    }

    if (target.verificationStatus !== 'VERIFIED') {
      throw new Error('USER_UNAVAILABLE');
    }

    // Check if target user has blocked liker or liker blocked target
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: fromUserId, blockedId: toUserId },
          { blockerId: toUserId, blockedId: fromUserId },
        ],
      },
    });

    if (isBlocked) {
      throw new Error('USER_UNAVAILABLE');
    }

    // Record or update like
    await prisma.like.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId,
        },
      },
      create: {
        fromUserId,
        toUserId,
      },
      update: {},
    });

    // Check for reciprocal like
    const reciprocalLike = await prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: toUserId,
          toUserId: fromUserId,
        },
      },
    });

    if (!reciprocalLike) {
      return {
        liked: true,
        matched: false,
      };
    }

    // Mutual match detected! Atomically create match & locked conversation
    return this.createMatch(fromUserId, toUserId, target.profile?.firstName);
  }

  /**
   * Atomically create or reactivate a match and its locked conversation
   */
  async createMatch(userOneId: string, userTwoId: string, targetFirstName?: string) {
    const { userAId, userBId } = getCanonicalPair(userOneId, userTwoId);

    return prisma.$transaction(async (tx) => {
      const match = await tx.match.upsert({
        where: {
          userAId_userBId: {
            userAId,
            userBId,
          },
        },
        create: {
          userAId,
          userBId,
          status: 'ACTIVE',
        },
        update: {
          status: 'ACTIVE',
          endedAt: null,
        },
      });

      const conversation = await tx.conversation.upsert({
        where: { matchId: match.id },
        create: {
          matchId: match.id,
          status: 'LOCKED',
        },
        update: {},
      });

      // Ensure membership records exist for both users
      await tx.conversationMember.upsert({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: userAId,
          },
        },
        create: { conversationId: conversation.id, userId: userAId },
        update: {},
      });

      await tx.conversationMember.upsert({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: userBId,
          },
        },
        create: { conversationId: conversation.id, userId: userBId },
        update: {},
      });

      // Send match notifications to both participants
      await tx.notification.createMany({
        data: [
          {
            userId: userOneId,
            type: 'NEW_MATCH',
            title: 'You have a new match',
            body: targetFirstName ? `You matched with ${targetFirstName}.` : 'You have a new mutual match.',
          },
          {
            userId: userTwoId,
            type: 'NEW_MATCH',
            title: 'You have a new match',
            body: 'You have a new mutual match.',
          },
        ],
      });

      return {
        liked: true,
        matched: true,
        matchId: match.id,
        conversationId: conversation.id,
        conversationStatus: conversation.status,
      };
    });
  }

  /**
   * Remove a like (unlike)
   */
  async unlikeProfile(fromUserId: string, toUserId: string) {
    await prisma.like.deleteMany({
      where: { fromUserId, toUserId },
    });
    return { success: true, message: 'Like removed' };
  }
}

export const likesService = new LikesService();
