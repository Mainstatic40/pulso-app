import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Sun, Sunset, Clock, Camera } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { AvatarGroup } from '../ui/Avatar';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { equipmentAssignmentService } from '../../services/equipment-assignment.service';
import type { TaskWithRelations } from '../../services/task.service';
import type { TaskShift, EquipmentCategory, EquipmentAssignment } from '../../types';

const shiftConfig: Record<TaskShift, { label: string; icon: typeof Sun; bgColor: string; textColor: string }> = {
  morning: { label: 'Mañana', icon: Sun, bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  afternoon: { label: 'Tarde', icon: Sunset, bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  both: { label: 'Mañana y Tarde', icon: Clock, bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
};

const categoryConfig: Record<EquipmentCategory, { label: string; color: string }> = {
  camera: { label: 'Cámara', color: 'bg-blue-100 text-blue-800' },
  lens: { label: 'Lente', color: 'bg-purple-100 text-purple-800' },
  adapter: { label: 'Adaptador', color: 'bg-orange-100 text-orange-800' },
  sd_card: { label: 'SD', color: 'bg-green-100 text-green-800' },
};



interface TaskCardProps {
  task: TaskWithRelations;
  onClick: () => void;
}

function formatDate(dateString: string): string {
  // Fix timezone issue: extract just the date part (YYYY-MM-DD) and use noon to avoid UTC shift
  const datePart = dateString.split('T')[0];
  const dateToFormat = new Date(datePart + 'T12:00:00');

  return dateToFormat.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isOverdue(dateString: string, status: string): boolean {
  if (status === 'completed') return false;
  // Fix timezone issue: extract date part and compare at end of day local time
  const datePart = dateString.split('T')[0];
  const dueDate = new Date(datePart + 'T23:59:59');
  return dueDate < new Date();
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const overdue = isOverdue(task.dueDate, task.status);
  const assignees = task.assignees?.map((a) => ({ name: a.user.name })) || [];

  // Fetch equipment assignments for this task (no active filter - we filter by task title)
  const { data: assignmentsData } = useQuery({
    queryKey: ['equipment-assignments', 'all'],
    queryFn: () => equipmentAssignmentService.getAll({ limit: 500 }),
    staleTime: 30000, // Cache for 30 seconds to avoid too many requests
  });

  // Filter and group equipment for this task
  const taskEquipment = useMemo(() => {
    if (!assignmentsData?.data) return [];

    const taskNotePrefix = `Tarea: ${task.title}`;
    const taskAssignments = assignmentsData.data.filter(
      (a: EquipmentAssignment) => a.notes?.startsWith(taskNotePrefix)
    );

    // Get unique equipment items
    const equipmentMap = new Map<string, { id: string; name: string; category: EquipmentCategory }>();
    taskAssignments.forEach((a: EquipmentAssignment) => {
      if (a.equipment && !equipmentMap.has(a.equipment.id)) {
        equipmentMap.set(a.equipment.id, {
          id: a.equipment.id,
          name: a.equipment.name,
          category: a.equipment.category,
        });
      }
    });

    return Array.from(equipmentMap.values());
  }, [assignmentsData, task.title]);

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
          {task.shift && shiftConfig[task.shift as TaskShift] && (() => {
            const config = shiftConfig[task.shift as TaskShift];
            const ShiftIcon = config.icon;
            return (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.bgColor} ${config.textColor}`}
              >
                <ShiftIcon className="h-3 w-3" />
                {config.label}
              </span>
            );
          })()}
        </div>

        {/* Equipment assigned to this task */}
        {taskEquipment.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <Camera className="h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {taskEquipment.map((eq) => {
                const config = categoryConfig[eq.category];
                return (
                  <span
                    key={eq.id}
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}
                    title={eq.name}
                  >
                    {eq.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

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
