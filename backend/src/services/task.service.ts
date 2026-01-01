import { PrismaClient, Prisma, TaskStatus } from '@prisma/client';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/app-error';
import type { ListTasksQuery, CreateTaskInput, UpdateTaskInput, UpdateStatusInput } from '../schemas/task.schema';
import type { PaginatedResult } from './user.service';

const prisma = new PrismaClient();

const taskSelect = {
  id: true,
  title: true,
  description: true,
  clientRequirements: true,
  status: true,
  priority: true,
  dueDate: true,
  executionDate: true,
  shift: true,
  morningStartTime: true,
  morningEndTime: true,
  afternoonStartTime: true,
  afternoonEndTime: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
    },
  },
  assignees: {
    select: {
      assignedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
    },
  },
} as const;

const taskWithCommentsSelect = {
  ...taskSelect,
  comments: {
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

type TaskWithRelations = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;

export const taskService = {
  async findAll(query: ListTasksQuery): Promise<PaginatedResult<TaskWithRelations>> {
    const { page = 1, limit = 10, status, priority, assigneeId, createdBy, dueDateFrom, dueDateTo } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (createdBy) where.createdBy = createdBy;

    if (assigneeId) {
      where.assignees = {
        some: {
          userId: assigneeId,
        },
      };
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) where.dueDate.gte = dueDateFrom;
      if (dueDateTo) where.dueDate.lte = dueDateTo;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        select: taskSelect,
        skip,
        take: limit,
        orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      select: taskWithCommentsSelect,
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return task;
  },

  async create(input: CreateTaskInput, creatorId: string) {
    const { assigneeIds, dueDate, executionDate, ...rest } = input;

    // Validate assignees exist
    if (assigneeIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true },
      });

      if (users.length !== assigneeIds.length) {
        throw new ValidationError('One or more assignees not found');
      }
    }

    const task = await prisma.task.create({
      data: {
        ...rest,
        dueDate,
        executionDate: executionDate ?? null,
        createdBy: creatorId,
        assignees: {
          create: assigneeIds.map((userId) => ({ userId })),
        },
      },
      select: taskSelect,
    });

    return task;
  },

  async update(id: string, input: UpdateTaskInput) {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    const { assigneeIds, dueDate, executionDate, ...rest } = input;

    // Build update data
    const updateData: Prisma.TaskUpdateInput = { ...rest };

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate;
    }

    if (executionDate !== undefined) {
      updateData.executionDate = executionDate;
    }

    // Handle assignees update
    if (assigneeIds !== undefined) {
      // Validate new assignees exist
      if (assigneeIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true },
        });

        if (users.length !== assigneeIds.length) {
          throw new ValidationError('One or more assignees not found');
        }
      }

      // Delete existing and create new
      await prisma.taskAssignee.deleteMany({
        where: { taskId: id },
      });

      if (assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: assigneeIds.map((userId) => ({ taskId: id, userId })),
        });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      select: taskSelect,
    });

    return task;
  },

  async updateStatus(
    id: string,
    input: UpdateStatusInput,
    userId: string,
    userRole: string
  ) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: {
          select: { userId: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const { status: newStatus } = input;
    const currentStatus = task.status;
    const isAdminOrSupervisor = userRole === 'admin' || userRole === 'supervisor';
    const isAssignee = task.assignees.some((a) => a.userId === userId);

    // Validate status transition
    if (!isAdminOrSupervisor) {
      // Becarios can only change status of tasks they are assigned to
      if (!isAssignee) {
        throw new ForbiddenError('You can only change status of tasks assigned to you');
      }

      // Becarios can: pending → in_progress → review
      const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
        [TaskStatus.pending]: [TaskStatus.in_progress],
        [TaskStatus.in_progress]: [TaskStatus.review],
        [TaskStatus.review]: [], // Becarios cannot change from review
        [TaskStatus.completed]: [], // Becarios cannot change from completed
      };

      if (!allowedTransitions[currentStatus].includes(newStatus)) {
        throw new ForbiddenError(
          `You cannot change status from '${currentStatus}' to '${newStatus}'`
        );
      }
    } else {
      // Admin/supervisor can do any transition
      // But let's still validate logical transitions
      const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
        [TaskStatus.pending]: [TaskStatus.in_progress, TaskStatus.review, TaskStatus.completed],
        [TaskStatus.in_progress]: [TaskStatus.pending, TaskStatus.review, TaskStatus.completed],
        [TaskStatus.review]: [TaskStatus.pending, TaskStatus.in_progress, TaskStatus.completed],
        [TaskStatus.completed]: [TaskStatus.pending, TaskStatus.in_progress, TaskStatus.review],
      };

      if (!allowedTransitions[currentStatus].includes(newStatus) && currentStatus !== newStatus) {
        throw new ValidationError(
          `Invalid status transition from '${currentStatus}' to '${newStatus}'`
        );
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: newStatus },
      select: taskSelect,
    });

    return updatedTask;
  },

  async delete(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Use transaction to return equipment and delete task
    await prisma.$transaction(async (tx) => {
      // Find all active equipment assignments for this task (by notes pattern)
      const taskNotePrefix = `Tarea: ${task.title}`;
      const activeAssignments = await tx.equipmentAssignment.findMany({
        where: {
          notes: { startsWith: taskNotePrefix },
          endTime: null,
        },
        select: {
          id: true,
          equipmentId: true,
        },
      });

      // Return each equipment (set endTime and status to available)
      if (activeAssignments.length > 0) {
        const now = new Date();

        // Update all assignments to mark as returned
        await tx.equipmentAssignment.updateMany({
          where: {
            id: { in: activeAssignments.map((a) => a.id) },
          },
          data: {
            endTime: now,
          },
        });

        // Update all equipment to available
        await tx.equipment.updateMany({
          where: {
            id: { in: activeAssignments.map((a) => a.equipmentId) },
          },
          data: {
            status: 'available',
          },
        });
      }

      // Delete the task (cascade will handle assignees and comments)
      await tx.task.delete({
        where: { id },
      });
    });

    return { message: 'Task deleted successfully' };
  },
};
