import { prisma } from '../../plugins/prisma';
import { paymentsService } from '../payments/payments.service';

export class ConversationsService {
  /**
   * List conversations for the authenticated user.
   * Strictly enforces: User only sees conversations they are a member of.
   */
  async getUserConversations(userId: string) {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            match: {
              include: {
                userA: {
                  select: {
                    id: true,
                    verificationStatus: true,
                    profile: {
                      select: {
                        firstName: true,
                        photos: { where: { isPrimary: true, status: 'APPROVED' }, take: 1 },
                      },
                    },
                  },
                },
                userB: {
                  select: {
                    id: true,
                    verificationStatus: true,
                    profile: {
                      select: {
                        firstName: true,
                        photos: { where: { isPrimary: true, status: 'APPROVED' }, take: 1 },
                      },
                    },
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => {
      const c = m.conversation;
      const match = c.match;
      const isUserA = match.userAId === userId;
      const partner = isUserA ? match.userB : match.userA;
      const lastMsg = c.messages[0];

      return {
        id: c.id,
        matchId: c.matchId,
        status: c.status,
        isUnlocked: c.status === 'ACTIVE',
        unlockedAt: c.unlockedAt,
        partner: {
          userId: partner.id,
          firstName: partner.profile?.firstName ?? 'Match',
          photoUrl: partner.profile?.photos[0]?.storageKey ?? null,
          isVerified: partner.verificationStatus === 'VERIFIED',
        },
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              preview: c.status === 'ACTIVE' ? lastMsg.content : 'Locked conversation',
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
        match: {
          include: {
            userA: {
              select: {
                id: true,
                verificationStatus: true,
                profile: {
                  select: {
                    firstName: true,
                    city: true,
                    bio: true,
                    photos: { where: { isPrimary: true, status: 'APPROVED' }, take: 1 },
                  },
                },
              },
            },
            userB: {
              select: {
                id: true,
                verificationStatus: true,
                profile: {
                  select: {
                    firstName: true,
                    city: true,
                    bio: true,
                    photos: { where: { isPrimary: true, status: 'APPROVED' }, take: 1 },
                  },
                },
              },
            },
          },
        },
        members: true,
        payments: {
          where: { status: 'SUCCESS' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const isMember = conversation.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new Error('Access denied. You are not a member of this conversation.');
    }

    const isUserA = conversation.match.userAId === userId;
    const partner = isUserA ? conversation.match.userB : conversation.match.userA;
    const successfulPayment = conversation.payments[0];

    return {
      id: conversation.id,
      matchId: conversation.matchId,
      status: conversation.status,
      isUnlocked: conversation.status === 'ACTIVE',
      unlockedAt: conversation.unlockedAt,
      paidByUserId: successfulPayment?.userId,
      partner: {
        userId: partner.id,
        firstName: partner.profile?.firstName ?? 'Match',
        city: partner.profile?.city ?? '',
        bio: partner.profile?.bio ?? '',
        photoUrl: partner.profile?.photos[0]?.storageKey ?? null,
        isVerified: partner.verificationStatus === 'VERIFIED',
      },
    };
  }

  /**
   * Request pay-per-conversation unlock order
   */
  async requestUnlock(userId: string, conversationId: string, provider = 'CHAPA') {
    return paymentsService.initiateConversationPayment(userId, conversationId, provider);
  }
}

export const conversationsService = new ConversationsService();
