/**
 * Supervisor Permissions Constants
 *
 * Defines the available permissions for supervisors.
 * Admin always has all permissions, becarios have fixed limited permissions.
 */

export interface SupervisorPermissions {
  canManageUsers: boolean;
  canManageTasks: boolean;
  canManageEvents: boolean;
  canManageEquipment: boolean;
  canManageTimeEntries: boolean;
  canApproveTasks: boolean;
  canViewReports: boolean;
  canViewAllLogs: boolean;
  canManageRfid: boolean;
}

export type PermissionKey = keyof SupervisorPermissions;

export const PERMISSION_KEYS: PermissionKey[] = [
  'canManageUsers',
  'canManageTasks',
  'canManageEvents',
  'canManageEquipment',
  'canManageTimeEntries',
  'canApproveTasks',
  'canViewReports',
  'canViewAllLogs',
  'canManageRfid',
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  canManageUsers: 'Gestionar usuarios',
  canManageTasks: 'Crear/editar/eliminar tareas',
  canManageEvents: 'Crear/editar/eliminar eventos',
  canManageEquipment: 'Gestionar equipos y préstamos',
  canManageTimeEntries: 'Agregar/editar horas de becarios',
  canApproveTasks: 'Aprobar/rechazar tareas en revisión',
  canViewReports: 'Acceder a reportes',
  canViewAllLogs: 'Ver bitácoras de todo el equipo',
  canManageRfid: 'Gestionar credenciales RFID',
};

// Default permissions for new supervisors (all enabled for backwards compatibility)
export const DEFAULT_SUPERVISOR_PERMISSIONS: SupervisorPermissions = {
  canManageUsers: true,
  canManageTasks: true,
  canManageEvents: true,
  canManageEquipment: true,
  canManageTimeEntries: true,
  canApproveTasks: true,
  canViewReports: true,
  canViewAllLogs: true,
  canManageRfid: true,
};

// Empty permissions (all disabled)
export const EMPTY_PERMISSIONS: SupervisorPermissions = {
  canManageUsers: false,
  canManageTasks: false,
  canManageEvents: false,
  canManageEquipment: false,
  canManageTimeEntries: false,
  canApproveTasks: false,
  canViewReports: false,
  canViewAllLogs: false,
  canManageRfid: false,
};
