import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

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
      .transform((val) => (val ? new Date(val) : undefined))
      .pipe(z.date().optional()),
    dueDateTo: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined))
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
      .transform((val) => new Date(val))
      .pipe(z.date({ invalid_type_error: 'Invalid date format' })),
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
      .transform((val) => new Date(val))
      .pipe(z.date({ invalid_type_error: 'Invalid date format' }))
      .optional(),
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
