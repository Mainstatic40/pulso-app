"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsersSchema = exports.getUserSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
var zod_1 = require("zod");
var client_1 = require("@prisma/client");
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({ required_error: 'Name is required' })
            .min(1, 'Name is required')
            .max(100, 'Name must be at most 100 characters'),
        email: zod_1.z
            .string({ required_error: 'Email is required' })
            .email('Invalid email format')
            .max(255, 'Email must be at most 255 characters'),
        password: zod_1.z
            .string({ required_error: 'Password is required' })
            .min(6, 'Password must be at least 6 characters'),
        rfidTag: zod_1.z
            .string()
            .max(50, 'RFID tag must be at most 50 characters')
            .optional()
            .nullable(),
        role: zod_1.z.nativeEnum(client_1.UserRole, {
            errorMap: function () { return ({ message: 'Role must be admin, supervisor, or becario' }); },
        }).optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.updateUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid user ID'),
    }),
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(1, 'Name cannot be empty')
            .max(100, 'Name must be at most 100 characters')
            .optional(),
        email: zod_1.z
            .string()
            .email('Invalid email format')
            .max(255, 'Email must be at most 255 characters')
            .optional(),
        password: zod_1.z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .optional(),
        rfidTag: zod_1.z
            .string()
            .max(50, 'RFID tag must be at most 50 characters')
            .optional()
            .nullable(),
        role: zod_1.z.nativeEnum(client_1.UserRole, {
            errorMap: function () { return ({ message: 'Role must be admin, supervisor, or becario' }); },
        }).optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.getUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid user ID'),
    }),
});
exports.listUsersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .transform(function (val) { return (val ? parseInt(val, 10) : 1); })
            .pipe(zod_1.z.number().int().positive()),
        limit: zod_1.z
            .string()
            .optional()
            .transform(function (val) { return (val ? parseInt(val, 10) : 10); })
            .pipe(zod_1.z.number().int().min(1).max(100)),
        role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
        isActive: zod_1.z
            .string()
            .optional()
            .transform(function (val) {
            if (val === 'true')
                return true;
            if (val === 'false')
                return false;
            return undefined;
        }),
    }),
});
