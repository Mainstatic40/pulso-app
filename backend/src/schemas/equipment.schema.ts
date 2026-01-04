import { z } from 'zod';
import { EquipmentCategory, EquipmentStatus } from '@prisma/client';

export const listEquipmentSchema = z.object({
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
    category: z.nativeEnum(EquipmentCategory).optional(),
    status: z.nativeEnum(EquipmentStatus).optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    withoutRfid: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  }),
});

export const getEquipmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid equipment ID'),
  }),
});

export const createEquipmentSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(1, 'Name is required')
      .max(200, 'Name must be at most 200 characters'),
    category: z.nativeEnum(EquipmentCategory, {
      errorMap: () => ({ message: 'Category must be camera, lens, adapter, or sd_card' }),
    }),
    status: z.nativeEnum(EquipmentStatus).optional().default(EquipmentStatus.available),
    description: z.string().optional().nullable(),
    serialNumber: z.string().max(100).optional().nullable(),
  }),
});

export const updateEquipmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid equipment ID'),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Name cannot be empty')
      .max(200, 'Name must be at most 200 characters')
      .optional(),
    category: z.nativeEnum(EquipmentCategory).optional(),
    status: z.nativeEnum(EquipmentStatus).optional(),
    description: z.string().optional().nullable(),
    serialNumber: z.string().max(100).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const updateEquipmentStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid equipment ID'),
  }),
  body: z.object({
    status: z.nativeEnum(EquipmentStatus, {
      errorMap: () => ({ message: 'Status must be available, in_use, or maintenance' }),
    }),
  }),
});

export const availableEquipmentSchema = z.object({
  query: z.object({
    startTime: z
      .string({ required_error: 'Start time is required' })
      .transform((val) => new Date(val))
      .pipe(z.date({ invalid_type_error: 'Invalid start time format' })),
    endTime: z
      .string({ required_error: 'End time is required' })
      .transform((val) => new Date(val))
      .pipe(z.date({ invalid_type_error: 'Invalid end time format' })),
    category: z.nativeEnum(EquipmentCategory).optional(),
    // When true, only considers event assignments for overlap check (ignores task assignments)
    excludeTasks: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  }),
});

export type ListEquipmentQuery = z.infer<typeof listEquipmentSchema>['query'];
export type AvailableEquipmentQuery = z.infer<typeof availableEquipmentSchema>['query'];
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>['body'];
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>['body'];
export type UpdateEquipmentStatusInput = z.infer<typeof updateEquipmentStatusSchema>['body'];
