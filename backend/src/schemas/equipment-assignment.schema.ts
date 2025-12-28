import { z } from 'zod';

export const listAssignmentsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().int().positive()),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 100))
      .pipe(z.number().int().min(1).max(1000)),
    equipmentId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    eventId: z.string().uuid().optional(),
    active: z
      .string()
      .optional()
      .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    today: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  }),
});

export const getAssignmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid assignment ID'),
  }),
});

export const createAssignmentSchema = z.object({
  body: z.object({
    equipmentIds: z
      .array(z.string().uuid('Invalid equipment ID'))
      .min(1, 'At least one equipment ID is required'),
    userId: z.string().uuid('Invalid user ID'),
    eventId: z.string().uuid('Invalid event ID').optional().nullable(),
    startTime: z
      .string({ required_error: 'Start time is required' })
      .transform((val) => new Date(val))
      .pipe(z.date({ invalid_type_error: 'Invalid date format' })),
    endTime: z.preprocess(
      (val) => (typeof val === 'string' && val.trim() !== '' ? val : undefined),
      z
        .string()
        .transform((val) => new Date(val))
        .pipe(z.date({ invalid_type_error: 'Invalid date format' }))
        .optional()
    ),
    notes: z.string().optional().nullable(),
  }),
});

export const updateAssignmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid assignment ID'),
  }),
  body: z.object({
    userId: z.string().uuid('Invalid user ID').optional(),
    eventId: z.string().uuid('Invalid event ID').optional().nullable(),
    startTime: z.preprocess(
      (val) => (typeof val === 'string' && val.trim() !== '' ? val : undefined),
      z
        .string()
        .transform((val) => new Date(val))
        .pipe(z.date({ invalid_type_error: 'Invalid date format' }))
        .optional()
    ),
    endTime: z.preprocess(
      (val) => (typeof val === 'string' && val.trim() !== '' ? val : undefined),
      z
        .string()
        .transform((val) => new Date(val))
        .pipe(z.date({ invalid_type_error: 'Invalid date format' }))
        .optional()
    ),
    notes: z.string().optional().nullable(),
  }),
});

export const returnEquipmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid assignment ID'),
  }),
  body: z.object({
    notes: z.string().optional().nullable(),
  }).optional(),
});

export type ListAssignmentsQuery = z.infer<typeof listAssignmentsSchema>['query'];
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>['body'];
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>['body'];
export type ReturnEquipmentInput = z.infer<typeof returnEquipmentSchema>['body'];
