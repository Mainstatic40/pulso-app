import { PrismaClient } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/app-error';

const prisma = new PrismaClient();

const participantSelect = {
  conversationId: true,
  userId: true,
  joinedAt: true,
  lastReadAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
    },
  },
};

const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  attachmentId: true,
  createdAt: true,
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

const conversationSelect = {
  id: true,
  name: true,
  isGroup: true,
  createdAt: true,
  updatedAt: true,
  participants: {
    select: participantSelect,
  },
};

export const conversationService = {
  async findOrCreateDirectConversation(userId1: string, userId2: string) {
    // Find existing 1:1 conversation between these two users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } },
        ],
      },
      select: {
        ...conversationSelect,
        messages: {
          select: messageSelect,
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new 1:1 conversation
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
      select: {
        ...conversationSelect,
        messages: {
          select: messageSelect,
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return conversation;
  },

  async createGroupConversation(name: string, participantIds: string[], createdBy: string) {
    if (!name?.trim()) {
      throw new ValidationError('Group name is required');
    }

    if (participantIds.length < 2) {
      throw new ValidationError('Group must have at least 2 participants');
    }

    // Ensure creator is included
    const uniqueParticipants = [...new Set([createdBy, ...participantIds])];

    const conversation = await prisma.conversation.create({
      data: {
        name: name.trim(),
        isGroup: true,
        participants: {
          create: uniqueParticipants.map((userId) => ({ userId })),
        },
      },
      select: {
        ...conversationSelect,
        messages: {
          select: messageSelect,
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return conversation;
  },

  async findAllForUser(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      select: {
        ...conversationSelect,
        messages: {
          select: messageSelect,
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === userId);
        const lastReadAt = participant?.lastReadAt;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
          },
        });

        return {
          ...conv,
          lastMessage: conv.messages[0] || null,
          unreadCount,
        };
      })
    );

    return conversationsWithUnread;
  },

  async findById(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        ...conversationSelect,
        messages: {
          select: messageSelect,
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    // Calculate unread count
    const participant = conversation.participants.find((p) => p.userId === userId);
    const lastReadAt = participant?.lastReadAt;

    const unreadCount = await prisma.message.count({
      where: {
        conversationId: conversation.id,
        senderId: { not: userId },
        createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
      },
    });

    return {
      ...conversation,
      messages: conversation.messages.reverse(), // Return in chronological order
      unreadCount,
    };
  },

  async addParticipant(conversationId: string, userId: string, addedBy: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (!conversation.isGroup) {
      throw new ValidationError('Cannot add participants to a direct conversation');
    }

    // Check if addedBy is a participant
    const isAdder = conversation.participants.some((p) => p.userId === addedBy);
    if (!isAdder) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    // Check if user is already a participant
    const isAlreadyParticipant = conversation.participants.some((p) => p.userId === userId);
    if (isAlreadyParticipant) {
      throw new ValidationError('User is already a participant');
    }

    await prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId,
      },
    });

    return this.findById(conversationId, addedBy);
  },

  async removeParticipant(conversationId: string, userId: string, removedBy: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (!conversation.isGroup) {
      throw new ValidationError('Cannot remove participants from a direct conversation');
    }

    // Check if removedBy is a participant
    const isRemover = conversation.participants.some((p) => p.userId === removedBy);
    if (!isRemover) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    await prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    return { message: 'Participant removed successfully' };
  },

  async markAsRead(conversationId: string, userId: string) {
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

    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return { message: 'Conversation marked as read' };
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
