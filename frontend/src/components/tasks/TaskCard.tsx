import { Calendar } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { AvatarGroup } from '../ui/Avatar';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import type { TaskWithRelations } from '../../services/task.service';

interface TaskCardProps {
  task: TaskWithRelations;
  onClick: () => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isOverdue(dateString: string, status: string): boolean {
  if (status === 'completed') return false;
  return new Date(dateString) < new Date();
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const overdue = isOverdue(task.dueDate, task.status);
  const assignees = task.assignees?.map((a) => ({ name: a.user.name })) || [];

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-gray-900">{task.title}</h3>
            {task.description && (
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span className={overdue ? 'font-medium text-red-600' : ''}>
              {formatDate(task.dueDate)}
              {overdue && ' (Vencida)'}
            </span>
          </div>

          {assignees.length > 0 && <AvatarGroup users={assignees} max={3} />}
        </div>
      </CardContent>
    </Card>
  );
}
