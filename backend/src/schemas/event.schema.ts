import { z } from 'zod';

export const listEventsSchema = z.object({
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
    assigneeId: z.string().uuid().optional(),
  }),
});

export const getEventSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid event ID'),
  }),
});

export const createEventSchema = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: 'Name is required' })
        .min(1, 'Name is required')
        .max(200, 'Name must be at most 200 characters'),
      description: z.string().optional().default(''),
      clientRequirements: z.string().optional().nullable(),
      startDatetime: z
        .string({ required_error: 'Start datetime is required' })
        .transform((val) => new Date(val))
        .pipe(z.date({ invalid_type_error: 'Invalid start datetime format' })),
      endDatetime: z
        .string({ required_error: 'End datetime is required' })
        .transform((val) => new Date(val))
        .pipe(z.date({ invalid_type_error: 'Invalid end datetime format' })),
      assigneeIds: z
        .array(z.string().uuid('Invalid assignee ID'))
        .optional()
        .default([]),
    })
    .refine((data) => data.endDatetime > data.startDatetime, {
      message: 'End datetime must be after start datetime',
      path: ['endDatetime'],
    }),
});

export const updateEventSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid event ID'),
  }),
  body: z
    .object({
      name: z
        .string()
        .min(1, 'Name cannot be empty')
        .max(200, 'Name must be at most 200 characters')
        .optional(),
      description: z.string().optional(),
      clientRequirements: z.string().optional().nullable(),
      startDatetime: z
        .string()
        .transform((val) => new Date(val))
        .pipe(z.date({ invalid_type_error: 'Invalid start datetime format' }))
        .optional(),
      endDatetime: z
        .string()
        .transform((val) => new Date(val))
        .pipe(z.date({ invalid_type_error: 'Invalid end datetime format' }))
        .optional(),
      assigneeIds: z
        .array(z.string().uuid('Invalid assignee ID'))
        .optional(),
    })
    .refine(
      (data) => {
        if (data.startDatetime && data.endDatetime) {
          return data.endDatetime > data.startDatetime;
        }
        return true;
      },
      {
        message: 'End datetime must be after start datetime',
        path: ['endDatetime'],
      }
    ),
});

export type ListEventsQuery = z.infer<typeof listEventsSchema>['query'];
export type CreateEventInput = z.infer<typeof createEventSchema>['body'];
export type UpdateEventInput = z.infer<typeof updateEventSchema>['body'];
