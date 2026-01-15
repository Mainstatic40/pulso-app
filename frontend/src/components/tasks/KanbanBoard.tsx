import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanColumn, columnConfigs } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { taskService, type TaskWithRelations } from '../../services/task.service';
import { useAuthContext } from '../../stores/auth.store.tsx';
import type { TaskStatus } from '../../types';

interface KanbanBoardProps {
  tasks: TaskWithRelations[];
  onTaskClick: (taskId: string) => void;
}

export function KanbanBoard({ tasks, onTaskClick }: KanbanBoardProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);

  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      taskService.updateStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update
      queryClient.setQueryData(['tasks'], (old: { data: TaskWithRelations[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((task) =>
            task.id === taskId ? { ...task, status } : task
          ),
        };
      });

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithRelations[]> = {
      pending: [],
      in_progress: [],
      review: [],
      completed: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  // Check if user can drag this task
  const canDragTask = (task: TaskWithRelations): boolean => {
    if (isAdminOrSupervisor) return true;
    // Becario can only drag their own assigned tasks
    const isAssigned = task.assignees?.some((a) => a.user.id === user?.id);
    return !!isAssigned;
  };

  // Check if move is allowed
  const canMoveToStatus = (task: TaskWithRelations, newStatus: TaskStatus): boolean => {
    if (isAdminOrSupervisor) return true;

    // Becarios cannot move directly to completed
    if (newStatus === 'completed') return false;

    // Check if user is assigned to this task
    const isAssigned = task.assignees?.some((a) => a.user.id === user?.id);
    return !!isAssigned;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Find the task
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Check if status actually changed
    if (task.status === newStatus) return;

    // Check if move is allowed
    if (!canMoveToStatus(task, newStatus)) {
      // Show error or just ignore
      return;
    }

    // Update status
    updateStatusMutation.mutate({ taskId, status: newStatus });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-3 sm:min-w-0 sm:gap-4">
          {columnConfigs.map((config) => (
            <KanbanColumn
              key={config.id}
              config={config}
              tasks={tasksByStatus[config.id]}
              onTaskClick={onTaskClick}
              isDragDisabled={(task) => !canDragTask(task)}
            />
          ))}
        </div>
      </div>

      {/* Drag Overlay - shows the card being dragged */}
      <DragOverlay>
        {activeTask && (
          <div className="rotate-3 scale-105">
            <KanbanCard
              task={activeTask}
              onClick={() => {}}
              isDragDisabled
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
