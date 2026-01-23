export type UserRole = 'admin' | 'supervisor' | 'becario';

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskShift = 'morning' | 'afternoon' | 'both';

export type EquipmentCategory = 'camera' | 'lens' | 'adapter' | 'sd_card';

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance';

export type EventType = 'civic' | 'church' | 'yearbook' | 'congress';

// Supervisor Permissions
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

export interface User {
  id: string;
  name: string;
  email: string;
  rfidTag?: string;
  profileImage?: string | null;
  role: UserRole;
  tracksHours: boolean;
  permissions?: SupervisorPermissions | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KioskUser {
  id: string;
  name: string;
  profileImage: string | null;
  activeSession: {
    id: string;
    clockIn: string;
  } | null;
}

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  content: string;
  isCompleted: boolean;
  order: number;
}

export interface EventChecklistItem {
  id: string;
  eventId: string;
  content: string;
  isCompleted: boolean;
  order: number;
}

export interface Attachment {
  id: string;
  filename: string;
  storedName: string;
  mimeType: string;
  size: number;
  taskId?: string;
  eventId?: string;
  uploadedBy: string;
  createdAt: string;
  uploader?: {
    id: string;
    name: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  clientRequirements?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  executionDate?: string;
  shift?: TaskShift;
  morningStartTime?: string;
  morningEndTime?: string;
  afternoonStartTime?: string;
  afternoonEndTime?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignees?: User[];
  comments?: Comment[];
  checklistItems?: TaskChecklistItem[];
  attachments?: Attachment[];
}

// Equipment for a shift assignment
export interface ShiftEquipment {
  cameraId?: string;
  lensId?: string;
  adapterId?: string;
  sdCardId?: string;
}

// A user's shift within an event day
export interface EventShift {
  id: string;
  eventDayId: string;
  userId: string;
  startTime: string;
  endTime: string;
  shiftType?: 'morning' | 'afternoon' | null;
  note?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string | null;
  };
  equipmentAssignments?: EquipmentAssignment[];
}

// A single day within an event
export interface EventDay {
  id: string;
  eventId: string;
  date: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  shifts: EventShift[];
}

// Input types for creating/updating
export interface EventShiftInput {
  userId: string;
  startTime: string;
  endTime: string;
  shiftType?: 'morning' | 'afternoon' | null;
  note?: string | null;
  equipment?: ShiftEquipment;
}

export interface EventDayInput {
  date: string;
  note?: string | null;
  shifts: EventShiftInput[];
}

export interface Event {
  id: string;
  name: string;
  description: string;
  clientRequirements?: string | null;
  eventType: EventType;
  startDatetime: string;
  endDatetime: string;
  // Preset times for yearbook events
  morningStartTime?: string | null;
  morningEndTime?: string | null;
  afternoonStartTime?: string | null;
  afternoonEndTime?: string | null;
  usePresetEquipment?: boolean;
  createdBy: string;
  createdAt: string;
  // Relations
  creator?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string | null;
  };
  assignees?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      profileImage?: string | null;
    };
  }>;
  days?: EventDay[];
  attachments?: Attachment[];
  comments?: Comment[];
  checklistItems?: EventChecklistItem[];
  // Count for list views
  _count?: {
    days: number;
  };
}

export interface TimeEntry {
  id: string;
  userId: string;
  eventId?: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId?: string;
  eventId?: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: User;
}

export interface WeeklyLog {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  activities: string;
  achievements?: string;
  challenges?: string;
  learnings?: string;
  nextGoals?: string;
  totalHours: number;
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  description?: string;
  serialNumber?: string;
  rfidTag?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignments?: EquipmentAssignment[];
}

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  userId: string;
  eventId?: string;
  eventShiftId?: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  equipment?: {
    id: string;
    name: string;
    category: EquipmentCategory;
    status: EquipmentStatus;
    serialNumber?: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  event?: {
    id: string;
    name: string;
    startDatetime: string;
    endDatetime: string;
  };
  creator?: {
    id: string;
    name: string;
  };
}

export interface ConversationParticipant {
  conversationId: string;
  userId: string;
  joinedAt: string;
  lastReadAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string | null;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachmentId?: string;
  createdAt: string;
  updatedAt?: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string | null;
  };
  attachment?: {
    id: string;
    filename: string;
    storedName: string;
    mimeType: string;
    size: number;
  };
}

export interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: ConversationParticipant[];
  messages?: Message[];
  lastMessage?: Message | null;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

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
