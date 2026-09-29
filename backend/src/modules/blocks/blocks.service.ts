import { prisma } from '../../plugins/prisma';
import { getCanonicalPair } from '../../utils/crypto';
import { wsManager } from '../../plugins/websocket';

export class BlocksService {
  /**
   * Immediately block a target user and close any mutual match / conversation
   */
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new Error('You cannot block yourself');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: blockedId },
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    const { userAId, userBId } = getCanonicalPair(blockerId, blockedId);

    await prisma.$transaction(async (tx) => {
      // 1. Create block record
      await tx.block.upsert({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
        create: {
          blockerId,
          blockedId,
        },
        update: {},
      });

      // 2. Terminate any active match between them
      const match = await tx.match.findUnique({
        where: {
          userAId_userBId: {
            userAId,
            userBId,
          },
        },
        include: { conversation: true },
      });

      if (match) {
        await tx.match.update({
          where: { id: match.id },
          data: { status: 'UNMATCHED', endedAt: new Date() },
        });

        if (match.conversation) {
          await tx.conversation.update({
            where: { id: match.conversation.id },
            data: { status: 'CLOSED' },
          });
        }
      }

      // 3. Remove pending likes between them
      await tx.like.deleteMany({
        where: {
          OR: [
            { fromUserId: blockerId, toUserId: blockedId },
            { fromUserId: blockedId, toUserId: blockerId },
          ],
        },
      });

      // 4. Record audit log
      await tx.auditLog.create({
        data: {
          actorUserId: blockerId,
          action: 'USER_BLOCKED',
          targetType: 'USER',
          targetId: blockedId,
          metadata: { timestamp: new Date().toISOString() },
        },
      });
    });

    // Notify blocked user's socket that conversation is closed
    wsManager.broadcastToUser(blockedId, {
      type: 'USER_DISCONNECTED_BLOCK',
      targetUserId: blockerId,
    });

    return { success: true, message: 'User blocked successfully' };
  }

  /**
   * Unblock a previously blocked user
   */
  async unblockUser(blockerId: string, blockedId: string) {
    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (!block) {
      throw new Error('Block record not found');
    }

    await prisma.block.delete({
      where: { id: block.id },
    });

    return { success: true, message: 'User unblocked successfully' };
  }

  /**
   * List blocked users
   */
  async getBlockedUsers(userId: string) {
    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            profile: { select: { firstName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map((b) => ({
      blockId: b.id,
      blockedUserId: b.blocked.id,
      firstName: b.blocked.profile?.firstName ?? 'User',
      blockedAt: b.createdAt,
    }));
  }
}

export const blocksService = new BlocksService();
