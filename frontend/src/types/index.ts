export type UserRole = 'admin' | 'supervisor' | 'becario';

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskShift = 'morning' | 'afternoon' | 'both';

export type EquipmentCategory = 'camera' | 'lens' | 'adapter' | 'sd_card';

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance';

export type EventType = 'civic' | 'church' | 'yearbook' | 'congress';

export interface User {
  id: string;
  name: string;
  email: string;
  rfidTag?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  };
  assignees?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  days?: EventDay[];
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
  taskId: string;
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
