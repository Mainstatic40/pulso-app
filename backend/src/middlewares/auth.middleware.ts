import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/app-error';
import type { JwtPayload, UserRole, PermissionKey } from '../types';
import { canPerformAction, hasAnyPermission } from '../utils/permissions';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to access this resource'));
      return;
    }

    next();
  };
}

/**
 * Middleware that requires a specific permission.
 * Admin always has access. Supervisors need the specific permission.
 * Becarios are always denied unless explicitly using authorize.
 */
export function requirePermission(permission: PermissionKey) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    // Becarios cannot access permission-protected routes
    if (req.user.role === 'becario') {
      next(new ForbiddenError('You do not have permission to access this resource'));
      return;
    }

    // Admin and supervisors with the permission can access
    if (canPerformAction(req.user.role, req.user.permissions, permission)) {
      next();
      return;
    }

    next(new ForbiddenError('You do not have permission to perform this action'));
  };
}

/**
 * Middleware that requires at least one of the specified permissions.
 * Admin always has access.
 */
export function requireAnyPermission(...permissions: PermissionKey[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    // Becarios cannot access permission-protected routes
    if (req.user.role === 'becario') {
      next(new ForbiddenError('You do not have permission to access this resource'));
      return;
    }

    // Admin and supervisors with any of the permissions can access
    if (hasAnyPermission(req.user.role, req.user.permissions, permissions)) {
      next();
      return;
    }

    next(new ForbiddenError('You do not have permission to perform this action'));
  };
}
