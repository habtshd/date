import { prisma } from '../../database/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import { MessageType } from '@prisma/client';
import { chatGateway } from '../../realtime/chatGateway';

export class MessagesService {
  /**
   * Send a message within an unlocked conversation
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    data: {
      messageType: MessageType;
      content?: string;
      mediaUrl?: string;
      mediaMetadata?: Record<string, unknown>;
    }
  ) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // 1. Membership check
    if (conversation.userLowId !== userId && conversation.userHighId !== userId) {
      throw new ForbiddenError('You are not authorized to send messages in this conversation');
    }

    // 2. Paywall check: Must be unlocked
    if (!conversation.isUnlocked) {
      throw new ForbiddenError(
        'This conversation is locked. A payment is required before messages can be sent or read.'
      );
    }

    const partnerId = conversation.userLowId === userId ? conversation.userHighId : conversation.userLowId;

    // 3. Block check
    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: partnerId },
          { blockerId: partnerId, blockedId: userId },
        ],
      },
    });

    if (isBlocked) {
      throw new ForbiddenError('Messaging is disabled because of a block between users');
    }

    // 4. Create message & update conversation state atomically
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          messageType: data.messageType,
          contentEncrypted: data.content,
          mediaUrl: data.mediaUrl,
          mediaMetadata: data.mediaMetadata ? JSON.parse(JSON.stringify(data.mediaMetadata)) : undefined,
          status: 'SENT',
        },
      });

      // Update conversation lastMessageId and updatedAt
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageId: msg.id,
          updatedAt: new Date(),
        },
      });

      // Increment unread count for partner
      await tx.conversationMember.updateMany({
        where: {
          conversationId,
          userId: partnerId,
        },
        data: {
          unreadMessagesCount: { increment: 1 },
        },
      });

      return msg;
    });

    // 5. Broadcast to partner via WebSocket if connected
    chatGateway.broadcastToUser(partnerId, {
      type: 'NEW_MESSAGE',
      message: {
        id: message.id,
        conversationId,
        senderId: userId,
        messageType: message.messageType,
        content: message.contentEncrypted,
        mediaUrl: message.mediaUrl,
        createdAt: message.createdAt,
      },
    });

    return message;
  }

  /**
   * Fetch message history for an unlocked conversation
   */
  async getMessages(userId: string, conversationId: string, limit = 50, beforeMessageId?: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Membership check
    if (conversation.userLowId !== userId && conversation.userHighId !== userId) {
      throw new ForbiddenError('Access denied to conversation history');
    }

    // Paywall check: Must be unlocked
    if (!conversation.isUnlocked) {
      throw new ForbiddenError('Conversation is locked. Payment required.');
    }

    let cursorFilter = {};
    if (beforeMessageId) {
      cursorFilter = {
        cursor: { id: beforeMessageId },
        skip: 1,
      };
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...cursorFilter,
    });

    // Mark messages read for current user
    await prisma.conversationMember.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        unreadMessagesCount: 0,
        lastReadMessageId: messages[0]?.id,
      },
    });

    return messages.reverse().map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      messageType: m.messageType,
      content: m.contentEncrypted,
      mediaUrl: m.mediaUrl,
      mediaMetadata: m.mediaMetadata,
      status: m.status,
      createdAt: m.createdAt,
      isMine: m.senderId === userId,
    }));
  }
}

export const messagesService = new MessagesService();
