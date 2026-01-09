import bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/app-error';
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from '../schemas/user.schema';

const prisma = new PrismaClient();

const userSelect = {
  id: true,
  name: true,
  email: true,
  rfidTag: true,
  profileImage: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  rfidTag: string | null;
  profileImage: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const userService = {
  async findAll(query: ListUsersQuery): Promise<PaginatedResult<UserResponse>> {
    const { page = 1, limit = 10, role, isActive } = query;
    const skip = (page - 1) * limit;

    const where: { role?: UserRole; isActive?: boolean } = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  },

  async create(input: CreateUserInput) {
    const { email, password, rfidTag, ...rest } = input;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      throw new ValidationError('Email already in use');
    }

    // Check if rfidTag already exists (if provided)
    if (rfidTag) {
      const existingRfid = await prisma.user.findUnique({
        where: { rfidTag },
      });

      if (existingRfid) {
        throw new ValidationError('RFID tag already in use');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        ...rest,
        email: email.toLowerCase(),
        passwordHash,
        rfidTag: rfidTag || null,
      },
      select: userSelect,
    });

    return user;
  },

  async update(id: string, input: UpdateUserInput) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const { email, password, rfidTag, ...rest } = input;
    const updateData: Record<string, unknown> = { ...rest };

    // Check if new email is unique
    if (email && email.toLowerCase() !== existingUser.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingEmail) {
        throw new ValidationError('Email already in use');
      }

      updateData.email = email.toLowerCase();
    }

    // Check if new rfidTag is unique
    if (rfidTag !== undefined) {
      if (rfidTag && rfidTag !== existingUser.rfidTag) {
        const existingRfid = await prisma.user.findUnique({
          where: { rfidTag },
        });

        if (existingRfid) {
          throw new ValidationError('RFID tag already in use');
        }
      }
      updateData.rfidTag = rfidTag;
    }

    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    return user;
  },

  async delete(id: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Soft delete - set isActive to false
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userSelect,
    });

    return user;
  },

  async hardDelete(id: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Delete related records first (cascade doesn't work for all relations)
    await prisma.$transaction(async (tx) => {
      // Get IDs of tasks and events created by this user
      const userTasks = await tx.task.findMany({
        where: { createdBy: id },
        select: { id: true },
      });
      const taskIds = userTasks.map((t) => t.id);

      const userEvents = await tx.event.findMany({
        where: { createdBy: id },
        select: { id: true },
      });
      const eventIds = userEvents.map((e) => e.id);

      // Get IDs of EventShifts of this user
      const userEventShifts = await tx.eventShift.findMany({
        where: { userId: id },
        select: { id: true },
      });
      const eventShiftIds = userEventShifts.map((s) => s.id);

      // Get IDs of attachments uploaded by this user (including those on tasks/events)
      const userAttachments = await tx.attachment.findMany({
        where: { uploadedBy: id },
        select: { id: true },
      });
      const attachmentIds = userAttachments.map((a) => a.id);

      // Get IDs of attachments on tasks created by user (for message cleanup)
      const taskAttachments = await tx.attachment.findMany({
        where: { taskId: { in: taskIds } },
        select: { id: true },
      });
      const taskAttachmentIds = taskAttachments.map((a) => a.id);

      // Get IDs of attachments on events created by user (for message cleanup)
      const eventAttachments = await tx.attachment.findMany({
        where: { eventId: { in: eventIds } },
        select: { id: true },
      });
      const eventAttachmentIds = eventAttachments.map((a) => a.id);

      // Combine all attachment IDs that need message cleanup
      const allAttachmentIds = [
        ...new Set([...attachmentIds, ...taskAttachmentIds, ...eventAttachmentIds]),
      ];

      // 1. Delete notifications
      await tx.notification.deleteMany({ where: { userId: id } });

      // 2. Nullify attachmentId in messages that reference affected attachments
      if (allAttachmentIds.length > 0) {
        await tx.message.updateMany({
          where: { attachmentId: { in: allAttachmentIds } },
          data: { attachmentId: null },
        });
      }

      // 3. Delete messages sent by user
      await tx.message.deleteMany({ where: { senderId: id } });

      // 4. Delete conversation participants
      await tx.conversationParticipant.deleteMany({ where: { userId: id } });

      // 5. Delete comments by user
      await tx.comment.deleteMany({ where: { userId: id } });

      // 6. Delete task assignees by user
      await tx.taskAssignee.deleteMany({ where: { userId: id } });

      // 7. Delete event assignees by user
      await tx.eventAssignee.deleteMany({ where: { userId: id } });

      // 8. Delete equipment assignments referencing user's event shifts
      if (eventShiftIds.length > 0) {
        await tx.equipmentAssignment.deleteMany({
          where: { eventShiftId: { in: eventShiftIds } },
        });
      }

      // 9. Delete event shifts by user
      await tx.eventShift.deleteMany({ where: { userId: id } });

      // 10. Delete equipment assignments referencing user's events
      if (eventIds.length > 0) {
        await tx.equipmentAssignment.deleteMany({
          where: { eventId: { in: eventIds } },
        });
      }

      // 11. Delete equipment assignments created by user
      await tx.equipmentAssignment.deleteMany({ where: { createdBy: id } });

      // 12. Delete equipment assignments where user is assigned
      await tx.equipmentAssignment.deleteMany({ where: { userId: id } });

      // 13. Delete time entries for user's events
      if (eventIds.length > 0) {
        await tx.timeEntry.deleteMany({
          where: { eventId: { in: eventIds } },
        });
      }

      // 14. Delete time entries by user
      await tx.timeEntry.deleteMany({ where: { userId: id } });

      // 15. Nullify eventId in EventRequests for user's events
      if (eventIds.length > 0) {
        await tx.eventRequest.updateMany({
          where: { eventId: { in: eventIds } },
          data: { eventId: null },
        });
      }

      // 16. Delete tasks created by user (cascades: attachments, comments, assignees, checklist items)
      if (taskIds.length > 0) {
        await tx.task.deleteMany({ where: { id: { in: taskIds } } });
      }

      // 17. Delete events created by user (cascades: assignees, days, shifts, attachments)
      if (eventIds.length > 0) {
        await tx.event.deleteMany({ where: { id: { in: eventIds } } });
      }

      // 18. Delete orphan attachments uploaded by user (those not attached to task/event)
      await tx.attachment.deleteMany({ where: { uploadedBy: id } });

      // 19. Delete weekly logs
      await tx.weeklyLog.deleteMany({ where: { userId: id } });

      // 20. Delete monthly hours configs created by user
      await tx.monthlyHoursConfig.deleteMany({ where: { createdBy: id } });

      // 21. Delete equipment usage log items (cascade from logs, but be explicit)
      const userLogs = await tx.equipmentUsageLog.findMany({
        where: { userId: id },
        select: { id: true },
      });
      const logIds = userLogs.map((l) => l.id);
      if (logIds.length > 0) {
        await tx.equipmentUsageLogItem.deleteMany({
          where: { logId: { in: logIds } },
        });
      }

      // 22. Delete equipment usage logs
      await tx.equipmentUsageLog.deleteMany({ where: { userId: id } });

      // 23. Finally delete the user
      await tx.user.delete({ where: { id } });
    });

    return { message: 'Usuario eliminado permanentemente' };
  },

  async updateProfileImage(id: string, imagePath: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const user = await prisma.user.update({
      where: { id },
      data: { profileImage: imagePath },
      select: userSelect,
    });

    return user;
  },

  async deleteProfileImage(id: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const user = await prisma.user.update({
      where: { id },
      data: { profileImage: null },
      select: userSelect,
    });

    return { user, previousImage: existingUser.profileImage };
  },
};
