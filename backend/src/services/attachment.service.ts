import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import { NotFoundError, ForbiddenError } from '../utils/app-error';

const prisma = new PrismaClient();

const attachmentSelect = {
  id: true,
  filename: true,
  storedName: true,
  mimeType: true,
  size: true,
  taskId: true,
  eventId: true,
  uploadedBy: true,
  createdAt: true,
  uploader: {
    select: {
      id: true,
      name: true,
    },
  },
};

export interface CreateAttachmentInput {
  filename: string;
  storedName: string;
  mimeType: string;
  size: number;
  taskId?: string;
  eventId?: string;
}

export const attachmentService = {
  async create(input: CreateAttachmentInput, uploadedBy: string) {
    const attachment = await prisma.attachment.create({
      data: {
        ...input,
        uploadedBy,
      },
      select: attachmentSelect,
    });

    return attachment;
  },

  async createMany(files: Express.Multer.File[], options: { taskId?: string; eventId?: string }, uploadedBy: string) {
    const attachments = await Promise.all(
      files.map((file) =>
        prisma.attachment.create({
          data: {
            filename: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            taskId: options.taskId,
            eventId: options.eventId,
            uploadedBy,
          },
          select: attachmentSelect,
        })
      )
    );

    return attachments;
  },

  async findById(id: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      select: attachmentSelect,
    });

    return attachment;
  },

  async findByTask(taskId: string) {
    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      select: attachmentSelect,
      orderBy: { createdAt: 'desc' },
    });

    return attachments;
  },

  async findByEvent(eventId: string) {
    const attachments = await prisma.attachment.findMany({
      where: { eventId },
      select: attachmentSelect,
      orderBy: { createdAt: 'desc' },
    });

    return attachments;
  },

  async delete(id: string, userId: string, userRole: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    // Only uploader or admin can delete
    if (attachment.uploadedBy !== userId && userRole !== 'admin') {
      throw new ForbiddenError('You can only delete your own attachments');
    }

    // Delete file from disk
    const filePath = this.getFilePath(attachment.storedName);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file from disk:', error);
      // Continue even if file doesn't exist on disk
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id },
    });

    return { message: 'Attachment deleted successfully' };
  },

  getFilePath(storedName: string): string {
    return path.join(__dirname, '../../uploads/attachments', storedName);
  },
};
