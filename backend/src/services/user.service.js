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
exports.userService = void 0;
var bcrypt_1 = require("bcrypt");
var client_1 = require("@prisma/client");
var app_error_1 = require("../utils/app-error");
var prisma = new client_1.PrismaClient();
var userSelect = {
    id: true,
    name: true,
    email: true,
    rfidTag: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};
exports.userService = {
    findAll: function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, page, _b, limit, role, isActive, skip, where, _c, users, total;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = query.page, page = _a === void 0 ? 1 : _a, _b = query.limit, limit = _b === void 0 ? 10 : _b, role = query.role, isActive = query.isActive;
                        skip = (page - 1) * limit;
                        where = {};
                        if (role)
                            where.role = role;
                        if (isActive !== undefined)
                            where.isActive = isActive;
                        return [4 /*yield*/, Promise.all([
                                prisma.user.findMany({
                                    where: where,
                                    select: userSelect,
                                    skip: skip,
                                    take: limit,
                                    orderBy: { createdAt: 'desc' },
                                }),
                                prisma.user.count({ where: where }),
                            ])];
                    case 1:
                        _c = _d.sent(), users = _c[0], total = _c[1];
                        return [2 /*return*/, {
                                data: users,
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
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.user.findUnique({
                            where: { id: id },
                            select: userSelect,
                        })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new app_error_1.NotFoundError('User not found');
                        }
                        return [2 /*return*/, user];
                }
            });
        });
    },
    create: function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var email, password, rfidTag, rest, existingEmail, existingRfid, passwordHash, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        email = input.email, password = input.password, rfidTag = input.rfidTag, rest = __rest(input, ["email", "password", "rfidTag"]);
                        return [4 /*yield*/, prisma.user.findUnique({
                                where: { email: email.toLowerCase() },
                            })];
                    case 1:
                        existingEmail = _a.sent();
                        if (existingEmail) {
                            throw new app_error_1.ValidationError('Email already in use');
                        }
                        if (!rfidTag) return [3 /*break*/, 3];
                        return [4 /*yield*/, prisma.user.findUnique({
                                where: { rfidTag: rfidTag },
                            })];
                    case 2:
                        existingRfid = _a.sent();
                        if (existingRfid) {
                            throw new app_error_1.ValidationError('RFID tag already in use');
                        }
                        _a.label = 3;
                    case 3: return [4 /*yield*/, bcrypt_1.default.hash(password, 10)];
                    case 4:
                        passwordHash = _a.sent();
                        return [4 /*yield*/, prisma.user.create({
                                data: __assign(__assign({}, rest), { email: email.toLowerCase(), passwordHash: passwordHash, rfidTag: rfidTag || null }),
                                select: userSelect,
                            })];
                    case 5:
                        user = _a.sent();
                        return [2 /*return*/, user];
                }
            });
        });
    },
    update: function (id, input) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser, email, password, rfidTag, rest, updateData, existingEmail, existingRfid, _a, user;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, prisma.user.findUnique({
                            where: { id: id },
                        })];
                    case 1:
                        existingUser = _b.sent();
                        if (!existingUser) {
                            throw new app_error_1.NotFoundError('User not found');
                        }
                        email = input.email, password = input.password, rfidTag = input.rfidTag, rest = __rest(input, ["email", "password", "rfidTag"]);
                        updateData = __assign({}, rest);
                        if (!(email && email.toLowerCase() !== existingUser.email)) return [3 /*break*/, 3];
                        return [4 /*yield*/, prisma.user.findUnique({
                                where: { email: email.toLowerCase() },
                            })];
                    case 2:
                        existingEmail = _b.sent();
                        if (existingEmail) {
                            throw new app_error_1.ValidationError('Email already in use');
                        }
                        updateData.email = email.toLowerCase();
                        _b.label = 3;
                    case 3:
                        if (!(rfidTag !== undefined)) return [3 /*break*/, 6];
                        if (!(rfidTag && rfidTag !== existingUser.rfidTag)) return [3 /*break*/, 5];
                        return [4 /*yield*/, prisma.user.findUnique({
                                where: { rfidTag: rfidTag },
                            })];
                    case 4:
                        existingRfid = _b.sent();
                        if (existingRfid) {
                            throw new app_error_1.ValidationError('RFID tag already in use');
                        }
                        _b.label = 5;
                    case 5:
                        updateData.rfidTag = rfidTag;
                        _b.label = 6;
                    case 6:
                        if (!password) return [3 /*break*/, 8];
                        _a = updateData;
                        return [4 /*yield*/, bcrypt_1.default.hash(password, 10)];
                    case 7:
                        _a.passwordHash = _b.sent();
                        _b.label = 8;
                    case 8: return [4 /*yield*/, prisma.user.update({
                            where: { id: id },
                            data: updateData,
                            select: userSelect,
                        })];
                    case 9:
                        user = _b.sent();
                        return [2 /*return*/, user];
                }
            });
        });
    },
    delete: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.user.findUnique({
                            where: { id: id },
                        })];
                    case 1:
                        existingUser = _a.sent();
                        if (!existingUser) {
                            throw new app_error_1.NotFoundError('User not found');
                        }
                        return [4 /*yield*/, prisma.user.update({
                                where: { id: id },
                                data: { isActive: false },
                                select: userSelect,
                            })];
                    case 2:
                        user = _a.sent();
                        return [2 /*return*/, user];
                }
            });
        });
    },
};
