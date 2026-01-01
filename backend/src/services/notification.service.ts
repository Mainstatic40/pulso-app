import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  link: true,
  isRead: true,
  metadata: true,
  createdAt: true,
};

export interface CreateNotificationInput {
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Prisma.InputJsonValue;
}

export const notificationService = {
  async create(userId: string, input: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        metadata: input.metadata,
      },
      select: notificationSelect,
    });

    return notification;
  },

  async createForMany(userIds: string[], input: CreateNotificationInput) {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        prisma.notification.create({
          data: {
            userId,
            type: input.type,
            title: input.title,
            message: input.message,
            link: input.link,
            metadata: input.metadata,
          },
          select: notificationSelect,
        })
      )
    );

    return notifications;
  },

  async findByUser(userId: string, options?: { limit?: number; unreadOnly?: boolean }) {
    const where: Prisma.NotificationWhereInput = { userId };

    if (options?.unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      select: notificationSelect,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });

    return notifications;
  },

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user can only mark their own notifications
      },
      data: {
        isRead: true,
      },
    });

    return notification.count > 0;
  },

  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { count: result.count };
  },

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  },

  async delete(notificationId: string, userId: string) {
    const result = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId, // Ensure user can only delete their own notifications
      },
    });

    return result.count > 0;
  },

  async deleteOld(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true, // Only delete read notifications
      },
    });

    return { count: result.count };
  },
};
