import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { priorityOptions } from './TaskPriorityBadge';
import { userService } from '../../services/user.service';
import type { TaskWithRelations, CreateTaskRequest, UpdateTaskRequest } from '../../services/task.service';

const taskSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  description: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
  clientRequirements: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
  priority: z.enum(['high', 'medium', 'low']),
  dueDate: z.string().min(1, 'La fecha límite es requerida'),
  assigneeIds: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: TaskWithRelations;
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TaskForm({ task, onSubmit, onCancel, isLoading }: TaskFormProps) {
  const isEditing = !!task;

  const { data: usersResponse, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['users', { limit: 100 }],
    queryFn: async () => {
      console.log('[TaskForm] Fetching users...');
      const response = await userService.getAll({ limit: 100 });
      console.log('[TaskForm] Users response:', response);
      return response;
    },
  });

  const users = usersResponse?.data || [];

  // Debug: log users and any errors
  console.log('[TaskForm] Users loaded:', users.length, 'users, error:', usersError);

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
    console.log('[TaskForm] Submitting task:', submitData);
    onSubmit(submitData);
  };

  const toggleAssignee = (userId: string) => {
    const current = selectedAssignees;
    if (current.includes(userId)) {
      setValue(
        'assigneeIds',
        current.filter((id) => id !== userId)
      );
    } else {
      setValue('assigneeIds', [...current, userId]);
    }
  };

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
