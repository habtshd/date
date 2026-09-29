import { prisma } from '../../plugins/prisma';
import { MessageType } from '@prisma/client';
import { wsManager } from '../../plugins/websocket';

export class MessagesService {
  /**
   * Send a message within an unlocked conversation
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    data: {
      messageType?: MessageType;
      content: string;
    }
  ) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        match: true,
        members: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // 1. Membership check
    const isMember = conversation.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new Error('You are not authorized to send messages in this conversation');
    }

    // 2. Paywall check: Must be ACTIVE (unlocked)
    if (conversation.status !== 'ACTIVE') {
      throw new Error(
        'This conversation is locked. A payment is required before messages can be sent or read.'
      );
    }

    const partnerId = conversation.match.userAId === userId
      ? conversation.match.userBId
      : conversation.match.userAId;

    // 3. Block check
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: partnerId },
          { blockerId: partnerId, blockedId: userId },
        ],
      },
    });

    if (isBlocked) {
      throw new Error('Messaging is disabled because of a block between users');
    }

    // 4. Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        messageType: data.messageType || 'TEXT',
        content: data.content,
      },
    });

    // 5. Broadcast to partner via WebSocket if connected
    wsManager.broadcastToUser(partnerId, {
      type: 'NEW_MESSAGE',
      message: {
        id: message.id,
        conversationId,
        senderId: userId,
        messageType: message.messageType,
        content: message.content,
        createdAt: message.createdAt,
      },
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: partnerId,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        body: 'You have a new message.',
      },
    }).catch(() => {});

    return message;
  }

  /**
   * Fetch message history for an unlocked conversation
   */
  async getMessages(userId: string, conversationId: string, limit = 50) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const isMember = conversation.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new Error('Access denied to conversation history');
    }

    if (conversation.status !== 'ACTIVE') {
      throw new Error('Conversation is locked. Payment required.');
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        reads: {
          where: { userId },
        },
      },
    });

    // Record read markers in message_reads
    for (const msg of messages) {
      if (msg.senderId !== userId && msg.reads.length === 0) {
        await prisma.messageRead.upsert({
          where: {
            messageId_userId: {
              messageId: msg.id,
              userId,
            },
          },
          create: { messageId: msg.id, userId },
          update: {},
        }).catch(() => {});
      }
    }

    return messages.reverse().map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      messageType: m.messageType,
      content: m.content,
      createdAt: m.createdAt,
      isMine: m.senderId === userId,
      isRead: m.reads.length > 0,
    }));
  }
}

export const messagesService = new MessagesService();
