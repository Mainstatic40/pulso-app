import { cn } from '../../lib/utils';
import type { TaskPriority } from '../../types';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  high: {
    label: 'Alta',
    className: 'bg-red-100 text-red-800',
  },
  medium: {
    label: 'Media',
    className: 'bg-yellow-100 text-yellow-800',
  },
  low: {
    label: 'Baja',
    className: 'bg-green-100 text-green-800',
  },
};

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  const config = priorityConfig[priority];

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

export function getPriorityLabel(priority: TaskPriority): string {
  return priorityConfig[priority].label;
}

export const priorityOptions = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
];
