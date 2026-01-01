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

// Schema for admin to create manual time entry
export const createTimeEntrySchema = z.object({
  body: z
    .object({
      userId: z.string().uuid('Invalid user ID'),
      clockIn: z.string().transform((val) => new Date(val)).pipe(z.date()),
      clockOut: z.string().transform((val) => new Date(val)).pipe(z.date()),
      eventId: z.string().uuid('Invalid event ID').optional().nullable(),
      notes: z.string().max(500).optional().nullable(),
    })
    .refine((data) => data.clockOut > data.clockIn, {
      message: 'Clock out must be after clock in',
      path: ['clockOut'],
    }),
});

// Schema for admin to update time entry
export const updateTimeEntrySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid time entry ID'),
  }),
  body: z
    .object({
      clockIn: z.string().transform((val) => new Date(val)).pipe(z.date()).optional(),
      clockOut: z.string().transform((val) => new Date(val)).pipe(z.date()).optional().nullable(),
      eventId: z.string().uuid('Invalid event ID').optional().nullable(),
      notes: z.string().max(500).optional().nullable(),
    })
    .refine(
      (data) => {
        if (data.clockIn && data.clockOut) {
          return data.clockOut > data.clockIn;
        }
        return true;
      },
      {
        message: 'Clock out must be after clock in',
        path: ['clockOut'],
      }
    ),
});

// Schema for delete
export const deleteTimeEntrySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid time entry ID'),
  }),
});

export type ListTimeEntriesQuery = z.infer<typeof listTimeEntriesSchema>['query'];
export type ClockInInput = z.infer<typeof clockInSchema>['body'];
export type RfidInput = z.infer<typeof rfidSchema>['body'];
export type SummaryQuery = z.infer<typeof summarySchema>['query'];
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>['body'];
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>['body'];
