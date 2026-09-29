import { prisma } from '../../database/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { getCanonicalPair } from '../../common/crypto';

export class LikesService {
  /**
   * Express like towards a target profile.
   * Atomically checks for mutual match and initializes locked conversation if matched.
   */
  async likeProfile(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestError('You cannot like your own profile');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
      include: { profile: true },
    });

    if (!targetUser || targetUser.accountStatus !== 'ACTIVE' || !targetUser.profile) {
      throw new NotFoundError('Target profile is not available');
    }

    // Check if target user has blocked liker
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: fromUserId, blockedId: toUserId },
          { blockerId: toUserId, blockedId: fromUserId },
        ],
      },
    });

    if (isBlocked) {
      throw new ForbiddenError('Unable to interact with this profile');
    }

    // Record like
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

    // Check if reverse like exists (targetUser already liked fromUser)
    const reverseLike = await prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: toUserId,
          toUserId: fromUserId,
        },
      },
    });

    if (!reverseLike) {
      return {
        isMatch: false,
        message: 'Like sent successfully',
      };
    }

    // Mutual Match detected!
    const { userAId, userBId } = getCanonicalPair(fromUserId, toUserId);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or reactivate Match record
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

      // 2. Create Locked Conversation record
      const conversation = await tx.conversation.upsert({
        where: { matchId: match.id },
        create: {
          matchId: match.id,
          status: 'LOCKED',
        },
        update: {},
      });

      // 3. Ensure both participants have membership records
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

      // 4. Create Match notification for both users
      await tx.notification.createMany({
        data: [
          {
            userId: userAId,
            type: 'NEW_MATCH',
            title: 'New Match!',
            body: 'You have a new mutual match.',
          },
          {
            userId: userBId,
            type: 'NEW_MATCH',
            title: 'New Match!',
            body: 'You have a new mutual match.',
          },
        ],
      });

      return {
        matchId: match.id,
        conversationId: conversation.id,
        conversationStatus: conversation.status,
      };
    });

    return {
      isMatch: true,
      message: "It's a Match! Choose 'Start Chat' to unlock this conversation.",
      match: {
        matchId: result.matchId,
        conversationId: result.conversationId,
        conversationStatus: result.conversationStatus,
        partner: {
          userId: targetUser.id,
          firstName: targetUser.profile.firstName,
        },
      },
    };
  }

  /**
   * Pass (skip) a profile in discovery
   */
  async passProfile(_userId: string, _targetUserId: string) {
    // In Phase 2 spec, passing is simply not creating a like; returns confirmation
    return { message: 'Profile passed' };
  }
}

export const likesService = new LikesService();
