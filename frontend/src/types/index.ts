export type UserRole = 'admin' | 'supervisor' | 'becario';

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed';

export type TaskPriority = 'high' | 'medium' | 'low';

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
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignees?: User[];
  comments?: Comment[];
}

export interface Event {
  id: string;
  name: string;
  description: string;
  clientRequirements?: string;
  startDatetime: string;
  endDatetime: string;
  googleCalendarId?: string;
  createdBy: string;
  createdAt: string;
  assignees?: User[];
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
