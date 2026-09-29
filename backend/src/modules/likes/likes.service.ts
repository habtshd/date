import { prisma } from '../../database/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { getCanonicalPair } from '../../common/crypto';

export class LikesService {
  /**
   * Express like towards a target profile.
   * Atomically checks for mutual match and initializes locked conversation if matched.
   */
  async likeProfile(likerId: string, targetUserId: string, isSuperlike = false) {
    if (likerId === targetUserId) {
      throw new BadRequestError('You cannot like your own profile');
    }

    // Verify target profile exists and is active
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });

    if (!targetUser || targetUser.status !== 'ACTIVE' || !targetUser.profile) {
      throw new NotFoundError('Target profile is not available');
    }

    // Check if target user has blocked liker
    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: likerId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: likerId },
        ],
      },
    });

    if (isBlocked) {
      throw new ForbiddenError('Unable to interact with this profile');
    }

    // Record the like (ignore duplicate likes idempotently)
    await prisma.like.upsert({
      where: {
        likerId_likedId: {
          likerId,
          likedId: targetUserId,
        },
      },
      create: {
        likerId,
        likedId: targetUserId,
        isSuperlike,
      },
      update: {
        isSuperlike,
      },
    });

    // Check if reverse like exists (targetUser already liked liker)
    const reverseLike = await prisma.like.findUnique({
      where: {
        likerId_likedId: {
          likerId: targetUserId,
          likedId: likerId,
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
    const { userLowId, userHighId } = getCanonicalPair(likerId, targetUserId);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or reactivate Match record
      const match = await tx.match.upsert({
        where: {
          userLowId_userHighId: {
            userLowId,
            userHighId,
          },
        },
        create: {
          userLowId,
          userHighId,
          isActive: true,
        },
        update: {
          isActive: true,
          unmatchedAt: null,
          unmatchedByUserId: null,
        },
      });

      // 2. Create Locked Conversation record
      const conversation = await tx.conversation.upsert({
        where: {
          userLowId_userHighId: {
            userLowId,
            userHighId,
          },
        },
        create: {
          matchId: match.id,
          userLowId,
          userHighId,
          isUnlocked: false, // Locked until payment!
        },
        update: {},
      });

      // 3. Ensure both participants have membership records
      await tx.conversationMember.upsert({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: userLowId,
          },
        },
        create: { conversationId: conversation.id, userId: userLowId },
        update: {},
      });

      await tx.conversationMember.upsert({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: userHighId,
          },
        },
        create: { conversationId: conversation.id, userId: userHighId },
        update: {},
      });

      return {
        matchId: match.id,
        conversationId: conversation.id,
        isUnlocked: conversation.isUnlocked,
      };
    });

    return {
      isMatch: true,
      message: "It's a Match! Choose 'Start Chat' to unlock this conversation.",
      match: {
        matchId: result.matchId,
        conversationId: result.conversationId,
        isUnlocked: result.isUnlocked,
        partner: {
          userId: targetUser.id,
          displayName: targetUser.profile.displayName,
        },
      },
    };
  }

  /**
   * Pass (skip) a profile in discovery
   */
  async passProfile(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestError('You cannot pass your own profile');
    }

    await prisma.profilePass.upsert({
      where: {
        userId_targetUserId: {
          userId,
          targetUserId,
        },
      },
      create: { userId, targetUserId },
      update: {},
    });

    return { message: 'Profile passed' };
  }
}

export const likesService = new LikesService();
