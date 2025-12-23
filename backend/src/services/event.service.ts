import { PrismaClient, Prisma } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/app-error';
import type { ListEventsQuery, CreateEventInput, UpdateEventInput } from '../schemas/event.schema';
import type { PaginatedResult } from './user.service';

const prisma = new PrismaClient();

const eventSelect = {
  id: true,
  name: true,
  description: true,
  clientRequirements: true,
  startDatetime: true,
  endDatetime: true,
  createdBy: true,
  createdAt: true,
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  assignees: {
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
} as const;

type EventWithRelations = Prisma.EventGetPayload<{ select: typeof eventSelect }>;

export const eventService = {
  async findAll(query: ListEventsQuery): Promise<PaginatedResult<EventWithRelations>> {
    const { page = 1, limit = 10, dateFrom, dateTo, assigneeId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {};

    if (dateFrom || dateTo) {
      where.startDatetime = {};
      if (dateFrom) where.startDatetime.gte = dateFrom;
      if (dateTo) where.startDatetime.lte = dateTo;
    }

    if (assigneeId) {
      where.assignees = {
        some: {
          userId: assigneeId,
        },
      };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        select: eventSelect,
        skip,
        take: limit,
        orderBy: { startDatetime: 'asc' },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      select: eventSelect,
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  },

  async findUpcoming() {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const events = await prisma.event.findMany({
      where: {
        startDatetime: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      select: eventSelect,
      orderBy: { startDatetime: 'asc' },
    });

    return events;
  },

  async create(input: CreateEventInput, creatorId: string) {
    const { assigneeIds, ...rest } = input;

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

    const event = await prisma.event.create({
      data: {
        ...rest,
        createdBy: creatorId,
        assignees: {
          create: assigneeIds.map((userId) => ({ userId })),
        },
      },
      select: eventSelect,
    });

    return event;
  },

  async update(id: string, input: UpdateEventInput) {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new NotFoundError('Event not found');
    }

    const { assigneeIds, ...rest } = input;

    // Validate date range if both dates provided or one is being updated
    if (rest.startDatetime || rest.endDatetime) {
      const startDatetime = rest.startDatetime || existingEvent.startDatetime;
      const endDatetime = rest.endDatetime || existingEvent.endDatetime;

      if (endDatetime <= startDatetime) {
        throw new ValidationError('End datetime must be after start datetime');
      }
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
      await prisma.eventAssignee.deleteMany({
        where: { eventId: id },
      });

      if (assigneeIds.length > 0) {
        await prisma.eventAssignee.createMany({
          data: assigneeIds.map((userId) => ({ eventId: id, userId })),
        });
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: rest,
      select: eventSelect,
    });

    return event;
  },

  async delete(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Use transaction to return equipment and delete event
    await prisma.$transaction(async (tx) => {
      // Find all active equipment assignments for this event
      const activeAssignments = await tx.equipmentAssignment.findMany({
        where: {
          eventId: id,
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

      // Delete the event (cascade will handle assignees)
      await tx.event.delete({
        where: { id },
      });
    });

    return { message: 'Event deleted successfully' };
  },
};
