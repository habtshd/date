import { prisma } from '../../plugins/prisma';

export class PassesService {
  /**
   * Record a pass on a user profile.
   * Excludes the passed user from the originating user's discovery feed.
   */
  async passProfile(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new Error('CANNOT_PASS_SELF');
    }

    const target = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, accountStatus: true },
    });

    if (!target) {
      throw new Error('USER_NOT_FOUND');
    }

    await prisma.pass.upsert({
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

    return {
      success: true,
      passed: true,
    };
  }
}

export const passesService = new PassesService();
