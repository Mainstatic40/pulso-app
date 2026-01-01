import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type { TaskWithRelations } from '../../services/task.service';
import type { TaskStatus } from '../../types';

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
}

export const columnConfigs: ColumnConfig[] = [
  { id: 'pending', title: 'Pendiente', color: 'bg-gray-500', bgColor: 'bg-gray-50' },
  { id: 'in_progress', title: 'En Progreso', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  { id: 'review', title: 'En Revisión', color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
  { id: 'completed', title: 'Completado', color: 'bg-green-500', bgColor: 'bg-green-50' },
];

interface KanbanColumnProps {
  config: ColumnConfig;
  tasks: TaskWithRelations[];
  onTaskClick: (taskId: string) => void;
  isDragDisabled?: (task: TaskWithRelations) => boolean;
}

export function KanbanColumn({ config, tasks, onTaskClick, isDragDisabled }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: config.id,
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="flex h-full min-w-[280px] max-w-[320px] flex-1 flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${config.color}`} />
        <h3 className="font-semibold text-gray-700">{config.title}</h3>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
          {tasks.length}
        </span>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto rounded-lg border-2 border-dashed p-2 transition-colors ${
          isOver
            ? 'border-red-400 bg-red-50'
            : `border-gray-200 ${config.bgColor}`
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-sm text-gray-400">
                Sin tareas
              </div>
            ) : (
              tasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task.id)}
                  isDragDisabled={isDragDisabled ? isDragDisabled(task) : false}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
