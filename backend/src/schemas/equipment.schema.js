"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availableEquipmentSchema = exports.updateEquipmentStatusSchema = exports.updateEquipmentSchema = exports.createEquipmentSchema = exports.getEquipmentSchema = exports.listEquipmentSchema = void 0;
var zod_1 = require("zod");
var client_1 = require("@prisma/client");
exports.listEquipmentSchema = zod_1.z.object({
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
        category: zod_1.z.nativeEnum(client_1.EquipmentCategory).optional(),
        status: zod_1.z.nativeEnum(client_1.EquipmentStatus).optional(),
        isActive: zod_1.z
            .string()
            .optional()
            .transform(function (val) { return (val === 'true' ? true : val === 'false' ? false : undefined); }),
    }),
});
exports.getEquipmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid equipment ID'),
    }),
});
exports.createEquipmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({ required_error: 'Name is required' })
            .min(1, 'Name is required')
            .max(200, 'Name must be at most 200 characters'),
        category: zod_1.z.nativeEnum(client_1.EquipmentCategory, {
            errorMap: function () { return ({ message: 'Category must be camera, lens, adapter, or sd_card' }); },
        }),
        status: zod_1.z.nativeEnum(client_1.EquipmentStatus).optional().default(client_1.EquipmentStatus.available),
        description: zod_1.z.string().optional().nullable(),
        serialNumber: zod_1.z.string().max(100).optional().nullable(),
    }),
});
exports.updateEquipmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid equipment ID'),
    }),
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(1, 'Name cannot be empty')
            .max(200, 'Name must be at most 200 characters')
            .optional(),
        category: zod_1.z.nativeEnum(client_1.EquipmentCategory).optional(),
        status: zod_1.z.nativeEnum(client_1.EquipmentStatus).optional(),
        description: zod_1.z.string().optional().nullable(),
        serialNumber: zod_1.z.string().max(100).optional().nullable(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.updateEquipmentStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid equipment ID'),
    }),
    body: zod_1.z.object({
        status: zod_1.z.nativeEnum(client_1.EquipmentStatus, {
            errorMap: function () { return ({ message: 'Status must be available, in_use, or maintenance' }); },
        }),
    }),
});
exports.availableEquipmentSchema = zod_1.z.object({
    query: zod_1.z.object({
        startTime: zod_1.z
            .string({ required_error: 'Start time is required' })
            .transform(function (val) { return new Date(val); })
            .pipe(zod_1.z.date({ invalid_type_error: 'Invalid start time format' })),
        endTime: zod_1.z
            .string({ required_error: 'End time is required' })
            .transform(function (val) { return new Date(val); })
            .pipe(zod_1.z.date({ invalid_type_error: 'Invalid end time format' })),
        category: zod_1.z.nativeEnum(client_1.EquipmentCategory).optional(),
        // When true, only considers event assignments for overlap check (ignores task assignments)
        excludeTasks: zod_1.z
            .string()
            .optional()
            .transform(function (val) { return val === 'true'; }),
    }),
});
