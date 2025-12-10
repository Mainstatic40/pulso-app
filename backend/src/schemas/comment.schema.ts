import { z } from 'zod';

export const listCommentsSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('Invalid task ID'),
  }),
});

export const createCommentSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('Invalid task ID'),
  }),
  body: z.object({
    content: z
      .string({ required_error: 'Content is required' })
      .min(1, 'Content is required')
      .max(2000, 'Content must be at most 2000 characters'),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid comment ID'),
  }),
  body: z.object({
    content: z
      .string({ required_error: 'Content is required' })
      .min(1, 'Content is required')
      .max(2000, 'Content must be at most 2000 characters'),
  }),
});

export const deleteCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid comment ID'),
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>['body'];
