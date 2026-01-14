import { PrismaClient, Prisma, TaskStatus } from '@prisma/client';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/app-error';
import type { ListTasksQuery, CreateTaskInput, UpdateTaskInput, UpdateStatusInput } from '../schemas/task.schema';
import type { PaginatedResult } from './user.service';
import { notificationService } from './notification.service';

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
  checklistItems: {
    select: {
      id: true,
      content: true,
      isCompleted: true,
      order: true,
    },
    orderBy: { order: 'asc' as const },
  },
  attachments: {
    select: {
      id: true,
      filename: true,
      storedName: true,
      mimeType: true,
      size: true,
      uploadedBy: true,
      createdAt: true,
      uploader: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

type TaskWithRelations = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;

export const taskService = {
  async findAll(query: ListTasksQuery, userId: string, userRole: string): Promise<PaginatedResult<TaskWithRelations>> {
    const { page = 1, limit = 10, status, priority, assigneeId, createdBy, dueDateFrom, dueDateTo } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (createdBy) where.createdBy = createdBy;

    // Becarios only see tasks assigned to them
    // Admin and supervisor see all tasks
    if (userRole === 'becario') {
      where.assignees = {
        some: {
          userId: userId,
        },
      };
    } else if (assigneeId) {
      // Admin/supervisor can filter by assignee if they want
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

    // Notify assignees (exclude creator if they're also assigned)
    const assigneesToNotify = assigneeIds.filter((id) => id !== creatorId);
    if (assigneesToNotify.length > 0) {
      await notificationService.createForMany(assigneesToNotify, {
        type: 'task_assigned',
        title: 'Nueva tarea asignada',
        message: `Se te asignó la tarea "${task.title}"`,
        link: `/tasks?open=${task.id}`,
        metadata: { taskId: task.id },
      });
    }

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
    const existingAssigneeIds = existingTask.assignees.map((a) => a.userId);
    let newAssigneeIds: string[] = [];

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

      // Find new assignees (not in existing)
      newAssigneeIds = assigneeIds.filter((id) => !existingAssigneeIds.includes(id));

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

    // Notify new assignees
    if (newAssigneeIds.length > 0) {
      await notificationService.createForMany(newAssigneeIds, {
        type: 'task_assigned',
        title: 'Nueva tarea asignada',
        message: `Se te asignó la tarea "${task.title}"`,
        link: `/tasks?open=${task.id}`,
        metadata: { taskId: task.id },
      });
    }

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

    // Notify admins/supervisors when task is sent to review
    if (newStatus === TaskStatus.review && currentStatus !== TaskStatus.review) {
      const reviewers = await prisma.user.findMany({
        where: {
          role: { in: ['admin', 'supervisor'] },
          isActive: true,
          id: { not: userId }, // Don't notify the person who changed the status
        },
        select: { id: true },
      });

      if (reviewers.length > 0) {
        await notificationService.createForMany(
          reviewers.map((r) => r.id),
          {
            type: 'task_review',
            title: 'Tarea lista para revisión',
            message: `La tarea "${updatedTask.title}" está lista para revisar`,
            link: `/tasks?open=${updatedTask.id}`,
            metadata: { taskId: updatedTask.id },
          }
        );
      }
    }

    return updatedTask;
  },

  async removeAssignee(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const isAssigned = task.assignees.some((a) => a.userId === userId);
    if (!isAssigned) {
      throw new ValidationError('User is not assigned to this task');
    }

    // Remove assignee
    await prisma.taskAssignee.delete({
      where: {
        taskId_userId: { taskId, userId },
      },
    });

    // Return equipment assigned to this user for this task
    const taskNotePrefix = `Tarea: ${task.title}`;
    const now = new Date();
    const releaseTime = new Date(now.getTime() - 1000); // 1 second ago to avoid conflicts

    await prisma.$transaction(async (tx) => {
      const assignments = await tx.equipmentAssignment.findMany({
        where: {
          userId,
          notes: { startsWith: taskNotePrefix },
          startTime: { lte: now },
          OR: [
            { endTime: null },
            { endTime: { gt: now } },
          ],
        },
      });

      if (assignments.length > 0) {
        await tx.equipmentAssignment.updateMany({
          where: { id: { in: assignments.map((a) => a.id) } },
          data: { endTime: releaseTime },
        });
        await tx.equipment.updateMany({
          where: { id: { in: assignments.map((a) => a.equipmentId) } },
          data: { status: 'available' },
        });
      }
    });

    return prisma.task.findUnique({
      where: { id: taskId },
      select: taskSelect,
    });
  },

  async replaceAssignee(taskId: string, oldUserId: string, newUserId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const isOldUserAssigned = task.assignees.some((a) => a.userId === oldUserId);
    if (!isOldUserAssigned) {
      throw new ValidationError('Original user is not assigned to this task');
    }

    const isNewUserAssigned = task.assignees.some((a) => a.userId === newUserId);
    if (isNewUserAssigned) {
      throw new ValidationError('New user is already assigned to this task');
    }

    // Verify new user exists
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
      select: { id: true, name: true },
    });

    if (!newUser) {
      throw new NotFoundError('New user not found');
    }

    const taskNotePrefix = `Tarea: ${task.title}`;

    await prisma.$transaction(async (tx) => {
      // Remove old assignee and add new one
      await tx.taskAssignee.delete({
        where: { taskId_userId: { taskId, userId: oldUserId } },
      });

      await tx.taskAssignee.create({
        data: { taskId, userId: newUserId },
      });

      // Transfer equipment assignments from old user to new user
      await tx.equipmentAssignment.updateMany({
        where: {
          userId: oldUserId,
          notes: { startsWith: taskNotePrefix },
          endTime: null,
        },
        data: { userId: newUserId },
      });
    });

    // Notify new assignee
    await notificationService.create(newUserId, {
      type: 'task_assigned',
      title: 'Nueva tarea asignada',
      message: `Se te asignó la tarea "${task.title}"`,
      link: `/tasks?open=${task.id}`,
      metadata: { taskId: task.id },
    });

    return prisma.task.findUnique({
      where: { id: taskId },
      select: taskSelect,
    });
  },

  async delete(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Use transaction to return equipment and delete task
    const now = new Date();
    const releaseTime = new Date(now.getTime() - 1000); // 1 second ago

    await prisma.$transaction(async (tx) => {
      // Find all active equipment assignments for this task (by notes pattern)
      const taskNotePrefix = `Tarea: ${task.title}`;
      const activeAssignments = await tx.equipmentAssignment.findMany({
        where: {
          notes: { startsWith: taskNotePrefix },
          startTime: { lte: now },
          OR: [
            { endTime: null },
            { endTime: { gt: now } },
          ],
        },
        select: {
          id: true,
          equipmentId: true,
        },
      });

      // Return each equipment (set endTime and status to available)
      if (activeAssignments.length > 0) {
        // Update all assignments to mark as returned
        await tx.equipmentAssignment.updateMany({
          where: {
            id: { in: activeAssignments.map((a) => a.id) },
          },
          data: {
            endTime: releaseTime,
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

  async releaseEquipment(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const taskNotePrefix = `Tarea: ${task.title}`;
    const now = new Date();

    // Find all equipment assignments for this user and task that are not yet ended
    // This includes active assignments AND future assignments
    const assignments = await prisma.equipmentAssignment.findMany({
      where: {
        userId,
        notes: { startsWith: taskNotePrefix },
        OR: [
          { endTime: null },
          { endTime: { gt: now } },
        ],
      },
    });

    if (assignments.length === 0) {
      throw new ValidationError('El usuario no tiene equipo asignado para esta tarea');
    }

    // Release equipment - set endTime to 1 second ago to avoid overlap conflicts
    const releaseTime = new Date(now.getTime() - 1000);
    await prisma.$transaction(async (tx) => {
      await tx.equipmentAssignment.updateMany({
        where: { id: { in: assignments.map((a) => a.id) } },
        data: { endTime: releaseTime },
      });

      await tx.equipment.updateMany({
        where: { id: { in: assignments.map((a) => a.equipmentId) } },
        data: { status: 'available' },
      });
    });

    return prisma.task.findUnique({
      where: { id: taskId },
      select: taskSelect,
    });
  },

  async transferEquipment(taskId: string, fromUserId: string, toUserId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify target user exists
    const toUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, name: true },
    });

    if (!toUser) {
      throw new NotFoundError('Target user not found');
    }

    const taskNotePrefix = `Tarea: ${task.title}`;
    const now = new Date();

    // Find all equipment assignments for source user and task that are not yet ended
    // This includes active assignments AND future assignments
    const assignments = await prisma.equipmentAssignment.findMany({
      where: {
        userId: fromUserId,
        notes: { startsWith: taskNotePrefix },
        OR: [
          { endTime: null },
          { endTime: { gt: now } },
        ],
      },
    });

    if (assignments.length === 0) {
      throw new ValidationError('El usuario origen no tiene equipo asignado para esta tarea');
    }

    // Transfer equipment to new user
    await prisma.equipmentAssignment.updateMany({
      where: { id: { in: assignments.map((a) => a.id) } },
      data: { userId: toUserId },
    });

    // Notify new user
    await notificationService.create(toUserId, {
      type: 'task_assigned',
      title: 'Equipo transferido',
      message: `Se te transfirió equipo de la tarea "${task.title}"`,
      link: `/tasks?open=${task.id}`,
      metadata: { taskId: task.id },
    });

    return prisma.task.findUnique({
      where: { id: taskId },
      select: taskSelect,
    });
  },
};
