import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { userService } from '../../services/user.service';
import type { EventWithRelations, CreateEventRequest, UpdateEventRequest } from '../../services/event.service';

const eventSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  description: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
  clientRequirements: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
  startDatetime: z.string().min(1, 'La fecha de inicio es requerida'),
  endDatetime: z.string().min(1, 'La fecha de fin es requerida'),
  assigneeIds: z.array(z.string()).optional(),
}).refine((data) => {
  if (!data.startDatetime || !data.endDatetime) return true;
  return new Date(data.endDatetime) > new Date(data.startDatetime);
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['endDatetime'],
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: EventWithRelations;
  onSubmit: (data: CreateEventRequest | UpdateEventRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function toDatetimeLocal(isoString: string): string {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function EventForm({ event, onSubmit, onCancel, isLoading }: EventFormProps) {
  const isEditing = !!event;

  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', { limit: 100 }],
    queryFn: () => userService.getAll({ limit: 100 }),
  });

  const users = usersResponse?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: event?.name || '',
      description: event?.description || '',
      clientRequirements: event?.clientRequirements || '',
      startDatetime: event?.startDatetime ? toDatetimeLocal(event.startDatetime) : '',
      endDatetime: event?.endDatetime ? toDatetimeLocal(event.endDatetime) : '',
      assigneeIds: event?.assignees?.map((a) => a.user.id) || [],
    },
  });

  const selectedAssignees = watch('assigneeIds') || [];

  const handleFormSubmit = (data: EventFormData) => {
    const submitData = {
      ...data,
      clientRequirements: data.clientRequirements || null,
      startDatetime: new Date(data.startDatetime).toISOString(),
      endDatetime: new Date(data.endDatetime).toISOString(),
      assigneeIds: data.assigneeIds || [],
    };
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
        label="Nombre del evento"
        placeholder="Nombre del evento"
        error={errors.name?.message}
        {...register('name')}
      />

      <Textarea
        label="Descripción"
        placeholder="Describe el evento..."
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="datetime-local"
          label="Fecha y hora de inicio"
          error={errors.startDatetime?.message}
          {...register('startDatetime')}
        />

        <Input
          type="datetime-local"
          label="Fecha y hora de fin"
          error={errors.endDatetime?.message}
          {...register('endDatetime')}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Asignar personal
        </label>
        <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 p-2">
          {isLoadingUsers ? (
            <p className="py-2 text-center text-sm text-gray-500">
              Cargando usuarios...
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
          {isEditing ? 'Guardar cambios' : 'Crear evento'}
        </Button>
      </div>
    </form>
  );
}
