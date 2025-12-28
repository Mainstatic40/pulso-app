import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

// Regex for HH:mm time format validation
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Shift values
const shiftValues = ['morning', 'afternoon', 'both'] as const;
export type TaskShift = (typeof shiftValues)[number];

/**
 * Parse a date string safely, avoiding timezone issues.
 * For date-only strings (YYYY-MM-DD), adds T12:00:00 to prevent
 * UTC conversion from shifting the day.
 */
function parseDateSafe(val: string): Date {
  // If it's a date-only string (no time component), add noon time to avoid timezone shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return new Date(val + 'T12:00:00');
  }
  return new Date(val);
}

export const listTasksSchema = z.object({
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
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assigneeId: z.string().uuid().optional(),
    createdBy: z.string().uuid().optional(),
    dueDateFrom: z
      .string()
      .optional()
      .transform((val) => (val ? parseDateSafe(val) : undefined))
      .pipe(z.date().optional()),
    dueDateTo: z
      .string()
      .optional()
      .transform((val) => (val ? parseDateSafe(val) : undefined))
      .pipe(z.date().optional()),
  }),
});

export const getTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(1, 'Title is required')
      .max(200, 'Title must be at most 200 characters'),
    description: z.string().optional().default(''),
    clientRequirements: z.string().optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.pending),
    priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.medium),
    dueDate: z
      .string({ required_error: 'Due date is required' })
      .transform((val) => parseDateSafe(val))
      .pipe(z.date({ invalid_type_error: 'Invalid date format' })),
    executionDate: z
      .string()
      .transform((val) => parseDateSafe(val))
      .pipe(z.date({ invalid_type_error: 'Invalid date format' }))
      .optional()
      .nullable(),
    shift: z.enum(shiftValues, {
      errorMap: () => ({ message: 'Shift must be morning, afternoon, or both' }),
    }).optional().nullable(),
    morningStartTime: z
      .string()
      .regex(timeFormatRegex, 'Invalid time format. Use HH:mm')
      .optional()
      .nullable(),
    morningEndTime: z
      .string()
      .regex(timeFormatRegex, 'Invalid time format. Use HH:mm')
      .optional()
      .nullable(),
    afternoonStartTime: z
      .string()
      .regex(timeFormatRegex, 'Invalid time format. Use HH:mm')
      .optional()
      .nullable(),
    afternoonEndTime: z
      .string()
      .regex(timeFormatRegex, 'Invalid time format. Use HH:mm')
      .optional()
      .nullable(),
    assigneeIds: z
      .array(z.string().uuid('Invalid assignee ID'))
      .optional()
      .default([]),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title must be at most 200 characters')
      .optional(),
    description: z.string().optional(),
    clientRequirements: z.string().optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z
      .string()
      .transform((val) => parseDateSafe(val))
      .pipe(z.date({ invalid_type_error: 'Invalid date format' }))
      .optional(),
    executionDate: z
      .string()
      .transform((val) => parseDateSafe(val))
      .pipe(z.date({ invalid_type_error: 'Invalid date format' }))
      .optional()
      .nullable(),
    shift: z.enum(shiftValues, {
      errorMap: () => ({ message: 'Shift must be morning, afternoon, or both' }),
    }).optional().nullable(),
    morningStartTime: z
      .string()
      .regex(timeFormatRegex, 'Invalid time format. Use HH:mm')
      .optional()
      .nullable(),
    morningEndTime: z
      .string()
      .regex(timeFormatRegex, 'Invalid time format. Use HH:mm')
      .optional()
      .nullable(),
    afternoonStartTime: z
      .string()
      .regex(timeFormatRegex, 'Invalid time format. Use HH:mm')
      .optional()
      .nullable(),
    afternoonEndTime: z
      .string()
      .regex(timeFormatRegex, 'Invalid time format. Use HH:mm')
      .optional()
      .nullable(),
    assigneeIds: z
      .array(z.string().uuid('Invalid assignee ID'))
      .optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
  body: z.object({
    status: z.nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Status must be pending, in_progress, review, or completed' }),
    }),
  }),
});

export type ListTasksQuery = z.infer<typeof listTasksSchema>['query'];
export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>['body'];
