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
      // Delete task assignees
      await tx.taskAssignee.deleteMany({ where: { userId: id } });
      // Delete event assignees
      await tx.eventAssignee.deleteMany({ where: { userId: id } });
      // Delete event shifts
      await tx.eventShift.deleteMany({ where: { userId: id } });
      // Delete comments
      await tx.comment.deleteMany({ where: { userId: id } });
      // Delete weekly logs
      await tx.weeklyLog.deleteMany({ where: { userId: id } });
      // Delete time entries
      await tx.timeEntry.deleteMany({ where: { userId: id } });
      // Delete notifications
      await tx.notification.deleteMany({ where: { userId: id } });
      // Delete conversation participants and messages
      await tx.message.deleteMany({ where: { senderId: id } });
      await tx.conversationParticipant.deleteMany({ where: { userId: id } });
      // Delete equipment assignments (as user)
      await tx.equipmentAssignment.deleteMany({ where: { userId: id } });
      // Delete equipment usage logs
      await tx.equipmentUsageLog.deleteMany({ where: { userId: id } });
      // Finally delete the user
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
