import { PrismaClient, Prisma } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/app-error';
import type { ListTimeEntriesQuery, ClockInInput, RfidInput, SummaryQuery } from '../schemas/time-entry.schema';
import type { PaginatedResult } from './user.service';

const prisma = new PrismaClient();

const timeEntrySelect = {
  id: true,
  userId: true,
  eventId: true,
  clockIn: true,
  clockOut: true,
  totalHours: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  event: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

type TimeEntryWithRelations = Prisma.TimeEntryGetPayload<{ select: typeof timeEntrySelect }>;

function getStartOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function calculateHours(clockIn: Date, clockOut: Date): number {
  const diffMs = clockOut.getTime() - clockIn.getTime();
  const hours = diffMs / 3600000;
  return Math.round(hours * 100) / 100; // Round to 2 decimal places
}

export const timeEntryService = {
  async findAll(
    query: ListTimeEntriesQuery,
    requestUserId: string,
    isAdminOrSupervisor: boolean
  ): Promise<PaginatedResult<TimeEntryWithRelations>> {
    const { page = 1, limit = 10, userId, eventId, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TimeEntryWhereInput = {};

    // If not admin/supervisor and no userId filter, show only own entries
    if (!isAdminOrSupervisor) {
      where.userId = requestUserId;
    } else if (userId) {
      where.userId = userId;
    }

    if (eventId) where.eventId = eventId;

    if (dateFrom || dateTo) {
      where.clockIn = {};
      if (dateFrom) where.clockIn.gte = dateFrom;
      if (dateTo) where.clockIn.lte = getEndOfDay(dateTo);
    }

    const [entries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        select: timeEntrySelect,
        skip,
        take: limit,
        orderBy: { clockIn: 'desc' },
      }),
      prisma.timeEntry.count({ where }),
    ]);

    return {
      data: entries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    const entry = await prisma.timeEntry.findUnique({
      where: { id },
      select: timeEntrySelect,
    });

    if (!entry) {
      throw new NotFoundError('Time entry not found');
    }

    return entry;
  },

  async getActiveSession(userId: string) {
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        clockOut: null,
      },
      select: timeEntrySelect,
      orderBy: { clockIn: 'desc' },
    });

    return activeEntry;
  },

  async clockIn(userId: string, input: ClockInInput) {
    // Check if user already has an active session
    const activeSession = await this.getActiveSession(userId);

    if (activeSession) {
      throw new ValidationError('You already have an active session. Please clock out first.');
    }

    // Validate eventId if provided
    if (input.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: input.eventId },
      });

      if (!event) {
        throw new ValidationError('Event not found');
      }
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        eventId: input.eventId || null,
        clockIn: new Date(),
      },
      select: timeEntrySelect,
    });

    return entry;
  },

  async clockOut(userId: string) {
    const activeSession = await this.getActiveSession(userId);

    if (!activeSession) {
      throw new ValidationError('No active session found. Please clock in first.');
    }

    const clockOut = new Date();
    const totalHours = calculateHours(activeSession.clockIn, clockOut);

    const entry = await prisma.timeEntry.update({
      where: { id: activeSession.id },
      data: {
        clockOut,
        totalHours,
      },
      select: timeEntrySelect,
    });

    return entry;
  },

  async rfidToggle(input: RfidInput) {
    const { rfidTag, eventId } = input;

    // Find user by RFID tag
    const user = await prisma.user.findUnique({
      where: { rfidTag },
      select: { id: true, name: true, email: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundError('User not found with this RFID tag');
    }

    if (!user.isActive) {
      throw new ValidationError('User account is deactivated');
    }

    // Check for active session
    const activeSession = await this.getActiveSession(user.id);

    if (activeSession) {
      // Clock out
      const clockOut = new Date();
      const totalHours = calculateHours(activeSession.clockIn, clockOut);

      const entry = await prisma.timeEntry.update({
        where: { id: activeSession.id },
        data: {
          clockOut,
          totalHours,
        },
        select: timeEntrySelect,
      });

      return {
        action: 'clock_out' as const,
        entry,
        totalHours,
        user: { id: user.id, name: user.name, email: user.email },
      };
    } else {
      // Clock in
      if (eventId) {
        const event = await prisma.event.findUnique({
          where: { id: eventId },
        });

        if (!event) {
          throw new ValidationError('Event not found');
        }
      }

      const entry = await prisma.timeEntry.create({
        data: {
          userId: user.id,
          eventId: eventId || null,
          clockIn: new Date(),
        },
        select: timeEntrySelect,
      });

      return {
        action: 'clock_in' as const,
        entry,
        totalHours: null,
        user: { id: user.id, name: user.name, email: user.email },
      };
    }
  },

  async getSummary(query: SummaryQuery, requestUserId: string, isAdminOrSupervisor: boolean) {
    const { period = 'daily', userId } = query;
    const now = new Date();

    let dateFrom: Date;
    let dateTo: Date;

    switch (period) {
      case 'daily':
        dateFrom = getStartOfDay(now);
        dateTo = getEndOfDay(now);
        break;
      case 'weekly':
        dateFrom = getStartOfWeek(now);
        dateTo = getEndOfWeek(now);
        break;
      case 'monthly':
        dateFrom = getStartOfMonth(now);
        dateTo = getEndOfMonth(now);
        break;
    }

    const where: Prisma.TimeEntryWhereInput = {
      clockIn: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    // Determine which user's summary to show
    if (!isAdminOrSupervisor) {
      where.userId = requestUserId;
    } else if (userId) {
      where.userId = userId;
    } else {
      where.userId = requestUserId;
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      select: timeEntrySelect,
      orderBy: { clockIn: 'desc' },
    });

    // Calculate totals
    let totalHours = 0;
    const completedSessions = entries.filter((e) => e.clockOut !== null);

    for (const entry of completedSessions) {
      if (entry.totalHours) {
        totalHours += Number(entry.totalHours);
      }
    }

    // Round to 2 decimal places
    totalHours = Math.round(totalHours * 100) / 100;

    return {
      period,
      dateFrom,
      dateTo,
      totalHours,
      totalSessions: entries.length,
      completedSessions: completedSessions.length,
      activeSessions: entries.length - completedSessions.length,
      entries,
    };
  },
};
