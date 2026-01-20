import { useMemo } from 'react';
import { useAuthContext } from '../stores/auth.store';
import type { SupervisorPermissions, PermissionKey } from '../types';
import { DEFAULT_SUPERVISOR_PERMISSIONS, EMPTY_PERMISSIONS } from '../types';

/**
 * Get effective permissions for a user based on their role.
 * - Admin: Always has all permissions
 * - Supervisor: Has their configured permissions (defaults to all if not set)
 * - Becario: Has no special permissions
 */
function getEffectivePermissions(
  role: string | undefined,
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
 * Hook to check user permissions in the frontend.
 * Returns helpers to verify if the current user has specific permissions.
 */
export function usePermissions() {
  const { user } = useAuthContext();

  const permissions = useMemo(() => {
    return getEffectivePermissions(user?.role, user?.permissions);
  }, [user?.role, user?.permissions]);

  const hasPermission = (permission: PermissionKey): boolean => {
    return permissions[permission] === true;
  };

  const hasAnyPermission = (...permissionList: PermissionKey[]): boolean => {
    return permissionList.some((p) => permissions[p] === true);
  };

  const hasAllPermissions = (...permissionList: PermissionKey[]): boolean => {
    return permissionList.every((p) => permissions[p] === true);
  };

  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor';
  const isBecario = user?.role === 'becario';

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isSupervisor,
    isBecario,
    // Shortcut for common checks
    canManageUsers: hasPermission('canManageUsers'),
    canManageTasks: hasPermission('canManageTasks'),
    canManageEvents: hasPermission('canManageEvents'),
    canManageEquipment: hasPermission('canManageEquipment'),
    canManageTimeEntries: hasPermission('canManageTimeEntries'),
    canApproveTasks: hasPermission('canApproveTasks'),
    canViewReports: hasPermission('canViewReports'),
    canViewAllLogs: hasPermission('canViewAllLogs'),
    canManageRfid: hasPermission('canManageRfid'),
  };
}
