import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { userService } from '../../services/user.service';
import { timeEntryService, type TimeEntryWithEvent } from '../../services/time-entry.service';
import { eventService } from '../../services/event.service';
import { cn } from '../../lib/utils';

const timeEntrySchema = z.object({
  userId: z.string().min(1, 'Selecciona un becario'),
  date: z.string().min(1, 'La fecha es requerida'),
  clockIn: z.string().min(1, 'La hora de entrada es requerida'),
  clockOut: z.string().min(1, 'La hora de salida es requerida'),
  eventId: z.string().optional(),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  if (data.clockIn && data.clockOut) {
    return data.clockOut > data.clockIn;
  }
  return true;
}, {
  message: 'La hora de salida debe ser después de la entrada',
  path: ['clockOut'],
});

type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

interface AddTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEntry?: TimeEntryWithEvent | null;
  preselectedUserId?: string;
}

type InputMode = 'quick' | 'manual';

const QUICK_HOURS = [1, 2, 3, 4, 5, 6, 7, 8];

export function AddTimeEntryModal({ isOpen, onClose, editingEntry, preselectedUserId }: AddTimeEntryModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingEntry;
  const [inputMode, setInputMode] = useState<InputMode>('quick');
  const [quickHours, setQuickHours] = useState<number>(4);
  const [quickStartTime, setQuickStartTime] = useState('08:00');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      userId: preselectedUserId || '',
      date: new Date().toISOString().split('T')[0],
      clockIn: '08:00',
      clockOut: '14:00',
      eventId: '',
      notes: '',
    },
  });

  // Load users (only becarios)
  const { data: usersData } = useQuery({
    queryKey: ['users', 'becarios'],
    queryFn: () => userService.getAll({ role: 'becario', isActive: true }),
    enabled: isOpen,
  });

  // Load events for dropdown
  const { data: eventsData } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => eventService.getUpcoming(),
    enabled: isOpen,
  });

  const users = usersData?.data || [];
  const events = eventsData || [];

  // Calculate clockOut based on quickHours and quickStartTime
  const calculateEndTime = (startTime: string, hours: number): string => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + hours * 60;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  // Update form values when quick mode changes
  useEffect(() => {
    if (inputMode === 'quick' && !isEditing) {
      const endTime = calculateEndTime(quickStartTime, quickHours);
      setValue('clockIn', quickStartTime);
      setValue('clockOut', endTime);
    }
  }, [inputMode, quickHours, quickStartTime, setValue, isEditing]);

  // Reset form when opening/closing or when editing entry changes
  useEffect(() => {
    if (isOpen) {
      if (editingEntry) {
        setInputMode('manual'); // Always use manual mode when editing
        const clockInDate = new Date(editingEntry.clockIn);
        const clockOutDate = editingEntry.clockOut ? new Date(editingEntry.clockOut) : null;

        reset({
          userId: editingEntry.userId,
          date: clockInDate.toISOString().split('T')[0],
          clockIn: clockInDate.toTimeString().slice(0, 5),
          clockOut: clockOutDate ? clockOutDate.toTimeString().slice(0, 5) : '14:00',
          eventId: editingEntry.eventId || '',
          notes: '',
        });
      } else {
        setInputMode('quick');
        setQuickHours(4);
        setQuickStartTime('08:00');
        reset({
          userId: preselectedUserId || '',
          date: new Date().toISOString().split('T')[0],
          clockIn: '08:00',
          clockOut: '12:00',
          eventId: '',
          notes: '',
        });
      }
    }
  }, [isOpen, editingEntry, preselectedUserId, reset]);

  const createMutation = useMutation({
    mutationFn: (data: { userId: string; clockIn: string; clockOut: string; eventId?: string | null; notes?: string | null }) =>
      timeEntryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['hours-by-user'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { clockIn?: string; clockOut?: string; eventId?: string | null; notes?: string | null } }) =>
      timeEntryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['hours-by-user'] });
      onClose();
    },
  });

  const onSubmit = (data: TimeEntryFormData) => {
    const clockIn = new Date(`${data.date}T${data.clockIn}:00`).toISOString();
    const clockOut = new Date(`${data.date}T${data.clockOut}:00`).toISOString();

    if (isEditing && editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        data: {
          clockIn,
          clockOut,
          eventId: data.eventId || null,
          notes: data.notes || null,
        },
      });
    } else {
      createMutation.mutate({
        userId: data.userId,
        clockIn,
        clockOut,
        eventId: data.eventId || null,
        notes: data.notes || null,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const selectedUserId = watch('userId');
  const selectedUser = users.find(u => u.id === selectedUserId);
  const watchedClockIn = watch('clockIn');
  const watchedClockOut = watch('clockOut');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Registro de Horas' : 'Agregar Registro de Horas'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* User Select - disabled when editing */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
            Becario *
          </label>
          <select
            {...register('userId')}
            disabled={isEditing}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:bg-gray-100 sm:py-2"
          >
            <option value="">Seleccionar becario</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          {errors.userId && (
            <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.userId.message}</p>
          )}
          {isEditing && selectedUser && (
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">Usuario: {selectedUser.name}</p>
          )}
        </div>

        {/* Date */}
        <Input
          label="Fecha *"
          type="date"
          {...register('date')}
          error={errors.date?.message}
        />

        {/* Mode Toggle - only show when not editing */}
        {!isEditing && (
          <div className="flex gap-1.5 rounded-lg bg-gray-100 p-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setInputMode('quick')}
              className={cn(
                'flex-1 rounded-md px-2 py-2.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm',
                inputMode === 'quick'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Modo rápido
            </button>
            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={cn(
                'flex-1 rounded-md px-2 py-2.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm',
                inputMode === 'manual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Hora específica
            </button>
          </div>
        )}

        {/* Quick Mode - Hour buttons */}
        {inputMode === 'quick' && !isEditing && (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-700 sm:text-sm">
              Horas a registrar *
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {QUICK_HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setQuickHours(h)}
                  className={cn(
                    'min-h-[44px] rounded-lg border-2 px-2 py-2 text-center text-sm font-semibold transition-all sm:min-h-0 sm:px-3 sm:py-3 sm:text-base',
                    quickHours === h
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {h}h
                </button>
              ))}
            </div>

            {/* Start time for quick mode */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                Hora de inicio
              </label>
              <input
                type="time"
                value={quickStartTime}
                onChange={(e) => setQuickStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:py-2"
              />
            </div>

            {/* Preview */}
            <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 p-2.5 text-xs sm:p-3 sm:text-sm">
              <Clock className="h-3.5 w-3.5 text-blue-600 sm:h-4 sm:w-4" />
              <span className="text-blue-700">
                {quickStartTime} - {calculateEndTime(quickStartTime, quickHours)} ({quickHours} horas)
              </span>
            </div>
          </div>
        )}

        {/* Manual Mode - Time inputs */}
        {(inputMode === 'manual' || isEditing) && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Hora de entrada *"
              type="time"
              {...register('clockIn')}
              error={errors.clockIn?.message}
            />
            <Input
              label="Hora de salida *"
              type="time"
              {...register('clockOut')}
              error={errors.clockOut?.message}
            />
          </div>
        )}

        {/* Duration display for manual mode */}
        {inputMode === 'manual' && watchedClockIn && watchedClockOut && watchedClockOut > watchedClockIn && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-600 sm:text-sm">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>
              Duración: {(() => {
                const [h1, m1] = watchedClockIn.split(':').map(Number);
                const [h2, m2] = watchedClockOut.split(':').map(Number);
                const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                const hours = Math.floor(diff / 60);
                const mins = diff % 60;
                return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
              })()}
            </span>
          </div>
        )}

        {/* Event Select */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
            Evento relacionado (opcional)
          </label>
          <select
            {...register('eventId')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:py-2"
          >
            <option value="">Sin evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
            Notas (opcional)
          </label>
          <textarea
            {...register('notes')}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:py-2"
            placeholder="Descripción de las actividades realizadas..."
          />
          {errors.notes && (
            <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.notes.message}</p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 sm:p-3 sm:text-sm">
            {error instanceof Error ? error.message : 'Error al guardar el registro'}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
            {isEditing ? 'Guardar cambios' : 'Agregar registro'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
