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
            profilePhoto: true,
          },
        },
        photos: {
          where: { status: 'APPROVED' },
          orderBy: { isPrimary: 'desc' },
        },
        interests: {
          include: { interest: true },
        },
      },
    });

    if (!user || user.accountStatus !== 'ACTIVE') {
      throw new Error('User not found or account is not active');
    }

    // Check viewer verification status
    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { verificationStatus: true },
    });

    const isViewerVerified = viewer?.verificationStatus === 'VERIFIED';

    return {
      id: user.id,
      verificationStatus: user.verificationStatus,
      isVerified: user.verificationStatus === 'VERIFIED',
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            gender: user.profile.gender,
            city: user.profile.city,
            bio: user.profile.bio,
            relationshipGoal: user.profile.relationshipGoal,
            dateOfBirth: isViewerVerified ? user.profile.dateOfBirth : undefined,
            // If viewer is unverified, provide blurred storage key
            primaryPhoto: isViewerVerified
              ? user.profile.profilePhoto?.storageKey
              : user.profile.profilePhoto?.blurredStorageKey || user.profile.profilePhoto?.storageKey,
          }
        : null,
      photos: isViewerVerified
        ? user.photos.map((p) => ({ id: p.id, url: p.storageKey, isPrimary: p.isPrimary }))
        : user.photos.slice(0, 1).map((p) => ({ id: p.id, url: p.blurredStorageKey || p.storageKey, isPrimary: p.isPrimary })),
      interests: user.interests.map((ui) => ui.interest.name),
    };
  }
}

export const usersService = new UsersService();
