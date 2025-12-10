import { cn } from '../../lib/utils';
import type { TaskStatus } from '../../types';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-gray-100 text-gray-800',
  },
  in_progress: {
    label: 'En progreso',
    className: 'bg-blue-100 text-blue-800',
  },
  review: {
    label: 'En revisión',
    className: 'bg-yellow-100 text-yellow-800',
  },
  completed: {
    label: 'Completada',
    className: 'bg-green-100 text-green-800',
  },
};

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function getStatusLabel(status: TaskStatus): string {
  return statusConfig[status].label;
}

export const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'review', label: 'En revisión' },
  { value: 'completed', label: 'Completada' },
];
