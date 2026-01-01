import { PrismaClient } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/app-error';
import type { CreateCommentInput, UpdateCommentInput } from '../schemas/comment.schema';

const prisma = new PrismaClient();

const commentSelect = {
  id: true,
  taskId: true,
  userId: true,
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
} as const;

export const commentService = {
  async findByTaskId(taskId: string) {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      select: commentSelect,
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  },

  async create(taskId: string, input: CreateCommentInput, userId: string) {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId,
        content: input.content,
      },
      select: commentSelect,
    });

    return comment;
  },

  async update(id: string, input: UpdateCommentInput, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Only author can edit
    if (comment.userId !== userId) {
      throw new ForbiddenError('You can only edit your own comments');
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content: input.content },
      select: commentSelect,
    });

    return updatedComment;
  },

  async delete(id: string, userId: string, userRole: string) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Only author or admin can delete
    const isAdmin = userRole === 'admin';
    const isAuthor = comment.userId === userId;

    if (!isAdmin && !isAuthor) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    await prisma.comment.delete({
      where: { id },
    });

    return { message: 'Comment deleted successfully' };
  },
};
