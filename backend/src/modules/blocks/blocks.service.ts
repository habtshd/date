import { prisma } from '../../database/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';

export class BlocksService {
  /**
   * Immediately block a target user
   */
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestError('You cannot block yourself');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: blockedId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    await prisma.block.upsert({
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

    return { message: 'User blocked successfully' };
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
      throw new NotFoundError('Block record not found');
    }

    await prisma.block.delete({
      where: { id: block.id },
    });

    return { message: 'User unblocked successfully' };
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
