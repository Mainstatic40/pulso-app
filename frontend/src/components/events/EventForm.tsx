import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Calendar, Clock, Settings, Camera, Package } from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { EventTypeSelector } from './EventTypeSelector';
import { EventDaysManager } from './EventDaysManager';
import { userService } from '../../services/user.service';
import { equipmentService } from '../../services/equipment.service';
import type { CreateEventRequest } from '../../services/event.service';
import type { Event, EventType, EventDayInput, ShiftEquipment, Equipment } from '../../types';

interface EventFormProps {
  event?: Event;
  onSubmit: (data: CreateEventRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DEFAULT_TIMES = {
  morningStart: '08:00',
  morningEnd: '12:00',
  afternoonStart: '14:30',
  afternoonEnd: '18:30',
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  civic: 'Evento Cívico',
  church: 'Iglesia Universitaria',
  yearbook: 'Foto de Anuario',
  congress: 'Congreso',
};

// Extract date part (YYYY-MM-DD) from ISO string
function extractDateFromISO(isoString: string): string {
  if (!isoString) return '';
  return isoString.split('T')[0];
}

// Parse date string to Date object (noon to avoid timezone issues)
function parseDateString(dateString: string): Date | null {
  if (!dateString) return null;
  return new Date(dateString + 'T12:00:00');
}

export function EventForm({ event, onSubmit, onCancel, isLoading }: EventFormProps) {
  const isEditing = !!event;

  // Form state
  const [eventType, setEventType] = useState<EventType | null>(event?.eventType || null);
  const [name, setName] = useState(event?.name || '');
  const [description, setDescription] = useState(event?.description || '');
  const [clientRequirements, setClientRequirements] = useState(event?.clientRequirements || '');
  const [startDate, setStartDate] = useState(
    event?.startDatetime ? extractDateFromISO(event.startDatetime) : ''
  );
  const [endDate, setEndDate] = useState(
    event?.endDatetime ? extractDateFromISO(event.endDatetime) : ''
  );

  // Single day event toggle
  const [isSingleDay, setIsSingleDay] = useState(() => {
    if (event?.startDatetime && event?.endDatetime) {
      return extractDateFromISO(event.startDatetime) === extractDateFromISO(event.endDatetime);
    }
    return false;
  });

  // Yearbook-specific state
  const [morningStartTime, setMorningStartTime] = useState(
    event?.morningStartTime || DEFAULT_TIMES.morningStart
  );
  const [morningEndTime, setMorningEndTime] = useState(
    event?.morningEndTime || DEFAULT_TIMES.morningEnd
  );
  const [afternoonStartTime, setAfternoonStartTime] = useState(
    event?.afternoonStartTime || DEFAULT_TIMES.afternoonStart
  );
  const [afternoonEndTime, setAfternoonEndTime] = useState(
    event?.afternoonEndTime || DEFAULT_TIMES.afternoonEnd
  );
  const [usePresetEquipment, setUsePresetEquipment] = useState(
    event?.usePresetEquipment || false
  );

  // Preset equipment IDs (configurable)
  const [presetCameraId, setPresetCameraId] = useState<string>('');
  const [presetLensId, setPresetLensId] = useState<string>('');
  const [presetAdapterId, setPresetAdapterId] = useState<string>('');

  // Additional equipment (equipment taken without assigning to specific shift)
  const [additionalEquipmentIds, setAdditionalEquipmentIds] = useState<string[]>([]);

  // Days with shifts
  const [days, setDays] = useState<EventDayInput[]>(() => {
    if (event?.days && event.days.length > 0) {
      return event.days.map((day) => ({
        date: day.date.split('T')[0],
        note: day.note,
        shifts: day.shifts.map((shift) => ({
          userId: shift.userId,
          startTime: shift.startTime,
          endTime: shift.endTime,
          shiftType: shift.shiftType as 'morning' | 'afternoon' | null,
          note: shift.note,
          equipment: shift.equipmentAssignments?.reduce((acc, ea) => {
            if (ea.equipment) {
              const category = ea.equipment.category;
              if (category === 'camera') acc.cameraId = ea.equipmentId;
              else if (category === 'lens') acc.lensId = ea.equipmentId;
              else if (category === 'adapter') acc.adapterId = ea.equipmentId;
              else if (category === 'sd_card') acc.sdCardId = ea.equipmentId;
            }
            return acc;
          }, {} as ShiftEquipment),
        })),
      }));
    }
    return [];
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Query users for assignment
  const { data: usersResponse } = useQuery({
    queryKey: ['users', { limit: 100, isActive: true }],
    queryFn: () => userService.getAll({ limit: 100, isActive: true }),
  });

  // Query all equipment for preset selection and additional equipment
  const { data: allEquipment } = useQuery({
    queryKey: ['equipment', { isActive: true }],
    queryFn: () => equipmentService.getAll({ isActive: true, limit: 100 }),
  });

  const users = useMemo(() => {
    return (usersResponse?.data || []).map((u) => ({
      id: u.id,
      name: u.name,
    }));
  }, [usersResponse]);

  // Group equipment by category
  const equipmentByCategory = useMemo(() => {
    const equipment = allEquipment?.data || [];
    return {
      cameras: equipment.filter((e) => e.category === 'camera'),
      lenses: equipment.filter((e) => e.category === 'lens'),
      adapters: equipment.filter((e) => e.category === 'adapter'),
      sdCards: equipment.filter((e) => e.category === 'sd_card'),
    };
  }, [allEquipment]);

  // Preset equipment for yearbook (now configurable)
  const presetEquipment: ShiftEquipment = useMemo(() => {
    return {
      cameraId: presetCameraId || undefined,
      lensId: presetLensId || undefined,
      adapterId: presetAdapterId || undefined,
    };
  }, [presetCameraId, presetLensId, presetAdapterId]);

  // Sync end date when single day is toggled or start date changes
  useEffect(() => {
    if (isSingleDay && startDate) {
      setEndDate(startDate);
    }
  }, [isSingleDay, startDate]);

  // Derived dates for EventDaysManager
  const startDateObj = parseDateString(startDate);
  const endDateObj = parseDateString(endDate);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!eventType) {
      newErrors.eventType = 'Selecciona un tipo de evento';
    }
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida';
    }
    // For single day events, end date is auto-set
    const effectiveEndDate = isSingleDay ? startDate : endDate;
    if (!effectiveEndDate) {
      newErrors.endDate = 'La fecha de fin es requerida';
    }
    if (startDate && effectiveEndDate && effectiveEndDate < startDate) {
      newErrors.endDate = 'La fecha de fin debe ser igual o posterior al inicio';
    }

    // Check for at least one shift (optional - can be added later)
    // const totalShifts = days.reduce((acc, day) => acc + day.shifts.length, 0);
    // if (days.length > 0 && totalShifts === 0) {
    //   newErrors.days = 'Agrega al menos un turno';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Use effective end date (same as start for single day events)
    const effectiveEndDate = isSingleDay ? startDate : endDate;

    const data: CreateEventRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      clientRequirements: clientRequirements.trim() || null,
      eventType: eventType!,
      // Send dates as YYYY-MM-DD, backend will handle time conversion
      startDatetime: startDate,
      endDatetime: effectiveEndDate,
      // Yearbook fields
      ...(eventType === 'yearbook' && {
        morningStartTime,
        morningEndTime,
        afternoonStartTime,
        afternoonEndTime,
        usePresetEquipment,
        // Include preset equipment IDs if using preset
        ...(usePresetEquipment && {
          presetCameraId: presetCameraId || undefined,
          presetLensId: presetLensId || undefined,
          presetAdapterId: presetAdapterId || undefined,
        }),
      }),
      // Additional equipment IDs (for yearbook)
      ...(eventType === 'yearbook' && additionalEquipmentIds.length > 0 && {
        additionalEquipmentIds,
      }),
      // Days with shifts
      days: days.map((day) => ({
        date: day.date,
        note: day.note,
        shifts: day.shifts.filter((s) => s.userId).map((shift) => ({
          userId: shift.userId,
          startTime: shift.startTime,
          endTime: shift.endTime,
          shiftType: shift.shiftType,
          note: shift.note,
          equipment: shift.equipment,
        })),
      })),
    };

    // DEBUG: Log what we're submitting
    console.log('=== EventForm submitting ===');
    console.log('Full data:', JSON.stringify(data, null, 2));
    console.log('Days count:', data.days?.length);
    console.log('Additional equipment:', additionalEquipmentIds);
    data.days?.forEach((day, i) => {
      console.log(`Day ${i + 1} (${day.date}):`, {
        note: day.note,
        shiftsCount: day.shifts?.length,
      });
      day.shifts?.forEach((shift, j) => {
        console.log(`  Shift ${j + 1}:`, {
          userId: shift.userId,
          startTime: shift.startTime,
          endTime: shift.endTime,
          shiftType: shift.shiftType,
          equipment: shift.equipment,
        });
      });
    });
    console.log('=== End EventForm data ===');

    onSubmit(data);
  };

  // Step 1: Event type selection
  if (!eventType) {
    return (
      <div className="p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Selecciona el tipo de evento
        </h3>
        <EventTypeSelector
          value={eventType}
          onChange={(type) => {
            setEventType(type);
            setErrors({});
          }}
        />
        {errors.eventType && (
          <p className="mt-2 text-sm text-red-600">{errors.eventType}</p>
        )}
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Full form
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* Event Type Header - Click to change */}
      {!isEditing && (
        <button
          type="button"
          onClick={() => setEventType(null)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="font-medium">{EVENT_TYPE_LABELS[eventType]}</span>
          <span className="text-gray-400">— cambiar tipo</span>
        </button>
      )}

      {isEditing && (
        <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
          {EVENT_TYPE_LABELS[eventType]}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <Input
          label="Nombre del evento *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Ceremonia de Graduación 2024"
          error={errors.name}
        />

        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el evento..."
          rows={3}
        />

        <Textarea
          label="Requisitos del cliente"
          value={clientRequirements}
          onChange={(e) => setClientRequirements(e.target.value)}
          placeholder="Requisitos específicos del cliente..."
          rows={2}
        />
      </div>

      {/* Dates */}
      <div className="space-y-4 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            Fechas del evento
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isSingleDay}
              onChange={(e) => setIsSingleDay(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-600">Evento de un solo día</span>
          </label>
        </div>
        <div className={`grid gap-4 ${isSingleDay ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          <Input
            type="date"
            label={isSingleDay ? 'Fecha del evento *' : 'Fecha de inicio *'}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.startDate}
          />
          {!isSingleDay && (
            <Input
              type="date"
              label="Fecha de fin *"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={errors.endDate}
            />
          )}
        </div>
      </div>

      {/* Yearbook-specific settings */}
      {eventType === 'yearbook' && (
        <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
            <Settings className="h-4 w-4" />
            Configuración de Anuario
          </div>

          {/* Time presets */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                Mañana inicio
              </label>
              <Input
                type="time"
                value={morningStartTime}
                onChange={(e) => setMorningStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 text-xs text-gray-600">Mañana fin</label>
              <Input
                type="time"
                value={morningEndTime}
                onChange={(e) => setMorningEndTime(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                Tarde inicio
              </label>
              <Input
                type="time"
                value={afternoonStartTime}
                onChange={(e) => setAfternoonStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 text-xs text-gray-600">Tarde fin</label>
              <Input
                type="time"
                value={afternoonEndTime}
                onChange={(e) => setAfternoonEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Preset equipment toggle and config */}
          <div className="border-t border-blue-200 pt-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={usePresetEquipment}
                onChange={(e) => setUsePresetEquipment(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Usar equipo preset
                </span>
                <p className="text-xs text-gray-500">
                  El mismo equipo para todos los turnos (solo SD seleccionable por turno)
                </p>
              </div>
            </label>

            {/* Preset equipment selectors */}
            {usePresetEquipment && (
              <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-white p-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-blue-600">
                    <Camera className="h-3 w-3" />
                    Cámara preset
                  </label>
                  <Select
                    value={presetCameraId}
                    onChange={(e) => setPresetCameraId(e.target.value)}
                    options={[
                      { value: '', label: 'Seleccionar...' },
                      ...equipmentByCategory.cameras.map((eq) => ({
                        value: eq.id,
                        label: eq.serialNumber ? `${eq.name} (${eq.serialNumber})` : eq.name,
                      })),
                    ]}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 text-xs font-medium text-purple-600">
                    Lente preset
                  </label>
                  <Select
                    value={presetLensId}
                    onChange={(e) => setPresetLensId(e.target.value)}
                    options={[
                      { value: '', label: 'Seleccionar...' },
                      ...equipmentByCategory.lenses.map((eq) => ({
                        value: eq.id,
                        label: eq.serialNumber ? `${eq.name} (${eq.serialNumber})` : eq.name,
                      })),
                    ]}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 text-xs font-medium text-orange-600">
                    Adaptador preset
                  </label>
                  <Select
                    value={presetAdapterId}
                    onChange={(e) => setPresetAdapterId(e.target.value)}
                    options={[
                      { value: '', label: 'Seleccionar...' },
                      ...equipmentByCategory.adapters.map((eq) => ({
                        value: eq.id,
                        label: eq.serialNumber ? `${eq.name} (${eq.serialNumber})` : eq.name,
                      })),
                    ]}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Additional equipment */}
          <div className="border-t border-blue-200 pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Package className="h-4 w-4" />
              Equipo adicional
            </div>
            <p className="mb-3 text-xs text-gray-500">
              Equipo que se llevará al evento sin asignar a un turno específico
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(allEquipment?.data || []).map((eq) => (
                <label
                  key={eq.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={additionalEquipmentIds.includes(eq.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAdditionalEquipmentIds([...additionalEquipmentIds, eq.id]);
                      } else {
                        setAdditionalEquipmentIds(additionalEquipmentIds.filter((id) => id !== eq.id));
                      }
                    }}
                    className="h-3 w-3 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-xs text-gray-700 truncate" title={eq.name}>
                    {eq.name}
                  </span>
                </label>
              ))}
            </div>
            {additionalEquipmentIds.length > 0 && (
              <p className="mt-2 text-xs text-blue-600">
                {additionalEquipmentIds.length} equipo(s) seleccionado(s)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Days and Shifts Manager */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Días y turnos del evento
        </label>
        <EventDaysManager
          eventType={eventType}
          startDate={startDateObj}
          endDate={endDateObj}
          days={days}
          onChange={setDays}
          users={users}
          morningStartTime={morningStartTime}
          morningEndTime={morningEndTime}
          afternoonStartTime={afternoonStartTime}
          afternoonEndTime={afternoonEndTime}
          usePresetEquipment={usePresetEquipment}
          presetEquipment={presetEquipment}
        />
        {errors.days && (
          <p className="text-sm text-red-600">{errors.days}</p>
        )}
      </div>

      {/* Actions */}
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
