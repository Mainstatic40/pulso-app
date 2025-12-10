import { PrismaClient, Prisma, TaskStatus } from '@prisma/client';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/app-error';
import type {
  ListWeeklyLogsQuery,
  SummaryQuery,
  CreateWeeklyLogInput,
  UpdateWeeklyLogInput,
} from '../schemas/weekly-log.schema';
import type { PaginatedResult } from './user.service';

const prisma = new PrismaClient();

const weeklyLogSelect = {
  id: true,
  userId: true,
  weekStart: true,
  weekEnd: true,
  activities: true,
  achievements: true,
  challenges: true,
  learnings: true,
  nextGoals: true,
  totalHours: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

type WeeklyLogWithRelations = Prisma.WeeklyLogGetPayload<{ select: typeof weeklyLogSelect }>;

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

async function calculateTotalHours(userId: string, weekStart: Date, weekEnd: Date): Promise<number> {
  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      clockIn: {
        gte: weekStart,
        lte: weekEnd,
      },
      clockOut: { not: null },
    },
    select: { totalHours: true },
  });

  let total = 0;
  for (const entry of entries) {
    if (entry.totalHours) {
      total += Number(entry.totalHours);
    }
  }

  return Math.round(total * 100) / 100;
}

export const weeklyLogService = {
  async findAll(
    query: ListWeeklyLogsQuery,
    requestUserId: string,
    isAdminOrSupervisor: boolean
  ): Promise<PaginatedResult<WeeklyLogWithRelations>> {
    const { page = 1, limit = 10, userId, weekStart } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WeeklyLogWhereInput = {};

    // Becarios can only see their own logs
    if (!isAdminOrSupervisor) {
      where.userId = requestUserId;
    } else if (userId) {
      where.userId = userId;
    }

    if (weekStart) {
      where.weekStart = weekStart;
    }

    const [logs, total] = await Promise.all([
      prisma.weeklyLog.findMany({
        where,
        select: weeklyLogSelect,
        skip,
        take: limit,
        orderBy: { weekStart: 'desc' },
      }),
      prisma.weeklyLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string, requestUserId: string, isAdminOrSupervisor: boolean) {
    const log = await prisma.weeklyLog.findUnique({
      where: { id },
      select: weeklyLogSelect,
    });

    if (!log) {
      throw new NotFoundError('Weekly log not found');
    }

    // Becarios can only view their own logs
    if (!isAdminOrSupervisor && log.userId !== requestUserId) {
      throw new ForbiddenError('You can only view your own weekly logs');
    }

    return log;
  },

  async getCurrentWeek(userId: string) {
    const now = new Date();
    const weekStart = getStartOfWeek(now);
    const weekEnd = getEndOfWeek(now);

    // Check if log already exists
    const existingLog = await prisma.weeklyLog.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
      select: weeklyLogSelect,
    });

    if (existingLog) {
      return {
        exists: true,
        log: existingLog,
      };
    }

    // Return template for new log
    return {
      exists: false,
      log: {
        userId,
        weekStart,
        weekEnd,
        activities: '',
        achievements: null,
        challenges: null,
        learnings: null,
        nextGoals: null,
        totalHours: await calculateTotalHours(userId, weekStart, weekEnd),
      },
    };
  },

  async getSummary(query: SummaryQuery, userId: string) {
    const { weekStart } = query;

    // Normalize weekStart to start of day
    const normalizedWeekStart = new Date(weekStart);
    normalizedWeekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(normalizedWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get total hours from time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        clockIn: {
          gte: normalizedWeekStart,
          lte: weekEnd,
        },
        clockOut: { not: null },
      },
      select: { totalHours: true },
    });

    let totalHours = 0;
    for (const entry of timeEntries) {
      if (entry.totalHours) {
        totalHours += Number(entry.totalHours);
      }
    }
    totalHours = Math.round(totalHours * 100) / 100;

    // Get completed tasks where user is assignee
    const completedTasks = await prisma.task.findMany({
      where: {
        status: TaskStatus.completed,
        updatedAt: {
          gte: normalizedWeekStart,
          lte: weekEnd,
        },
        assignees: {
          some: { userId },
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    });

    // Get total sessions
    const totalSessions = await prisma.timeEntry.count({
      where: {
        userId,
        clockIn: {
          gte: normalizedWeekStart,
          lte: weekEnd,
        },
      },
    });

    return {
      weekStart: normalizedWeekStart,
      weekEnd,
      totalHours,
      totalSessions,
      completedTasks,
      completedTasksCount: completedTasks.length,
    };
  },

  async create(input: CreateWeeklyLogInput, userId: string) {
    const { weekStart, weekEnd, ...rest } = input;

    // Check if log already exists for this week
    const existingLog = await prisma.weeklyLog.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });

    if (existingLog) {
      throw new ValidationError('A weekly log already exists for this week');
    }

    // Calculate total hours from time entries
    const totalHours = await calculateTotalHours(userId, weekStart, weekEnd);

    const log = await prisma.weeklyLog.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        totalHours,
        ...rest,
      },
      select: weeklyLogSelect,
    });

    return log;
  },

  async update(id: string, input: UpdateWeeklyLogInput, userId: string) {
    const log = await prisma.weeklyLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundError('Weekly log not found');
    }

    // Only author can update
    if (log.userId !== userId) {
      throw new ForbiddenError('You can only edit your own weekly logs');
    }

    // Recalculate total hours
    const totalHours = await calculateTotalHours(userId, log.weekStart, log.weekEnd);

    const updatedLog = await prisma.weeklyLog.update({
      where: { id },
      data: {
        ...input,
        totalHours,
      },
      select: weeklyLogSelect,
    });

    return updatedLog;
  },
};
