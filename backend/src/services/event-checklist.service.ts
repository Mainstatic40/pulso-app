import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EventChecklistItemInput {
  content: string;
  order?: number;
}

export interface UpdateEventChecklistItemInput {
  content?: string;
  isCompleted?: boolean;
}

export const eventChecklistService = {
  async addItem(eventId: string, input: EventChecklistItemInput) {
    // Get the max order for this event
    const maxOrder = await prisma.eventChecklistItem.aggregate({
      where: { eventId },
      _max: { order: true },
    });

    const order = input.order ?? (maxOrder._max.order ?? -1) + 1;

    const item = await prisma.eventChecklistItem.create({
      data: {
        eventId,
        content: input.content,
        order,
      },
      select: {
        id: true,
        eventId: true,
        content: true,
        isCompleted: true,
        order: true,
      },
    });

    return item;
  },

  async updateItem(itemId: string, input: UpdateEventChecklistItemInput) {
    const item = await prisma.eventChecklistItem.update({
      where: { id: itemId },
      data: {
        ...(input.content !== undefined && { content: input.content }),
        ...(input.isCompleted !== undefined && { isCompleted: input.isCompleted }),
      },
      select: {
        id: true,
        eventId: true,
        content: true,
        isCompleted: true,
        order: true,
      },
    });

    return item;
  },

  async deleteItem(itemId: string) {
    await prisma.eventChecklistItem.delete({
      where: { id: itemId },
    });
  },

  async reorderItems(eventId: string, itemIds: string[]) {
    // Update each item with its new order
    const updates = itemIds.map((id, index) =>
      prisma.eventChecklistItem.update({
        where: { id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);

    // Return updated items
    const items = await prisma.eventChecklistItem.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        eventId: true,
        content: true,
        isCompleted: true,
        order: true,
      },
    });

    return items;
  },

  async getItemsByEventId(eventId: string) {
    const items = await prisma.eventChecklistItem.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        eventId: true,
        content: true,
        isCompleted: true,
        order: true,
      },
    });

    return items;
  },

  async getItemById(itemId: string) {
    return prisma.eventChecklistItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        eventId: true,
        content: true,
        isCompleted: true,
        order: true,
      },
    });
  },
};
