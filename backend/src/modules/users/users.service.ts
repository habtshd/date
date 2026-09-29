import { prisma } from '../../plugins/prisma';
import { logger } from '../../utils/logger';

export class UsersService {
  async deleteAccount(userId: string): Promise<{ success: boolean; message: string }> {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          accountStatus: 'DELETED',
          phoneVerified: false,
        },
      });

      // Revoke all active sessions
      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // Log audit
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: 'USER_SELF_DELETED',
          targetType: 'USER',
          targetId: userId,
          metadata: { timestamp: new Date().toISOString() },
        },
      });
    });

    logger.info('User account marked as deleted', { userId });
    return { success: true, message: 'Account successfully deactivated' };
  }

  async getUserPublicProfile(viewerId: string, targetUserId: string) {
    // Check if target is blocked by viewer or viewer is blocked by target
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: viewerId },
        ],
      },
    });

    if (isBlocked) {
      throw new Error('User profile is not available');
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: {
          include: {
            primaryPhoto: true,
            photos: {
              where: { status: 'APPROVED' },
              orderBy: { isPrimary: 'desc' },
            },
            interests: {
              include: { interest: true },
            },
          },
        },
      },
    });

    if (!user || user.accountStatus !== 'ACTIVE' || !user.profile) {
      throw new Error('User not found or account is not active');
    }

    // Check viewer verification status
    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { verificationStatus: true },
    });

    const isViewerVerified = viewer?.verificationStatus === 'VERIFIED';
    const profile = user.profile;

    return {
      id: user.id,
      verificationStatus: user.verificationStatus,
      isVerified: user.verificationStatus === 'VERIFIED',
      profile: {
        firstName: profile.firstName,
        gender: profile.gender,
        city: profile.city,
        bio: profile.bio,
        relationshipGoal: profile.relationshipGoal,
        dateOfBirth: isViewerVerified ? profile.dateOfBirth : undefined,
        primaryPhoto: isViewerVerified
          ? profile.primaryPhoto?.storageKey
          : profile.primaryPhoto?.blurredStorageKey || profile.primaryPhoto?.storageKey,
      },
      photos: isViewerVerified
        ? profile.photos.map((p) => ({ id: p.id, url: p.storageKey, isPrimary: p.isPrimary }))
        : profile.photos.slice(0, 1).map((p) => ({ id: p.id, url: p.blurredStorageKey || p.storageKey, isPrimary: p.isPrimary })),
      interests: profile.interests.map((ui) => ui.interest.name),
    };
  }
}

export const usersService = new UsersService();
