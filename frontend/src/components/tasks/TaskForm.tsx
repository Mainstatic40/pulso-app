import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Camera, Circle, Disc, CreditCard } from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { priorityOptions } from './TaskPriorityBadge';
import { userService } from '../../services/user.service';
import { equipmentService } from '../../services/equipment.service';
import { useAuthContext } from '../../stores/auth.store';
import type { TaskWithRelations, CreateTaskRequest, UpdateTaskRequest } from '../../services/task.service';
import type { Equipment, EquipmentCategory } from '../../types';

const taskSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  description: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
  clientRequirements: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
  priority: z.enum(['high', 'medium', 'low']),
  dueDate: z.string().min(1, 'La fecha límite es requerida'),
  assigneeIds: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export type UserEquipmentAssignment = {
  cameraId?: string;
  lensId?: string;
  adapterId?: string;
  sdCardId?: string;
};

export type EquipmentAssignments = Record<string, UserEquipmentAssignment>;

interface TaskFormProps {
  task?: TaskWithRelations;
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest, equipmentAssignments?: EquipmentAssignments) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const categoryConfig: Record<EquipmentCategory, { label: string; icon: React.ReactNode; key: keyof UserEquipmentAssignment }> = {
  camera: { label: 'Cámara', icon: <Camera className="h-4 w-4" />, key: 'cameraId' },
  lens: { label: 'Lente', icon: <Circle className="h-4 w-4" />, key: 'lensId' },
  adapter: { label: 'Adaptador', icon: <Disc className="h-4 w-4" />, key: 'adapterId' },
  sd_card: { label: 'SD', icon: <CreditCard className="h-4 w-4" />, key: 'sdCardId' },
};

export function TaskForm({ task, onSubmit, onCancel, isLoading }: TaskFormProps) {
  const { user } = useAuthContext();
  const isEditing = !!task;
  const canAssignEquipment = user?.role === 'admin' || user?.role === 'supervisor';

  const [equipmentAssignments, setEquipmentAssignments] = useState<EquipmentAssignments>({});

  const { data: usersResponse, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['users', { limit: 100 }],
    queryFn: () => userService.getAll({ limit: 100 }),
  });

  const { data: equipmentResponse, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['equipment', { status: 'available' }],
    queryFn: () => equipmentService.getAll({ status: 'available', limit: 100 }),
    enabled: canAssignEquipment,
  });

  const users = usersResponse?.data || [];
  const availableEquipment = equipmentResponse?.data || [];

  // Group equipment by category
  const equipmentByCategory = useMemo(() => {
    const grouped: Record<EquipmentCategory, Equipment[]> = {
      camera: [],
      lens: [],
      adapter: [],
      sd_card: [],
    };

    availableEquipment.forEach((eq) => {
      if (eq.status === 'available' && eq.isActive) {
        grouped[eq.category].push(eq);
      }
    });

    return grouped;
  }, [availableEquipment]);

  // Get already selected equipment IDs (across all users)
  const selectedEquipmentIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(equipmentAssignments).forEach((assignment) => {
      if (assignment.cameraId) ids.add(assignment.cameraId);
      if (assignment.lensId) ids.add(assignment.lensId);
      if (assignment.adapterId) ids.add(assignment.adapterId);
      if (assignment.sdCardId) ids.add(assignment.sdCardId);
    });
    return ids;
  }, [equipmentAssignments]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      clientRequirements: task?.clientRequirements || '',
      priority: task?.priority || 'medium',
      dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
      assigneeIds: task?.assignees?.map((a) => a.user.id) || [],
    },
  });

  const selectedAssignees = watch('assigneeIds') || [];

  const handleFormSubmit = (data: TaskFormData) => {
    const submitData = {
      ...data,
      clientRequirements: data.clientRequirements || null,
      assigneeIds: data.assigneeIds || [],
    };

    // Filter equipment assignments to only include assigned users
    const filteredAssignments: EquipmentAssignments = {};
    selectedAssignees.forEach((userId) => {
      if (equipmentAssignments[userId]) {
        const assignment = equipmentAssignments[userId];
        // Only include if at least one equipment is selected
        if (assignment.cameraId || assignment.lensId || assignment.adapterId || assignment.sdCardId) {
          filteredAssignments[userId] = assignment;
        }
      }
    });

    onSubmit(submitData, Object.keys(filteredAssignments).length > 0 ? filteredAssignments : undefined);
  };

  const toggleAssignee = (userId: string) => {
    const current = selectedAssignees;
    if (current.includes(userId)) {
      setValue(
        'assigneeIds',
        current.filter((id) => id !== userId)
      );
      // Clear equipment assignments for removed user
      setEquipmentAssignments((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } else {
      setValue('assigneeIds', [...current, userId]);
    }
  };

  const handleEquipmentChange = (userId: string, category: EquipmentCategory, equipmentId: string) => {
    const key = categoryConfig[category].key;
    setEquipmentAssignments((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [key]: equipmentId || undefined,
      },
    }));
  };

  const getAvailableOptionsForCategory = (category: EquipmentCategory, currentUserId: string) => {
    const categoryEquipment = equipmentByCategory[category];
    const currentUserAssignment = equipmentAssignments[currentUserId]?.[categoryConfig[category].key];

    return [
      { value: '', label: 'Sin asignar' },
      ...categoryEquipment
        .filter((eq) => !selectedEquipmentIds.has(eq.id) || eq.id === currentUserAssignment)
        .map((eq) => ({
          value: eq.id,
          label: eq.serialNumber ? `${eq.name} (${eq.serialNumber})` : eq.name,
        })),
    ];
  };

  const assignedUsers = users.filter((u) => selectedAssignees.includes(u.id));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-6">
      <Input
        label="Título"
        placeholder="Título de la tarea"
        error={errors.title?.message}
        {...register('title')}
      />

      <Textarea
        label="Descripción"
        placeholder="Describe la tarea..."
        rows={3}
        error={errors.description?.message}
        {...register('description')}
      />

      <Textarea
        label="Requisitos del cliente (opcional)"
        placeholder="Requisitos específicos del cliente..."
        rows={3}
        error={errors.clientRequirements?.message}
        {...register('clientRequirements')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Prioridad"
          options={priorityOptions}
          error={errors.priority?.message}
          {...register('priority')}
        />

        <Input
          type="date"
          label="Fecha límite"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Asignar a
        </label>
        <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 p-2">
          {isLoadingUsers ? (
            <p className="py-2 text-center text-sm text-gray-500">
              Cargando usuarios...
            </p>
          ) : usersError ? (
            <p className="py-2 text-center text-sm text-red-500">
              Error al cargar usuarios
            </p>
          ) : users.length === 0 ? (
            <p className="py-2 text-center text-sm text-gray-500">
              No hay usuarios disponibles
            </p>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedAssignees.includes(user.id)}
                    onChange={() => toggleAssignee(user.id)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-500">({user.email})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Equipment Assignment Section */}
      {canAssignEquipment && assignedUsers.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Asignar equipos
          </label>
          {isLoadingEquipment ? (
            <p className="py-2 text-center text-sm text-gray-500">
              Cargando equipos...
            </p>
          ) : (
            <div className="space-y-4 rounded-lg border border-gray-300 p-4">
              {assignedUsers.map((assignedUser) => (
                <div key={assignedUser.id} className="rounded-lg bg-gray-50 p-3">
                  <h4 className="mb-3 font-medium text-gray-900">{assignedUser.name}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(categoryConfig) as EquipmentCategory[]).map((category) => {
                      const config = categoryConfig[category];
                      const options = getAvailableOptionsForCategory(category, assignedUser.id);
                      const currentValue = equipmentAssignments[assignedUser.id]?.[config.key] || '';

                      return (
                        <div key={category}>
                          <div className="mb-1 flex items-center gap-1 text-xs text-gray-600">
                            {config.icon}
                            <span>{config.label}</span>
                          </div>
                          <Select
                            value={currentValue}
                            onChange={(e) => handleEquipmentChange(assignedUser.id, category, e.target.value)}
                            options={options}
                            disabled={options.length <= 1}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Guardar cambios' : 'Crear tarea'}
        </Button>
      </div>
    </form>
  );
}
