import { z } from 'zod';

// Time format regex: HH:mm (00:00 - 23:59)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Date format regex: YYYY-MM-DD
const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

// Parse date string - accepts YYYY-MM-DD or full ISO datetime
// Uses T12:00:00 (noon) to avoid timezone issues when converting to/from UTC
function parseStartDate(val: string): Date {
  if (dateOnlyRegex.test(val)) {
    // Use noon to avoid timezone shifting the date
    return new Date(val + 'T12:00:00');
  }
  return new Date(val);
}

function parseEndDate(val: string): Date {
  if (dateOnlyRegex.test(val)) {
    // Use noon to avoid timezone shifting the date
    return new Date(val + 'T12:00:00');
  }
  return new Date(val);
}

// Event type enum
export const eventTypeEnum = z.enum(['civic', 'church', 'yearbook', 'congress']);

// Equipment assignment for a shift
const shiftEquipmentSchema = z.object({
  cameraId: z.string().uuid().optional(),
  lensId: z.string().uuid().optional(),
  adapterId: z.string().uuid().optional(),
  sdCardId: z.string().uuid().optional(),
});

// Event shift schema (a user's shift within a day)
export const eventShiftSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  startTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm)'),
  shiftType: z.enum(['morning', 'afternoon']).nullable().optional(),
  note: z.string().nullable().optional(),
  equipment: shiftEquipmentSchema.optional(),
});

// Event day schema (a single day within an event)
export const eventDaySchema = z.object({
  date: z.string().transform((val) => new Date(val + 'T12:00:00')),
  note: z.string().nullable().optional(),
  shifts: z.array(eventShiftSchema).default([]),
});

// List events query schema
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
    eventType: eventTypeEnum.optional(),
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
      eventType: eventTypeEnum,
      startDatetime: z
        .string({ required_error: 'Start date is required' })
        .transform(parseStartDate)
        .pipe(z.date({ invalid_type_error: 'Invalid start date format' })),
      endDatetime: z
        .string({ required_error: 'End date is required' })
        .transform(parseEndDate)
        .pipe(z.date({ invalid_type_error: 'Invalid end date format' })),
      // Preset times for yearbook events
      morningStartTime: z.string().regex(timeRegex).optional(),
      morningEndTime: z.string().regex(timeRegex).optional(),
      afternoonStartTime: z.string().regex(timeRegex).optional(),
      afternoonEndTime: z.string().regex(timeRegex).optional(),
      usePresetEquipment: z.boolean().optional().default(false),
      // Additional equipment IDs (for yearbook - equipment without specific shift)
      additionalEquipmentIds: z
        .array(z.string().uuid('Invalid equipment ID'))
        .optional()
        .default([]),
      // Days with shifts (for multi-day events like yearbook)
      days: z.array(eventDaySchema).optional(),
      // Legacy: direct assignees (for backward compatibility)
      assigneeIds: z
        .array(z.string().uuid('Invalid assignee ID'))
        .optional()
        .default([]),
    })
    .refine((data) => data.endDatetime >= data.startDatetime, {
      message: 'End date must be equal or after start date',
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
      eventType: eventTypeEnum.optional(),
      startDatetime: z
        .string()
        .transform(parseStartDate)
        .pipe(z.date({ invalid_type_error: 'Invalid start date format' }))
        .optional(),
      endDatetime: z
        .string()
        .transform(parseEndDate)
        .pipe(z.date({ invalid_type_error: 'Invalid end date format' }))
        .optional(),
      // Preset times for yearbook events
      morningStartTime: z.string().regex(timeRegex).nullable().optional(),
      morningEndTime: z.string().regex(timeRegex).nullable().optional(),
      afternoonStartTime: z.string().regex(timeRegex).nullable().optional(),
      afternoonEndTime: z.string().regex(timeRegex).nullable().optional(),
      usePresetEquipment: z.boolean().optional(),
      // Additional equipment IDs (for yearbook - equipment without specific shift)
      additionalEquipmentIds: z
        .array(z.string().uuid('Invalid equipment ID'))
        .optional(),
      // Days with shifts (for multi-day events like yearbook)
      days: z.array(eventDaySchema).optional(),
      // Legacy: direct assignees
      assigneeIds: z
        .array(z.string().uuid('Invalid assignee ID'))
        .optional(),
    })
    .refine(
      (data) => {
        if (data.startDatetime && data.endDatetime) {
          return data.endDatetime >= data.startDatetime;
        }
        return true;
      },
      {
        message: 'End date must be equal or after start date',
        path: ['endDatetime'],
      }
    ),
});

// Type exports
export type EventType = z.infer<typeof eventTypeEnum>;
export type ShiftEquipment = z.infer<typeof shiftEquipmentSchema>;
export type EventShiftInput = z.infer<typeof eventShiftSchema>;
export type EventDayInput = z.infer<typeof eventDaySchema>;
export type ListEventsQuery = z.infer<typeof listEventsSchema>['query'];
export type CreateEventInput = z.infer<typeof createEventSchema>['body'];
export type UpdateEventInput = z.infer<typeof updateEventSchema>['body'];
