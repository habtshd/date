import { prisma } from '../../database/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';

export class ConversationsService {
  /**
   * List conversations for the authenticated user.
   * Strictly enforces Rule 4: User only sees conversations they are a member of.
   */
  async getUserConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ userLowId: userId }, { userHighId: userId }],
      },
      include: {
        userLow: {
          select: {
            id: true,
            role: true,
            profile: { select: { displayName: true } },
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
        userHigh: {
          select: {
            id: true,
            role: true,
            profile: { select: { displayName: true } },
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
        members: {
          where: { userId },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            contentEncrypted: true,
            messageType: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((c) => {
      const isLow = c.userLowId === userId;
      const partner = isLow ? c.userHigh : c.userLow;
      const myMembership = c.members[0];
      const lastMsg = c.messages[0];

      return {
        id: c.id,
        matchId: c.matchId,
        isUnlocked: c.isUnlocked,
        unlockedAt: c.unlockedAt,
        unreadCount: myMembership?.unreadMessagesCount ?? 0,
        partner: {
          userId: partner.id,
          displayName: partner.profile?.displayName ?? 'Match',
          photoUrl: partner.photos[0]?.originalUrl ?? null,
          isVerified: partner.role === 'VERIFIED_USER',
        },
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              preview: c.isUnlocked ? lastMsg.contentEncrypted : 'Locked conversation',
              messageType: lastMsg.messageType,
              createdAt: lastMsg.createdAt,
              isSentByMe: lastMsg.senderId === userId,
            }
          : null,
      };
    });
  }

  /**
   * Get specific conversation details
   */
  async getConversationById(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        userLow: {
          select: {
            id: true,
            role: true,
            profile: { select: { displayName: true, city: true, bio: true } },
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
        userHigh: {
          select: {
            id: true,
            role: true,
            profile: { select: { displayName: true, city: true, bio: true } },
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
        unlockRecord: {
          select: { unlockedAt: true, unlockedByUserId: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (conversation.userLowId !== userId && conversation.userHighId !== userId) {
      throw new ForbiddenError('Access denied. You are not a member of this conversation.');
    }

    const isLow = conversation.userLowId === userId;
    const partner = isLow ? conversation.userHigh : conversation.userLow;

    return {
      id: conversation.id,
      matchId: conversation.matchId,
      isUnlocked: conversation.isUnlocked,
      unlockedAt: conversation.unlockedAt,
      unlockedByUserId: conversation.unlockRecord?.unlockedByUserId,
      partner: {
        userId: partner.id,
        displayName: partner.profile?.displayName ?? 'Match',
        city: partner.profile?.city ?? '',
        bio: partner.profile?.bio ?? '',
        photoUrl: partner.photos[0]?.originalUrl ?? null,
        isVerified: partner.role === 'VERIFIED_USER',
      },
    };
  }
}

export const conversationsService = new ConversationsService();
