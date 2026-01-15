import { Link } from 'react-router-dom';
import { CheckSquare, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { cn } from '../../lib/utils';
import type { TaskWithRelations } from '../../services/task.service';

const priorityConfig = {
  high: { label: 'Alta', dot: 'bg-red-500' },
  medium: { label: 'Media', dot: 'bg-yellow-500' },
  low: { label: 'Baja', dot: 'bg-green-500' },
} as const;

function formatDueDate(dateValue: string | Date | null | undefined): { text: string; isUrgent: boolean } {
  if (!dateValue) {
    return { text: 'Sin fecha', isUrgent: false };
  }

  // Handle both string and Date objects
  let dueDate: Date;
  if (typeof dateValue === 'string') {
    // Extract just the date part (YYYY-MM-DD) to avoid timezone issues
    const datePart = dateValue.split('T')[0];
    dueDate = new Date(datePart + 'T12:00:00');
  } else {
    dueDate = new Date(dateValue);
  }

  // Check for invalid date
  if (isNaN(dueDate.getTime())) {
    return { text: 'Fecha inválida', isUrgent: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Vencida hace ${Math.abs(diffDays)} día${Math.abs(diffDays) > 1 ? 's' : ''}`, isUrgent: true };
  } else if (diffDays === 0) {
    return { text: 'Vence hoy', isUrgent: true };
  } else if (diffDays === 1) {
    return { text: 'Vence mañana', isUrgent: true };
  } else if (diffDays <= 3) {
    return { text: `Vence en ${diffDays} días`, isUrgent: false };
  } else {
    return {
      text: `Vence: ${dueDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`,
      isUrgent: false
    };
  }
}

interface PendingTasksListProps {
  tasks: TaskWithRelations[];
  isLoading?: boolean;
  isBecario?: boolean;
  maxItems?: number;
}

export function PendingTasksList({
  tasks,
  isLoading = false,
  isBecario = true,
  maxItems = 5
}: PendingTasksListProps) {
  const displayTasks = tasks.slice(0, maxItems);

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <CheckSquare className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <span className="truncate">{isBecario ? 'Mis Tareas Pendientes' : 'Tareas Pendientes'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <Spinner />
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <CheckSquare className="mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">Sin tareas pendientes</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-2">
              {displayTasks.map((task) => {
                const dueInfo = formatDueDate(task.dueDate);
                const priority = priorityConfig[task.priority];

                return (
                  <Link
                    key={task.id}
                    to={`/tasks?taskId=${task.id}`}
                    className="group block rounded-lg border border-gray-200 p-3 transition-all hover:border-gray-300 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', priority.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900 group-hover:text-blue-600">
                          {task.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          {dueInfo.isUrgent && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span className={cn(
                            dueInfo.isUrgent ? 'font-medium text-red-600' : 'text-gray-500'
                          )}>
                            {dueInfo.text}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {tasks.length > maxItems && (
              <Link
                to="/tasks"
                className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver todas ({tasks.length})
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
