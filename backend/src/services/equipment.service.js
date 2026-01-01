"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.equipmentService = void 0;
var client_1 = require("@prisma/client");
var app_error_1 = require("../utils/app-error");
var prisma = new client_1.PrismaClient();
/**
 * Sincroniza los estados de todos los equipos basándose en sus asignaciones activas.
 * - Si tiene un turno activo AHORA → in_use
 * - Si no tiene turnos activos AHORA y estado es in_use → available
 * Solo afecta equipos con status 'available' o 'in_use' (no maintenance/retired)
 */
function syncEquipmentStatuses() {
    return __awaiter(this, void 0, void 0, function () {
        var now, equipmentsToCheck, toMarkInUse, toMarkAvailable, _i, equipmentsToCheck_1, equipment, hasActiveAssignment;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = new Date();
                    return [4 /*yield*/, prisma.equipment.findMany({
                            where: {
                                isActive: true,
                                status: { in: [client_1.EquipmentStatus.available, client_1.EquipmentStatus.in_use] },
                            },
                            include: {
                                assignments: {
                                    where: {
                                        startTime: { lte: now },
                                        OR: [{ endTime: null }, { endTime: { gt: now } }],
                                    },
                                    take: 1,
                                },
                            },
                        })];
                case 1:
                    equipmentsToCheck = _a.sent();
                    toMarkInUse = [];
                    toMarkAvailable = [];
                    for (_i = 0, equipmentsToCheck_1 = equipmentsToCheck; _i < equipmentsToCheck_1.length; _i++) {
                        equipment = equipmentsToCheck_1[_i];
                        hasActiveAssignment = equipment.assignments.length > 0;
                        if (hasActiveAssignment && equipment.status !== client_1.EquipmentStatus.in_use) {
                            toMarkInUse.push(equipment.id);
                        }
                        else if (!hasActiveAssignment && equipment.status === client_1.EquipmentStatus.in_use) {
                            toMarkAvailable.push(equipment.id);
                        }
                    }
                    if (!(toMarkInUse.length > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma.equipment.updateMany({
                            where: { id: { in: toMarkInUse } },
                            data: { status: client_1.EquipmentStatus.in_use },
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    if (!(toMarkAvailable.length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma.equipment.updateMany({
                            where: { id: { in: toMarkAvailable } },
                            data: { status: client_1.EquipmentStatus.available },
                        })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
var equipmentSelect = {
    id: true,
    name: true,
    category: true,
    status: true,
    description: true,
    serialNumber: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};
var equipmentWithAssignmentsSelect = __assign(__assign({}, equipmentSelect), { assignments: {
        where: {
            endTime: null,
        },
        select: {
            id: true,
            startTime: true,
            notes: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            event: {
                select: {
                    id: true,
                    name: true,
                },
            },
            creator: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { startTime: 'desc' },
        take: 1,
    } });
exports.equipmentService = {
    findAll: function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, page, _b, limit, category, status, isActive, skip, where, _c, equipment, total;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: 
                    // Sincronizar estados antes de devolver la lista
                    return [4 /*yield*/, syncEquipmentStatuses()];
                    case 1:
                        // Sincronizar estados antes de devolver la lista
                        _d.sent();
                        _a = query.page, page = _a === void 0 ? 1 : _a, _b = query.limit, limit = _b === void 0 ? 10 : _b, category = query.category, status = query.status, isActive = query.isActive;
                        skip = (page - 1) * limit;
                        where = {};
                        if (category)
                            where.category = category;
                        if (status)
                            where.status = status;
                        if (isActive !== undefined)
                            where.isActive = isActive;
                        return [4 /*yield*/, Promise.all([
                                prisma.equipment.findMany({
                                    where: where,
                                    select: equipmentWithAssignmentsSelect,
                                    skip: skip,
                                    take: limit,
                                    orderBy: [{ category: 'asc' }, { name: 'asc' }],
                                }),
                                prisma.equipment.count({ where: where }),
                            ])];
                    case 2:
                        _c = _d.sent(), equipment = _c[0], total = _c[1];
                        return [2 /*return*/, {
                                data: equipment,
                                meta: {
                                    total: total,
                                    page: page,
                                    limit: limit,
                                    totalPages: Math.ceil(total / limit),
                                },
                            }];
                }
            });
        });
    },
    findById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var equipment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Sincronizar estados antes de devolver el equipo
                    return [4 /*yield*/, syncEquipmentStatuses()];
                    case 1:
                        // Sincronizar estados antes de devolver el equipo
                        _a.sent();
                        return [4 /*yield*/, prisma.equipment.findUnique({
                                where: { id: id },
                                select: equipmentWithAssignmentsSelect,
                            })];
                    case 2:
                        equipment = _a.sent();
                        if (!equipment) {
                            throw new app_error_1.NotFoundError('Equipment not found');
                        }
                        return [2 /*return*/, equipment];
                }
            });
        });
    },
    create: function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var equipment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.equipment.create({
                            data: input,
                            select: equipmentSelect,
                        })];
                    case 1:
                        equipment = _a.sent();
                        return [2 /*return*/, equipment];
                }
            });
        });
    },
    update: function (id, input) {
        return __awaiter(this, void 0, void 0, function () {
            var existingEquipment, equipment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.equipment.findUnique({
                            where: { id: id },
                        })];
                    case 1:
                        existingEquipment = _a.sent();
                        if (!existingEquipment) {
                            throw new app_error_1.NotFoundError('Equipment not found');
                        }
                        return [4 /*yield*/, prisma.equipment.update({
                                where: { id: id },
                                data: input,
                                select: equipmentSelect,
                            })];
                    case 2:
                        equipment = _a.sent();
                        return [2 /*return*/, equipment];
                }
            });
        });
    },
    updateStatus: function (id, input) {
        return __awaiter(this, void 0, void 0, function () {
            var existingEquipment, newStatus, equipment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.equipment.findUnique({
                            where: { id: id },
                            include: {
                                assignments: {
                                    where: { endTime: null },
                                    take: 1,
                                },
                            },
                        })];
                    case 1:
                        existingEquipment = _a.sent();
                        if (!existingEquipment) {
                            throw new app_error_1.NotFoundError('Equipment not found');
                        }
                        newStatus = input.status;
                        // Validate status transitions
                        if (newStatus === client_1.EquipmentStatus.available && existingEquipment.assignments.length > 0) {
                            throw new app_error_1.ValidationError('Cannot set status to available while equipment has active assignments');
                        }
                        return [4 /*yield*/, prisma.equipment.update({
                                where: { id: id },
                                data: { status: newStatus },
                                select: equipmentSelect,
                            })];
                    case 2:
                        equipment = _a.sent();
                        return [2 /*return*/, equipment];
                }
            });
        });
    },
    delete: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var existingEquipment, activeAssignments;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.equipment.findUnique({
                            where: { id: id },
                            include: {
                                assignments: true,
                            },
                        })];
                    case 1:
                        existingEquipment = _a.sent();
                        if (!existingEquipment) {
                            throw new app_error_1.NotFoundError('Equipment not found');
                        }
                        activeAssignments = existingEquipment.assignments.filter(function (assignment) { return assignment.endTime === null; });
                        if (activeAssignments.length > 0) {
                            throw new app_error_1.ValidationError('No se puede eliminar el equipo porque tiene asignaciones activas. Primero debe devolver el equipo.');
                        }
                        // Delete past assignments first, then delete the equipment
                        return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: 
                                        // Delete all past assignments for this equipment
                                        return [4 /*yield*/, tx.equipmentAssignment.deleteMany({
                                                where: { equipmentId: id },
                                            })];
                                        case 1:
                                            // Delete all past assignments for this equipment
                                            _a.sent();
                                            // Permanently delete the equipment
                                            return [4 /*yield*/, tx.equipment.delete({
                                                    where: { id: id },
                                                })];
                                        case 2:
                                            // Permanently delete the equipment
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 2:
                        // Delete past assignments first, then delete the equipment
                        _a.sent();
                        return [2 /*return*/, { message: 'Equipment deleted successfully' }];
                }
            });
        });
    },
    checkAvailability: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var equipment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.equipment.findUnique({
                            where: { id: id },
                            include: {
                                assignments: {
                                    where: { endTime: null },
                                    take: 1,
                                },
                            },
                        })];
                    case 1:
                        equipment = _a.sent();
                        if (!equipment) {
                            throw new app_error_1.NotFoundError('Equipment not found');
                        }
                        return [2 /*return*/, (equipment.isActive &&
                                equipment.status === client_1.EquipmentStatus.available &&
                                equipment.assignments.length === 0)];
                }
            });
        });
    },
    /**
     * Encuentra equipos disponibles para un rango de tiempo específico.
     * Un equipo está disponible si:
     * - Está activo (isActive = true)
     * - No está en mantenimiento (status != maintenance)
     * - No tiene asignaciones que se solapen con el rango dado
     *
     * @param excludeTasks - Si es true, solo considera asignaciones de eventos (ignora tareas)
     *                       Esto permite que eventos solo bloqueen otros eventos
     */
    findAvailableForTimeRange: function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, endTime, category, excludeTasks, whereEquipment, assignmentWhereConditions, equipment, availableEquipment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = query.startTime, endTime = query.endTime, category = query.category, excludeTasks = query.excludeTasks;
                        whereEquipment = {
                            isActive: true,
                            status: { not: client_1.EquipmentStatus.maintenance },
                        };
                        if (category) {
                            whereEquipment.category = category;
                        }
                        assignmentWhereConditions = {
                            // Only get assignments that could potentially overlap with the requested range
                            // An assignment could overlap if it ends after our start OR has no end time
                            OR: [
                                { endTime: null },
                                { endTime: { gt: startTime } },
                            ],
                        };
                        // When excludeTasks is true, only consider event assignments (those with eventId)
                        // Task assignments have no eventId or have notes containing "Tarea:"
                        if (excludeTasks) {
                            assignmentWhereConditions.eventId = { not: null };
                        }
                        return [4 /*yield*/, prisma.equipment.findMany({
                                where: whereEquipment,
                                select: __assign(__assign({}, equipmentSelect), { assignments: {
                                        where: assignmentWhereConditions,
                                        select: {
                                            id: true,
                                            startTime: true,
                                            endTime: true,
                                            eventId: true,
                                        },
                                    } }),
                                orderBy: [{ category: 'asc' }, { name: 'asc' }],
                            })];
                    case 1:
                        equipment = _a.sent();
                        availableEquipment = equipment.filter(function (eq) {
                            // Check each assignment for overlap
                            for (var _i = 0, _a = eq.assignments; _i < _a.length; _i++) {
                                var assignment = _a[_i];
                                var hasOverlap = isTimeOverlapping(assignment.startTime, assignment.endTime, startTime, endTime);
                                if (hasOverlap) {
                                    return false; // Equipment has conflicting assignment
                                }
                            }
                            return true; // No conflicts found
                        });
                        // Remove assignments from response (not needed by frontend)
                        return [2 /*return*/, availableEquipment.map(function (_a) {
                                var assignments = _a.assignments, rest = __rest(_a, ["assignments"]);
                                return rest;
                            })];
                }
            });
        });
    },
};
/**
 * Verifica si dos rangos de tiempo se solapan
 */
function isTimeOverlapping(start1, end1, start2, end2) {
    var effectiveEnd1 = end1 || new Date('9999-12-31T23:59:59');
    return start1 < end2 && start2 < effectiveEnd1;
}
