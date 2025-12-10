import { z } from 'zod';

function isMonday(date: Date): boolean {
  return date.getDay() === 1;
}

function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

function isValidWeekRange(weekStart: Date, weekEnd: Date): boolean {
  const expectedEnd = new Date(weekStart);
  expectedEnd.setDate(expectedEnd.getDate() + 6);
  return (
    weekEnd.getFullYear() === expectedEnd.getFullYear() &&
    weekEnd.getMonth() === expectedEnd.getMonth() &&
    weekEnd.getDate() === expectedEnd.getDate()
  );
}

export const listWeeklyLogsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().int().positive()),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(z.number().int().min(1).max(100)),
    userId: z.string().uuid().optional(),
    weekStart: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined))
      .pipe(z.date().optional()),
  }),
});

export const getWeeklyLogSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid weekly log ID'),
  }),
});

export const summarySchema = z.object({
  query: z.object({
    weekStart: z
      .string({ required_error: 'weekStart is required' })
      .transform((val) => new Date(val))
      .pipe(z.date({ invalid_type_error: 'Invalid date format' })),
  }),
});

export const createWeeklyLogSchema = z.object({
  body: z
    .object({
      weekStart: z
        .string({ required_error: 'Week start is required' })
        .transform((val) => {
          // Parse YYYY-MM-DD format explicitly to avoid timezone issues
          const [year, month, day] = val.split('-').map(Number);
          const date = new Date(year, month - 1, day, 0, 0, 0, 0);
          return date;
        })
        .pipe(z.date({ invalid_type_error: 'Invalid week start date' })),
      weekEnd: z
        .string({ required_error: 'Week end is required' })
        .transform((val) => {
          // Parse YYYY-MM-DD format explicitly to avoid timezone issues
          const [year, month, day] = val.split('-').map(Number);
          const date = new Date(year, month - 1, day, 23, 59, 59, 999);
          return date;
        })
        .pipe(z.date({ invalid_type_error: 'Invalid week end date' })),
      activities: z
        .string({ required_error: 'Activities is required' })
        .min(1, 'Activities is required'),
      achievements: z.string().optional().nullable(),
      challenges: z.string().optional().nullable(),
      learnings: z.string().optional().nullable(),
      nextGoals: z.string().optional().nullable(),
    })
    .refine((data) => isMonday(data.weekStart), {
      message: 'Week start must be a Monday',
      path: ['weekStart'],
    })
    .refine((data) => isSunday(data.weekEnd), {
      message: 'Week end must be a Sunday',
      path: ['weekEnd'],
    })
    .refine((data) => isValidWeekRange(data.weekStart, data.weekEnd), {
      message: 'Week end must be the Sunday following week start',
      path: ['weekEnd'],
    }),
});

export const updateWeeklyLogSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid weekly log ID'),
  }),
  body: z.object({
    activities: z.string().min(1, 'Activities cannot be empty').optional(),
    achievements: z.string().optional().nullable(),
    challenges: z.string().optional().nullable(),
    learnings: z.string().optional().nullable(),
    nextGoals: z.string().optional().nullable(),
  }),
});

export type ListWeeklyLogsQuery = z.infer<typeof listWeeklyLogsSchema>['query'];
export type SummaryQuery = z.infer<typeof summarySchema>['query'];
export type CreateWeeklyLogInput = z.infer<typeof createWeeklyLogSchema>['body'];
export type UpdateWeeklyLogInput = z.infer<typeof updateWeeklyLogSchema>['body'];
