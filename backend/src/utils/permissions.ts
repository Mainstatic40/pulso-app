import {
  SupervisorPermissions,
  PermissionKey,
  DEFAULT_SUPERVISOR_PERMISSIONS,
  EMPTY_PERMISSIONS,
} from '../constants/permissions';

/**
 * Get effective permissions for a user based on their role.
 * - Admin: Always has all permissions
 * - Supervisor: Has their configured permissions (defaults to all if not set)
 * - Becario: Has no special permissions (empty)
 */
export function getEffectivePermissions(
  role: string,
  permissions?: SupervisorPermissions | null
): SupervisorPermissions {
  if (role === 'admin') {
    return DEFAULT_SUPERVISOR_PERMISSIONS;
  }

  if (role === 'supervisor') {
    // If permissions are not set or empty, default to all permissions for backwards compatibility
    if (!permissions || Object.keys(permissions).length === 0) {
      return DEFAULT_SUPERVISOR_PERMISSIONS;
    }
    // Merge with defaults to ensure all keys exist
    return {
      ...EMPTY_PERMISSIONS,
      ...permissions,
    };
  }

  // Becarios have no special permissions
  return EMPTY_PERMISSIONS;
}

/**
 * Check if a user has a specific permission.
 */
export function hasPermission(
  role: string,
  permissions: SupervisorPermissions | null | undefined,
  permission: PermissionKey
): boolean {
  const effective = getEffectivePermissions(role, permissions);
  return effective[permission] === true;
}

/**
 * Check if a user can perform an action that requires a specific permission.
 * Admin always returns true.
 */
export function canPerformAction(
  role: string,
  permissions: SupervisorPermissions | null | undefined,
  permission: PermissionKey
): boolean {
  // Admin can always perform any action
  if (role === 'admin') {
    return true;
  }

  return hasPermission(role, permissions, permission);
}

/**
 * Check if a user has any of the specified permissions.
 */
export function hasAnyPermission(
  role: string,
  permissions: SupervisorPermissions | null | undefined,
  permissionList: PermissionKey[]
): boolean {
  // Admin always has all permissions
  if (role === 'admin') {
    return true;
  }

  return permissionList.some((p) => hasPermission(role, permissions, p));
}

/**
 * Check if a user has all of the specified permissions.
 */
export function hasAllPermissions(
  role: string,
  permissions: SupervisorPermissions | null | undefined,
  permissionList: PermissionKey[]
): boolean {
  // Admin always has all permissions
  if (role === 'admin') {
    return true;
  }

  return permissionList.every((p) => hasPermission(role, permissions, p));
}

/**
 * Parse permissions from JSON (Prisma returns Json type).
 * Safely handles null, undefined, or invalid JSON.
 */
export function parsePermissions(
  json: unknown
): SupervisorPermissions | null {
  if (!json || typeof json !== 'object') {
    return null;
  }

  // If it's already an object, validate it has the right shape
  const obj = json as Record<string, unknown>;

  // Check if any permission key exists to determine if permissions are set
  const hasAnyPermissionKey = Object.keys(obj).some((key) =>
    ['canManageUsers', 'canManageTasks', 'canManageEvents', 'canManageEquipment',
      'canManageTimeEntries', 'canApproveTasks', 'canViewReports', 'canViewAllLogs',
      'canManageRfid'].includes(key)
  );

  if (!hasAnyPermissionKey) {
    return null;
  }

  return {
    canManageUsers: obj.canManageUsers === true,
    canManageTasks: obj.canManageTasks === true,
    canManageEvents: obj.canManageEvents === true,
    canManageEquipment: obj.canManageEquipment === true,
    canManageTimeEntries: obj.canManageTimeEntries === true,
    canApproveTasks: obj.canApproveTasks === true,
    canViewReports: obj.canViewReports === true,
    canViewAllLogs: obj.canViewAllLogs === true,
    canManageRfid: obj.canManageRfid === true,
  };
}
