import { z } from 'zod';

export const getByMonthSchema = z.object({
  params: z.object({
    year: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(2020).max(2100)),
    month: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1).max(12)),
  }),
});

export const upsertSchema = z.object({
  params: z.object({
    year: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(2020).max(2100)),
    month: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1).max(12)),
  }),
  body: z.object({
    targetHours: z.number().positive('Target hours must be positive').max(300, 'Target hours cannot exceed 300'),
    hoursPerDay: z.number().positive('Hours per day must be positive').max(12, 'Hours per day cannot exceed 12').optional().default(4),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').nullable().optional(),
  }),
});

export const listSchema = z.object({
  query: z.object({
    year: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .pipe(z.number().int().min(2020).max(2100).optional()),
  }),
});

export type GetByMonthParams = z.infer<typeof getByMonthSchema>['params'];
export type UpsertParams = z.infer<typeof upsertSchema>['params'];
export type UpsertBody = z.infer<typeof upsertSchema>['body'];
export type ListQuery = z.infer<typeof listSchema>['query'];
