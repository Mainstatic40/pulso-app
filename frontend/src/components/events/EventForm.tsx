import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Camera, Circle, Disc, CreditCard, Plus, Trash2, AlertTriangle, User } from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { userService } from '../../services/user.service';
import { equipmentService } from '../../services/equipment.service';
import { useAuthContext } from '../../stores/auth.store';
import type { EventWithRelations, CreateEventRequest, UpdateEventRequest } from '../../services/event.service';
import type { Equipment, EquipmentCategory, EquipmentAssignment } from '../../types';

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

// Shift-based types
export interface EquipmentShift {
  odrenequipoId: string;
  odrenHoraInicio: string; // HH:mm
  HoraFin: string; // HH:mm
  cameraId?: string;
  lensId?: string;
  adapterId?: string;
  sdCardId?: string;
}

export interface UserEquipmentShifts {
  odrenedequipos: EquipmentShift[];
}

export type EquipmentAssignments = Record<string, UserEquipmentShifts>;

// Legacy type for backwards compatibility
export type UserEquipmentAssignment = {
  cameraId?: string;
  lensId?: string;
  adapterId?: string;
  sdCardId?: string;
};

interface EventFormProps {
  event?: EventWithRelations;
  existingAssignments?: EquipmentAssignment[];
  onSubmit: (data: CreateEventRequest | UpdateEventRequest, equipmentAssignments?: EquipmentAssignments) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Parse time slot from notes field (format: "Turno: HH:mm - HH:mm")
function parseTimeSlotFromNotes(notes: string | null | undefined): { start: string; end: string } | null {
  if (!notes) return null;
  const match = notes.match(/Turno:\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
  if (match) {
    return { start: match[1], end: match[2] };
  }
  return null;
}

// Extract time HH:mm from ISO datetime string
function extractTimeFromISO(isoString: string): string {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Convert existing assignments to form structure
function parseExistingAssignments(assignments: EquipmentAssignment[]): EquipmentAssignments {
  const result: EquipmentAssignments = {};

  // Group by user + time slot
  const groupedAssignments = new Map<string, {
    userId: string;
    startTime: string;
    endTime: string;
    assignments: EquipmentAssignment[];
  }>();

  assignments.forEach((assignment) => {
    if (!assignment.user || !assignment.equipment) return;

    // Get time slot from notes or startTime
    const parsedTime = parseTimeSlotFromNotes(assignment.notes);
    let startTime: string;
    let endTime: string;

    if (parsedTime) {
      startTime = parsedTime.start;
      endTime = parsedTime.end;
    } else {
      startTime = extractTimeFromISO(assignment.startTime);
      endTime = assignment.endTime ? extractTimeFromISO(assignment.endTime) : '--:--';
    }

    const key = `${assignment.userId}-${startTime}-${endTime}`;

    if (!groupedAssignments.has(key)) {
      groupedAssignments.set(key, {
        userId: assignment.userId,
        startTime,
        endTime,
        assignments: [],
      });
    }

    groupedAssignments.get(key)!.assignments.push(assignment);
  });

  // Convert to EquipmentAssignments structure
  groupedAssignments.forEach((group) => {
    if (!result[group.userId]) {
      result[group.userId] = { odrenedequipos: [] };
    }

    const shift: EquipmentShift = {
      odrenequipoId: generateShiftId(),
      odrenHoraInicio: group.startTime,
      HoraFin: group.endTime,
    };

    // Add equipment by category
    group.assignments.forEach((assignment) => {
      if (!assignment.equipment) return;
      const category = assignment.equipment.category;
      if (category === 'camera') shift.cameraId = assignment.equipmentId;
      else if (category === 'lens') shift.lensId = assignment.equipmentId;
      else if (category === 'adapter') shift.adapterId = assignment.equipmentId;
      else if (category === 'sd_card') shift.sdCardId = assignment.equipmentId;
    });

    result[group.userId].odrenedequipos.push(shift);
  });

  return result;
}

function toDatetimeLocal(isoString: string): string {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function extractTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function generateShiftId(): string {
  return `shift-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Check if two time ranges overlap
function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  // Overlap exists if: start1 < end2 AND start2 < end1
  return start1 < end2 && start2 < end1;
}

const categoryConfig: Record<EquipmentCategory, { label: string; icon: React.ReactNode; key: keyof UserEquipmentAssignment }> = {
  camera: { label: 'Cámara', icon: <Camera className="h-4 w-4" />, key: 'cameraId' },
  lens: { label: 'Lente', icon: <Circle className="h-4 w-4" />, key: 'lensId' },
  adapter: { label: 'Adaptador', icon: <Disc className="h-4 w-4" />, key: 'adapterId' },
  sd_card: { label: 'SD', icon: <CreditCard className="h-4 w-4" />, key: 'sdCardId' },
};

interface OverlapWarning {
  equipmentId: string;
  equipmentName: string;
  users: string[];
  timeRange: string;
}

export function EventForm({ event, existingAssignments, onSubmit, onCancel, isLoading }: EventFormProps) {
  const { user } = useAuthContext();
  const isEditing = !!event;
  const canAssignEquipment = user?.role === 'admin' || user?.role === 'supervisor';

  const [equipmentAssignments, setEquipmentAssignments] = useState<EquipmentAssignments>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', { limit: 100 }],
    queryFn: () => userService.getAll({ limit: 100 }),
  });

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
  const startDatetime = watch('startDatetime');
  const endDatetime = watch('endDatetime');

  // Query available equipment for the event time range
  // excludeTasks: true means we only check for conflicts with OTHER EVENTS, not tasks
  const { data: availableEquipmentData, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['equipment-available', 'event', startDatetime, endDatetime],
    queryFn: async () => {
      // Get available equipment for the event time range
      // excludeTasks=true: only consider event assignments for conflicts
      const available = await equipmentService.getAvailable({
        startTime: new Date(startDatetime).toISOString(),
        endTime: new Date(endDatetime).toISOString(),
        excludeTasks: true,
      });

      // If editing, also include equipment already assigned to THIS event
      if (event?.id && existingAssignments && existingAssignments.length > 0) {
        const assignedEquipment = existingAssignments
          .filter(a => a.equipment)
          .map(a => ({
            id: a.equipment!.id,
            name: a.equipment!.name,
            category: a.equipment!.category,
            status: a.equipment!.status,
            serialNumber: a.equipment!.serialNumber,
            isActive: true,
          } as Equipment));

        // Merge: available + assigned (avoiding duplicates)
        const merged = [...available];
        assignedEquipment.forEach(eq => {
          if (!merged.find(m => m.id === eq.id)) {
            merged.push(eq);
          }
        });

        return merged;
      }

      return available;
    },
    enabled: canAssignEquipment && !!startDatetime && !!endDatetime,
  });

  const users = usersResponse?.data || [];
  const availableEquipment = availableEquipmentData || [];

  // Initialize equipment assignments from existing data when editing
  useEffect(() => {
    console.log('EventForm - isEditing:', isEditing);
    console.log('EventForm - existingAssignments:', existingAssignments?.length || 0, 'items');
    console.log('EventForm - isInitialized:', isInitialized);

    if (isEditing && existingAssignments && existingAssignments.length > 0 && !isInitialized) {
      console.log('EventForm - Parsing existing assignments...');
      const parsed = parseExistingAssignments(existingAssignments);
      console.log('EventForm - Parsed result:', parsed);
      setEquipmentAssignments(parsed);
      setIsInitialized(true);
    }
  }, [isEditing, existingAssignments, isInitialized]);

  // Get IDs of equipment already assigned to this event (these should always be available)
  const eventEquipmentIds = useMemo(() => {
    if (!existingAssignments) return new Set<string>();
    return new Set(existingAssignments.map(a => a.equipmentId));
  }, [existingAssignments]);

  // Group equipment by category
  const equipmentByCategory = useMemo(() => {
    const grouped: Record<EquipmentCategory, Equipment[]> = {
      camera: [],
      lens: [],
      adapter: [],
      sd_card: [],
    };

    availableEquipment.forEach((eq) => {
      // Include if: available & active, OR already assigned to THIS event
      const isAvailable = eq.status === 'available' && eq.isActive;
      const isAssignedToThisEvent = eventEquipmentIds.has(eq.id);

      if (isAvailable || isAssignedToThisEvent) {
        const category = eq.category as EquipmentCategory;
        if (grouped[category]) {
          grouped[category].push(eq);
        }
      }
    });

    return grouped;
  }, [availableEquipment, eventEquipmentIds]);

  // Check for equipment overlaps (same equipment assigned to different users at overlapping times)
  const overlapWarnings = useMemo((): OverlapWarning[] => {
    const warnings: OverlapWarning[] = [];
    const equipmentUsage: Map<string, Array<{
      odrenequipoId: string;
      userId: string;
      userName: string;
      start: string;
      end: string
    }>> = new Map();

    // Collect all equipment usage
    Object.entries(equipmentAssignments).forEach(([userId, userShifts]) => {
      const userName = users.find(u => u.id === userId)?.name || 'Usuario';

      userShifts.odrenedequipos.forEach((shift) => {
        const equipmentIds = [shift.cameraId, shift.lensId, shift.adapterId, shift.sdCardId].filter(Boolean) as string[];

        equipmentIds.forEach((eqId) => {
          if (!equipmentUsage.has(eqId)) {
            equipmentUsage.set(eqId, []);
          }
          equipmentUsage.get(eqId)!.push({
            odrenequipoId: shift.odrenequipoId,
            userId,
            userName,
            start: shift.odrenHoraInicio,
            end: shift.HoraFin,
          });
        });
      });
    });

    // Check for overlaps between different users
    equipmentUsage.forEach((usages, equipmentId) => {
      if (usages.length < 2) return;

      for (let i = 0; i < usages.length; i++) {
        for (let j = i + 1; j < usages.length; j++) {
          const a = usages[i];
          const b = usages[j];

          // Only warn if different users have overlapping times
          if (a.userId !== b.userId && timesOverlap(a.start, a.end, b.start, b.end)) {
            const eq = availableEquipment.find(e => e.id === equipmentId);
            const overlapStart = a.start > b.start ? a.start : b.start;
            const overlapEnd = a.end < b.end ? a.end : b.end;

            // Avoid duplicate warnings
            const existingWarning = warnings.find(
              w => w.equipmentId === equipmentId &&
                   w.users.includes(a.userName) &&
                   w.users.includes(b.userName)
            );

            if (!existingWarning) {
              warnings.push({
                equipmentId,
                equipmentName: eq?.name || 'Equipo',
                users: [a.userName, b.userName],
                timeRange: `${overlapStart} - ${overlapEnd}`,
              });
            }
          }
        }
      }
    });

    return warnings;
  }, [equipmentAssignments, users, availableEquipment]);

  // Get event time range for defaults
  const eventTimeRange = useMemo(() => {
    if (!startDatetime || !endDatetime) return null;
    return {
      start: extractTime(startDatetime),
      end: extractTime(endDatetime),
    };
  }, [startDatetime, endDatetime]);

  const handleFormSubmit = (data: EventFormData) => {
    if (overlapWarnings.length > 0) {
      const confirm = window.confirm(
        'Hay equipos asignados a múltiples usuarios en horarios que se solapan. ¿Desea continuar de todos modos?'
      );
      if (!confirm) return;
    }

    const submitData = {
      ...data,
      clientRequirements: data.clientRequirements || null,
      startDatetime: new Date(data.startDatetime).toISOString(),
      endDatetime: new Date(data.endDatetime).toISOString(),
      assigneeIds: data.assigneeIds || [],
    };

    // Filter equipment assignments to only include assigned users with shifts
    const filteredAssignments: EquipmentAssignments = {};
    selectedAssignees.forEach((userId) => {
      const userShifts = equipmentAssignments[userId];
      if (userShifts && userShifts.odrenedequipos.length > 0) {
        const validShifts = userShifts.odrenedequipos.filter(
          (shift) => shift.cameraId || shift.lensId || shift.adapterId || shift.sdCardId
        );
        if (validShifts.length > 0) {
          filteredAssignments[userId] = { odrenedequipos: validShifts };
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

  const addShift = (userId: string) => {
    const defaultStart = eventTimeRange?.start || '08:00';
    const defaultEnd = eventTimeRange?.end || '17:00';

    setEquipmentAssignments((prev) => ({
      ...prev,
      [userId]: {
        odrenedequipos: [
          ...(prev[userId]?.odrenedequipos || []),
          {
            odrenequipoId: generateShiftId(),
            odrenHoraInicio: defaultStart,
            HoraFin: defaultEnd,
          },
        ],
      },
    }));
  };

  const removeShift = (userId: string, shiftId: string) => {
    setEquipmentAssignments((prev) => ({
      ...prev,
      [userId]: {
        odrenedequipos: prev[userId]?.odrenedequipos.filter((s) => s.odrenequipoId !== shiftId) || [],
      },
    }));
  };

  const updateShift = (
    userId: string,
    shiftId: string,
    field: keyof EquipmentShift,
    value: string
  ) => {
    setEquipmentAssignments((prev) => ({
      ...prev,
      [userId]: {
        odrenedequipos: prev[userId]?.odrenedequipos.map((shift) =>
          shift.odrenequipoId === shiftId
            ? { ...shift, [field]: value || undefined }
            : shift
        ) || [],
      },
    }));
  };

  // Get available options for a category, considering time-based availability
  const getAvailableOptionsForCategory = (
    category: EquipmentCategory,
    _currentUserId: string,
    currentShift: EquipmentShift
  ) => {
    const categoryEquipment = equipmentByCategory[category];
    const key = categoryConfig[category].key;

    // Get equipment that's already used at overlapping times
    const unavailableEquipmentIds = new Set<string>();

    Object.entries(equipmentAssignments).forEach(([_userId, userShifts]) => {
      userShifts.odrenedequipos.forEach((shift) => {
        // Skip current shift
        if (shift.odrenequipoId === currentShift.odrenequipoId) return;

        const eqId = shift[key];
        if (!eqId) return;

        // Check if times overlap with current shift
        if (timesOverlap(currentShift.odrenHoraInicio, currentShift.HoraFin, shift.odrenHoraInicio, shift.HoraFin)) {
          unavailableEquipmentIds.add(eqId);
        }
      });
    });

    const currentValue = currentShift[key];

    return [
      { value: '', label: 'Sin asignar' },
      ...categoryEquipment.map((eq) => {
        const isUnavailable = unavailableEquipmentIds.has(eq.id) && eq.id !== currentValue;
        return {
          value: eq.id,
          label: eq.serialNumber ? `${eq.name} (${eq.serialNumber})` : eq.name,
          disabled: isUnavailable,
        };
      }),
    ];
  };

  const assignedUsers = users.filter((u) => selectedAssignees.includes(u.id));

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

      {/* Overlap Warnings */}
      {overlapWarnings.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Conflictos de equipos detectados</span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-yellow-700">
            {overlapWarnings.map((warning, idx) => (
              <li key={idx}>
                <strong>{warning.equipmentName}</strong> asignado a {warning.users.join(' y ')} en horario solapado ({warning.timeRange})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Equipment Assignment Section with Shifts - Vertical Layout */}
      {canAssignEquipment && assignedUsers.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Asignar equipos por turnos
          </label>
          {!startDatetime || !endDatetime ? (
            <p className="py-4 text-center text-sm text-gray-500 rounded-lg border border-gray-200 bg-gray-50">
              Selecciona las fechas del evento para ver equipos disponibles
            </p>
          ) : isLoadingEquipment ? (
            <p className="py-2 text-center text-sm text-gray-500">
              Cargando equipos disponibles...
            </p>
          ) : (
            <div className="space-y-4">
              {assignedUsers.map((assignedUser) => {
                const userShifts = equipmentAssignments[assignedUser.id]?.odrenedequipos || [];

                return (
                  <div
                    key={assignedUser.id}
                    className="rounded-lg border border-gray-300 bg-gray-50 p-4"
                  >
                    {/* User header */}
                    <div className="mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-600" />
                      <h4 className="text-base font-semibold text-gray-900">
                        {assignedUser.name}
                      </h4>
                    </div>

                    {/* Shifts list */}
                    <div className="space-y-4">
                      {userShifts.map((shift, index) => (
                        <div
                          key={shift.odrenequipoId}
                          className="rounded-lg border border-gray-200 bg-white p-4"
                        >
                          {/* Shift header */}
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Turno {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeShift(assignedUser.id, shift.odrenequipoId)}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title="Eliminar turno"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Time inputs */}
                          <div className="mb-4 grid grid-cols-2 gap-4">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600">
                                Hora inicio
                              </label>
                              <input
                                type="time"
                                value={shift.odrenHoraInicio}
                                onChange={(e) =>
                                  updateShift(assignedUser.id, shift.odrenequipoId, 'odrenHoraInicio', e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600">
                                Hora fin
                              </label>
                              <input
                                type="time"
                                value={shift.HoraFin}
                                onChange={(e) =>
                                  updateShift(assignedUser.id, shift.odrenequipoId, 'HoraFin', e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                              />
                            </div>
                          </div>

                          {/* Equipment selects - vertical full width */}
                          <div className="space-y-3">
                            {(Object.keys(categoryConfig) as EquipmentCategory[]).map((category) => {
                              const config = categoryConfig[category];
                              const options = getAvailableOptionsForCategory(category, assignedUser.id, shift);
                              const currentValue = shift[config.key] || '';

                              return (
                                <div key={category}>
                                  <label className="mb-1 flex items-center gap-2 text-xs font-medium text-gray-600">
                                    {config.icon}
                                    <span>{config.label}</span>
                                  </label>
                                  <Select
                                    value={currentValue}
                                    onChange={(e) =>
                                      updateShift(assignedUser.id, shift.odrenequipoId, config.key, e.target.value)
                                    }
                                    options={options}
                                    className="w-full"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Add shift button */}
                      <button
                        type="button"
                        onClick={() => addShift(assignedUser.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar turno
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
