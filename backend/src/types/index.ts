import type { UserRole, TaskStatus, TaskPriority } from '@prisma/client';

export type { UserRole, TaskStatus, TaskPriority };

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
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
