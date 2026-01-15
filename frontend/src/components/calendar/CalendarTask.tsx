import { cn } from '../../lib/utils';
import type { TaskWithRelations } from '../../services/task.service';
import type { TaskPriority } from '../../types';

interface CalendarTaskProps {
  task: TaskWithRelations;
  onClick: (task: TaskWithRelations) => void;
  compact?: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  high: 'bg-red-100 text-red-800 hover:bg-red-200',
  medium: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  low: 'bg-green-100 text-green-800 hover:bg-green-200',
};

export function CalendarTask({ task, onClick, compact = false }: CalendarTaskProps) {
  return (
    <button
      onClick={() => onClick(task)}
      className={cn(
        'w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors sm:px-2 sm:py-1 sm:text-xs',
        priorityColors[task.priority],
        compact ? 'truncate' : ''
      )}
    >
      <span className="truncate">{task.title}</span>
    </button>
  );
}
