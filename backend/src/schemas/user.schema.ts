import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .max(255, 'Email must be at most 255 characters'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    rfidTag: z
      .string()
      .max(50, 'RFID tag must be at most 50 characters')
      .optional()
      .nullable(),
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({ message: 'Role must be admin, supervisor, or becario' }),
    }).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Name cannot be empty')
      .max(100, 'Name must be at most 100 characters')
      .optional(),
    email: z
      .string()
      .email('Invalid email format')
      .max(255, 'Email must be at most 255 characters')
      .optional(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .optional(),
    rfidTag: z
      .string()
      .max(50, 'RFID tag must be at most 50 characters')
      .optional()
      .nullable(),
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({ message: 'Role must be admin, supervisor, or becario' }),
    }).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export const listUsersSchema = z.object({
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
    role: z.nativeEnum(UserRole).optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'true') return true;
        if (val === 'false') return false;
        return undefined;
      }),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type ListUsersQuery = z.infer<typeof listUsersSchema>['query'];
