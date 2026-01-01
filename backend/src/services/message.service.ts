import { PrismaClient } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/app-error';

const prisma = new PrismaClient();

const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  attachmentId: true,
  createdAt: true,
  updatedAt: true,
  sender: {
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
    },
  },
  attachment: {
    select: {
      id: true,
      filename: true,
      storedName: true,
      mimeType: true,
      size: true,
    },
  },
};

export const messageService = {
  async create(
    conversationId: string,
    senderId: string,
    content: string,
    attachmentId?: string
  ) {
    // Verify sender is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: senderId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    if (!content?.trim() && !attachmentId) {
      throw new ValidationError('Message content or attachment is required');
    }

    // If attachmentId provided, verify it exists
    if (attachmentId) {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });
      if (!attachment) {
        throw new NotFoundError('Attachment not found');
      }
    }

    // Create message and update conversation updatedAt
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId,
          content: content?.trim() || '',
          attachmentId,
        },
        select: messageSelect,
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
      // Auto-mark as read for sender
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: senderId,
          },
        },
        data: { lastReadAt: new Date() },
      }),
    ]);

    return message;
  },

  async findByConversation(
    conversationId: string,
    userId: string,
    options: { limit?: number; before?: string } = {}
  ) {
    const { limit = 50, before } = options;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    const where: {
      conversationId: string;
      createdAt?: { lt: Date };
    } = { conversationId };

    if (before) {
      const beforeMessage = await prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      if (beforeMessage) {
        where.createdAt = { lt: beforeMessage.createdAt };
      }
    }

    const messages = await prisma.message.findMany({
      where,
      select: messageSelect,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse(); // Return in chronological order
  },

  async getUnreadCount(userId: string) {
    // Get all conversations for user
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      select: {
        id: true,
        participants: {
          where: { userId },
          select: { lastReadAt: true },
        },
      },
    });

    let totalUnread = 0;

    for (const conv of conversations) {
      const lastReadAt = conv.participants[0]?.lastReadAt;

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
        },
      });

      totalUnread += unreadCount;
    }

    return { unreadCount: totalUnread };
  },
};
