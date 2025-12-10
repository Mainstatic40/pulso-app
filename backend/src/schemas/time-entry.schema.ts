import { z } from 'zod';

export const listTimeEntriesSchema = z.object({
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
    eventId: z.string().uuid().optional(),
    dateFrom: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined))
      .pipe(z.date().optional()),
    dateTo: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined))
      .pipe(z.date().optional()),
  }),
});

export const getTimeEntrySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid time entry ID'),
  }),
});

export const clockInSchema = z.object({
  body: z.object({
    eventId: z.string().uuid('Invalid event ID').optional().nullable(),
  }),
});

export const clockOutSchema = z.object({
  body: z.object({}),
});

export const rfidSchema = z.object({
  body: z.object({
    rfidTag: z.string({ required_error: 'RFID tag is required' }).min(1, 'RFID tag is required'),
    eventId: z.string().uuid('Invalid event ID').optional().nullable(),
  }),
});

export const summarySchema = z.object({
  query: z.object({
    period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily'),
    userId: z.string().uuid().optional(),
  }),
});

export type ListTimeEntriesQuery = z.infer<typeof listTimeEntriesSchema>['query'];
export type ClockInInput = z.infer<typeof clockInSchema>['body'];
export type RfidInput = z.infer<typeof rfidSchema>['body'];
export type SummaryQuery = z.infer<typeof summarySchema>['query'];
