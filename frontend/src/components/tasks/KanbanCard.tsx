import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, GripVertical } from 'lucide-react';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { AvatarGroup } from '../ui/Avatar';
import type { TaskWithRelations } from '../../services/task.service';

interface KanbanCardProps {
  task: TaskWithRelations;
  onClick: () => void;
  isDragDisabled?: boolean;
}

function formatDate(dateString: string): string {
  const datePart = dateString.split('T')[0];
  const dateToFormat = new Date(datePart + 'T12:00:00');
  return dateToFormat.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}

function isOverdue(dateString: string, status: string): boolean {
  if (status === 'completed') return false;
  const datePart = dateString.split('T')[0];
  const dueDate = new Date(datePart + 'T23:59:59');
  return dueDate < new Date();
}

export function KanbanCard({ task, onClick, isDragDisabled = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(task.dueDate, task.status);
  const assignees = task.assignees?.map((a) => ({ name: a.user.name, profileImage: a.user.profileImage })) || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group w-full overflow-hidden rounded-lg border bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md sm:p-3 ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-red-500' : ''
      } ${isDragDisabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
      onClick={() => {
        // Don't trigger click when dragging
        if (!isDragging) {
          onClick();
        }
      }}
    >
      {/* Drag handle and title */}
      <div className="flex items-start gap-1.5 sm:gap-2">
        {!isDragDisabled && (
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 min-h-[24px] min-w-[24px] flex-shrink-0 cursor-grab p-1 text-gray-400 opacity-100 transition-opacity active:cursor-grabbing sm:min-h-0 sm:min-w-0 sm:opacity-0 sm:group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <h4 className="min-w-0 flex-1 text-xs font-medium text-gray-900 line-clamp-2 sm:text-sm">
          {task.title}
        </h4>
      </div>

      {/* Priority badge */}
      <div className="mt-1.5 sm:mt-2">
        <TaskPriorityBadge priority={task.priority} />
      </div>

      {/* Footer: date and assignees */}
      <div className="mt-2 flex items-center justify-between gap-2 sm:mt-3">
        <div className={`flex min-w-0 items-center gap-1 text-[10px] sm:text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{formatDate(task.dueDate)}</span>
        </div>

        {assignees.length > 0 && (
          <AvatarGroup users={assignees} max={2} size="xs" />
        )}
      </div>
    </div>
  );
}
