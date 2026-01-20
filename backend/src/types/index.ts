import type { UserRole, TaskStatus, TaskPriority } from '@prisma/client';
import type { SupervisorPermissions } from '../constants/permissions';

export type { UserRole, TaskStatus, TaskPriority };
export type { SupervisorPermissions, PermissionKey } from '../constants/permissions';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions?: SupervisorPermissions;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
