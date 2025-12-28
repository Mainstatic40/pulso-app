import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Camera, Circle, Disc, CreditCard, Sun, Sunset, User } from 'lucide-react';
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
  executionDate: z.string().optional(),
  shift: z.enum(['morning', 'afternoon', 'both']).optional().nullable(),
  morningStartTime: z.string().optional(),
  morningEndTime: z.string().optional(),
  afternoonStartTime: z.string().optional(),
  afternoonEndTime: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export type UserEquipmentAssignment = {
  cameraId?: string;
  lensId?: string;
  adapterId?: string;
  sdCardId?: string;
};

// Equipment assignments per user per shift
export type ShiftEquipmentAssignments = {
  morning?: UserEquipmentAssignment;
  afternoon?: UserEquipmentAssignment;
};

export type EquipmentAssignments = Record<string, ShiftEquipmentAssignments>;

export interface ExistingEquipmentAssignment {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCategory: EquipmentCategory;
  userId: string;
  userName: string;
  shift: 'morning' | 'afternoon';
  startTime: string;
  endTime: string | null;
}

interface TaskFormProps {
  task?: TaskWithRelations;
  existingAssignments?: ExistingEquipmentAssignment[];
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

const shiftOptions = [
  { value: '', label: 'Sin turno' },
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'both', label: 'Ambos' },
];

const DEFAULT_TIMES = {
  morningStart: '08:00',
  morningEnd: '12:00',
  afternoonStart: '14:30',
  afternoonEnd: '18:30',
};

export function TaskForm({ task, existingAssignments, onSubmit, onCancel, isLoading }: TaskFormProps) {
  const { user } = useAuthContext();
  const isEditing = !!task;
  const canAssignEquipment = user?.role === 'admin' || user?.role === 'supervisor';

  const [equipmentAssignments, setEquipmentAssignments] = useState<EquipmentAssignments>({});
  const [existingEquipmentLoaded, setExistingEquipmentLoaded] = useState(false);

  const { data: usersResponse, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['users', { limit: 100 }],
    queryFn: () => userService.getAll({ limit: 100 }),
  });

  const users = usersResponse?.data || [];

  // Get already selected equipment IDs (across all users and shifts)
  const selectedEquipmentIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(equipmentAssignments).forEach((userAssignments) => {
      ['morning', 'afternoon'].forEach((shiftKey) => {
        const assignment = userAssignments[shiftKey as keyof ShiftEquipmentAssignments];
        if (assignment) {
          if (assignment.cameraId) ids.add(assignment.cameraId);
          if (assignment.lensId) ids.add(assignment.lensId);
          if (assignment.adapterId) ids.add(assignment.adapterId);
          if (assignment.sdCardId) ids.add(assignment.sdCardId);
        }
      });
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
      executionDate: task?.executionDate ? task.executionDate.split('T')[0] : '',
      shift: task?.shift || null,
      morningStartTime: task?.morningStartTime || DEFAULT_TIMES.morningStart,
      morningEndTime: task?.morningEndTime || DEFAULT_TIMES.morningEnd,
      afternoonStartTime: task?.afternoonStartTime || DEFAULT_TIMES.afternoonStart,
      afternoonEndTime: task?.afternoonEndTime || DEFAULT_TIMES.afternoonEnd,
      assigneeIds: task?.assignees?.map((a) => a.user.id) || [],
    },
  });

  const selectedAssignees = watch('assigneeIds') || [];
  const selectedShift = watch('shift');
  const executionDate = watch('executionDate');
  const morningStart = watch('morningStartTime');
  const morningEnd = watch('morningEndTime');
  const afternoonStart = watch('afternoonStartTime');
  const afternoonEnd = watch('afternoonEndTime');

  // Calculate time ranges for equipment availability query
  const shiftTimeRanges = useMemo(() => {
    if (!executionDate || !selectedShift) return null;

    const ranges: { morning?: { start: string; end: string }; afternoon?: { start: string; end: string } } = {};

    if (selectedShift === 'morning' || selectedShift === 'both') {
      const start = morningStart || DEFAULT_TIMES.morningStart;
      const end = morningEnd || DEFAULT_TIMES.morningEnd;
      ranges.morning = {
        start: `${executionDate}T${start}:00`,
        end: `${executionDate}T${end}:00`,
      };
    }

    if (selectedShift === 'afternoon' || selectedShift === 'both') {
      const start = afternoonStart || DEFAULT_TIMES.afternoonStart;
      const end = afternoonEnd || DEFAULT_TIMES.afternoonEnd;
      ranges.afternoon = {
        start: `${executionDate}T${start}:00`,
        end: `${executionDate}T${end}:00`,
      };
    }

    return ranges;
  }, [executionDate, selectedShift, morningStart, morningEnd, afternoonStart, afternoonEnd]);

  // Query available equipment for morning shift
  const { data: morningEquipment, isLoading: isLoadingMorningEquipment } = useQuery({
    queryKey: ['equipment-available', 'morning', shiftTimeRanges?.morning],
    queryFn: () => equipmentService.getAvailable({
      startTime: shiftTimeRanges!.morning!.start,
      endTime: shiftTimeRanges!.morning!.end,
    }),
    enabled: canAssignEquipment && !!shiftTimeRanges?.morning,
  });

  // Query available equipment for afternoon shift
  const { data: afternoonEquipment, isLoading: isLoadingAfternoonEquipment } = useQuery({
    queryKey: ['equipment-available', 'afternoon', shiftTimeRanges?.afternoon],
    queryFn: () => equipmentService.getAvailable({
      startTime: shiftTimeRanges!.afternoon!.start,
      endTime: shiftTimeRanges!.afternoon!.end,
    }),
    enabled: canAssignEquipment && !!shiftTimeRanges?.afternoon,
  });

  const isLoadingEquipment = isLoadingMorningEquipment || isLoadingAfternoonEquipment;

  // Group equipment by category per shift
  const equipmentByShiftAndCategory = useMemo(() => {
    const groupByCategory = (equipment: Equipment[] | undefined): Record<EquipmentCategory, Equipment[]> => {
      const grouped: Record<EquipmentCategory, Equipment[]> = {
        camera: [],
        lens: [],
        adapter: [],
        sd_card: [],
      };

      (equipment || []).forEach((eq) => {
        if (eq.isActive) {
          grouped[eq.category].push(eq);
        }
      });

      return grouped;
    };

    return {
      morning: groupByCategory(morningEquipment),
      afternoon: groupByCategory(afternoonEquipment),
    };
  }, [morningEquipment, afternoonEquipment]);

  // Set default times when shift is selected
  useEffect(() => {
    if (selectedShift && !task) {
      if (selectedShift === 'morning' || selectedShift === 'both') {
        setValue('morningStartTime', DEFAULT_TIMES.morningStart);
        setValue('morningEndTime', DEFAULT_TIMES.morningEnd);
      }
      if (selectedShift === 'afternoon' || selectedShift === 'both') {
        setValue('afternoonStartTime', DEFAULT_TIMES.afternoonStart);
        setValue('afternoonEndTime', DEFAULT_TIMES.afternoonEnd);
      }
    }
  }, [selectedShift, setValue, task]);

  // Load existing equipment assignments when editing
  useEffect(() => {
    if (isEditing && existingAssignments && existingAssignments.length > 0 && !existingEquipmentLoaded) {
      console.log('[TaskForm] Loading existing assignments:', existingAssignments);

      const loadedAssignments: EquipmentAssignments = {};

      existingAssignments.forEach((assignment) => {
        const userId = assignment.userId;
        const shiftKey = assignment.shift;
        const categoryKey = categoryConfig[assignment.equipmentCategory]?.key;

        if (!categoryKey) {
          console.warn('[TaskForm] Unknown category:', assignment.equipmentCategory);
          return;
        }

        if (!loadedAssignments[userId]) {
          loadedAssignments[userId] = {};
        }

        if (!loadedAssignments[userId][shiftKey]) {
          loadedAssignments[userId][shiftKey] = {};
        }

        loadedAssignments[userId][shiftKey]![categoryKey] = assignment.equipmentId;
      });

      console.log('[TaskForm] Loaded equipment assignments:', loadedAssignments);
      setEquipmentAssignments(loadedAssignments);
      setExistingEquipmentLoaded(true);
    }
  }, [isEditing, existingAssignments, existingEquipmentLoaded]);

  // Debug: Log equipment availability queries
  useEffect(() => {
    if (shiftTimeRanges) {
      console.log('[TaskForm] Equipment availability query params:', {
        morningRange: shiftTimeRanges.morning,
        afternoonRange: shiftTimeRanges.afternoon,
      });
    }
  }, [shiftTimeRanges]);

  useEffect(() => {
    console.log('[TaskForm] Morning equipment available:', morningEquipment);
    console.log('[TaskForm] Afternoon equipment available:', afternoonEquipment);
    console.log('[TaskForm] Equipment by shift and category:', equipmentByShiftAndCategory);
  }, [morningEquipment, afternoonEquipment, equipmentByShiftAndCategory]);

  const handleFormSubmit = (data: TaskFormData) => {
    const submitData: CreateTaskRequest | UpdateTaskRequest = {
      ...data,
      clientRequirements: data.clientRequirements || null,
      assigneeIds: data.assigneeIds || [],
      executionDate: data.executionDate || null,
      shift: data.shift || null,
      morningStartTime: (data.shift === 'morning' || data.shift === 'both') ? data.morningStartTime : null,
      morningEndTime: (data.shift === 'morning' || data.shift === 'both') ? data.morningEndTime : null,
      afternoonStartTime: (data.shift === 'afternoon' || data.shift === 'both') ? data.afternoonStartTime : null,
      afternoonEndTime: (data.shift === 'afternoon' || data.shift === 'both') ? data.afternoonEndTime : null,
    };

    // Filter equipment assignments to only include assigned users and relevant shifts
    const filteredAssignments: EquipmentAssignments = {};
    selectedAssignees.forEach((userId) => {
      if (equipmentAssignments[userId]) {
        const userAssignments = equipmentAssignments[userId];
        const filteredUserAssignments: ShiftEquipmentAssignments = {};

        if ((data.shift === 'morning' || data.shift === 'both') && userAssignments.morning) {
          const assignment = userAssignments.morning;
          if (assignment.cameraId || assignment.lensId || assignment.adapterId || assignment.sdCardId) {
            filteredUserAssignments.morning = assignment;
          }
        }

        if ((data.shift === 'afternoon' || data.shift === 'both') && userAssignments.afternoon) {
          const assignment = userAssignments.afternoon;
          if (assignment.cameraId || assignment.lensId || assignment.adapterId || assignment.sdCardId) {
            filteredUserAssignments.afternoon = assignment;
          }
        }

        if (Object.keys(filteredUserAssignments).length > 0) {
          filteredAssignments[userId] = filteredUserAssignments;
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

  const handleEquipmentChange = (
    userId: string,
    shiftKey: 'morning' | 'afternoon',
    category: EquipmentCategory,
    equipmentId: string
  ) => {
    const key = categoryConfig[category].key;
    setEquipmentAssignments((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [shiftKey]: {
          ...prev[userId]?.[shiftKey],
          [key]: equipmentId || undefined,
        },
      },
    }));
  };

  const getAvailableOptionsForCategory = (
    category: EquipmentCategory,
    currentUserId: string,
    shiftKey: 'morning' | 'afternoon'
  ) => {
    const categoryEquipment = equipmentByShiftAndCategory[shiftKey][category];
    const currentUserAssignment = equipmentAssignments[currentUserId]?.[shiftKey]?.[categoryConfig[category].key];

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
  const showMorningShift = selectedShift === 'morning' || selectedShift === 'both';
  const showAfternoonShift = selectedShift === 'afternoon' || selectedShift === 'both';

  const morningStartTime = watch('morningStartTime');
  const morningEndTime = watch('morningEndTime');
  const afternoonStartTime = watch('afternoonStartTime');
  const afternoonEndTime = watch('afternoonEndTime');

  const renderEquipmentSelects = (
    assignedUser: { id: string; name: string },
    shiftKey: 'morning' | 'afternoon',
    shiftLabel: string,
    startTime: string,
    endTime: string
  ) => (
    <div key={`${assignedUser.id}-${shiftKey}`} className="rounded-lg bg-white border border-gray-200 p-3">
      <div className="mb-3 flex items-center gap-2">
        {shiftKey === 'morning' ? (
          <Sun className="h-4 w-4 text-yellow-500" />
        ) : (
          <Sunset className="h-4 w-4 text-orange-500" />
        )}
        <span className="text-sm font-medium text-gray-700">
          {shiftLabel} ({startTime} - {endTime})
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(categoryConfig) as EquipmentCategory[]).map((category) => {
          const config = categoryConfig[category];
          const options = getAvailableOptionsForCategory(category, assignedUser.id, shiftKey);
          const currentValue = equipmentAssignments[assignedUser.id]?.[shiftKey]?.[config.key] || '';

          return (
            <div key={category}>
              <div className="mb-1 flex items-center gap-1 text-xs text-gray-600">
                {config.icon}
                <span>{config.label}</span>
              </div>
              <Select
                value={currentValue}
                onChange={(e) => handleEquipmentChange(assignedUser.id, shiftKey, category, e.target.value)}
                options={options}
                disabled={options.length <= 1}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

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

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Fecha de realización"
          {...register('executionDate')}
        />

        <Select
          label="Turno"
          options={shiftOptions}
          {...register('shift')}
        />
      </div>

      {/* Time fields based on shift */}
      {showMorningShift && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sun className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Turno Mañana</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="time"
              label="Hora inicio"
              {...register('morningStartTime')}
            />
            <Input
              type="time"
              label="Hora fin"
              {...register('morningEndTime')}
            />
          </div>
        </div>
      )}

      {showAfternoonShift && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sunset className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-800">Turno Tarde</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="time"
              label="Hora inicio"
              {...register('afternoonStartTime')}
            />
            <Input
              type="time"
              label="Hora fin"
              {...register('afternoonEndTime')}
            />
          </div>
        </div>
      )}

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

      {/* Equipment Assignment Section - Only show if users assigned AND shift selected AND execution date set */}
      {canAssignEquipment && assignedUsers.length > 0 && selectedShift && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Asignar equipos por turno
          </label>
          {!executionDate ? (
            <p className="py-4 text-center text-sm text-gray-500 rounded-lg border border-gray-200 bg-gray-50">
              Selecciona una fecha de realización para ver equipos disponibles
            </p>
          ) : isLoadingEquipment ? (
            <p className="py-2 text-center text-sm text-gray-500">
              Cargando equipos disponibles...
            </p>
          ) : (
            <div className="space-y-4 rounded-lg border border-gray-300 p-4">
              {assignedUsers.map((assignedUser) => (
                <div key={assignedUser.id} className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <h4 className="font-medium text-gray-900">{assignedUser.name}</h4>
                  </div>
                  <div className="space-y-3">
                    {showMorningShift && renderEquipmentSelects(
                      assignedUser,
                      'morning',
                      'Mañana',
                      morningStartTime || DEFAULT_TIMES.morningStart,
                      morningEndTime || DEFAULT_TIMES.morningEnd
                    )}
                    {showAfternoonShift && renderEquipmentSelects(
                      assignedUser,
                      'afternoon',
                      'Tarde',
                      afternoonStartTime || DEFAULT_TIMES.afternoonStart,
                      afternoonEndTime || DEFAULT_TIMES.afternoonEnd
                    )}
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
