import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChecklistItemInput {
  content: string;
  order?: number;
}

export interface UpdateChecklistItemInput {
  content?: string;
  isCompleted?: boolean;
}

export const checklistService = {
  async addItem(taskId: string, input: ChecklistItemInput) {
    // Get the max order for this task
    const maxOrder = await prisma.taskChecklistItem.aggregate({
      where: { taskId },
      _max: { order: true },
    });

    const order = input.order ?? (maxOrder._max.order ?? -1) + 1;

    const item = await prisma.taskChecklistItem.create({
      data: {
        taskId,
        content: input.content,
        order,
      },
      select: {
        id: true,
        taskId: true,
        content: true,
        isCompleted: true,
        order: true,
      },
    });

    return item;
  },

  async updateItem(itemId: string, input: UpdateChecklistItemInput) {
    const item = await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: {
        ...(input.content !== undefined && { content: input.content }),
        ...(input.isCompleted !== undefined && { isCompleted: input.isCompleted }),
      },
      select: {
        id: true,
        taskId: true,
        content: true,
        isCompleted: true,
        order: true,
      },
    });

    return item;
  },

  async deleteItem(itemId: string) {
    await prisma.taskChecklistItem.delete({
      where: { id: itemId },
    });
  },

  async reorderItems(taskId: string, itemIds: string[]) {
    // Update each item with its new order
    const updates = itemIds.map((id, index) =>
      prisma.taskChecklistItem.update({
        where: { id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);

    // Return updated items
    const items = await prisma.taskChecklistItem.findMany({
      where: { taskId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        taskId: true,
        content: true,
        isCompleted: true,
        order: true,
      },
    });

    return items;
  },

  async getItemsByTaskId(taskId: string) {
    const items = await prisma.taskChecklistItem.findMany({
      where: { taskId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        taskId: true,
        content: true,
        isCompleted: true,
        order: true,
      },
    });

    return items;
  },

  async getItemById(itemId: string) {
    return prisma.taskChecklistItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        taskId: true,
        content: true,
        isCompleted: true,
        order: true,
      },
    });
  },
};
