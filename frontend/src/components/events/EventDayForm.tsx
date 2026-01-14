import { Sun, Sunset, Plus, Trash2, Clock, FileText } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ShiftEquipmentSelector } from './ShiftEquipmentSelector';
import type { EventType, EventDayInput, EventShiftInput, ShiftEquipment } from '../../types';

interface EventDayFormProps {
  eventType: EventType;
  day: EventDayInput;
  dayIndex?: number; // Optional, used for display purposes in parent
  onChange: (day: EventDayInput) => void;
  users: Array<{ id: string; name: string }>;
  morningStartTime?: string;
  morningEndTime?: string;
  afternoonStartTime?: string;
  afternoonEndTime?: string;
  usePresetEquipment?: boolean;
  presetEquipment?: ShiftEquipment;
  eventStartDate?: Date;
}

const NOTE_PLACEHOLDERS: Record<EventType, string> = {
  civic: 'Ej: Montaje de stands',
  church: 'Ej: Ensayo general',
  yearbook: 'Ej: Facultad de Educación',
  congress: 'Ej: Día de inauguración',
};

const DEFAULT_TIMES = {
  morningStart: '08:00',
  morningEnd: '12:00',
  afternoonStart: '14:30',
  afternoonEnd: '18:30',
};

// Parse ISO date string to Date object avoiding timezone issues
function parseDateFromISO(dateString: string): Date {
  // Handle both "2024-12-30" and "2024-12-30T..." formats
  const datePart = dateString.split('T')[0];
  return new Date(datePart + 'T12:00:00');
}

// Check if two time ranges overlap
function doTimesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  // Convert times to minutes for easy comparison
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  // Check overlap: start1 < end2 AND start2 < end1
  return s1 < e2 && s2 < e1;
}

// Get equipment IDs from a shift
function getEquipmentIdsFromShift(equipment: ShiftEquipment | undefined): string[] {
  if (!equipment) return [];
  return [
    equipment.cameraId,
    equipment.lensId,
    equipment.adapterId,
    equipment.sdCardId,
  ].filter((id): id is string => !!id);
}

export function EventDayForm({
  eventType,
  day,
  onChange,
  users,
  morningStartTime = DEFAULT_TIMES.morningStart,
  morningEndTime = DEFAULT_TIMES.morningEnd,
  afternoonStartTime = DEFAULT_TIMES.afternoonStart,
  afternoonEndTime = DEFAULT_TIMES.afternoonEnd,
  usePresetEquipment,
  presetEquipment,
}: EventDayFormProps) {
  // Update day note
  const handleNoteChange = (note: string) => {
    onChange({
      ...day,
      note: note || null,
    });
  };

  // Add a new empty shift
  const addShift = (shiftType?: 'morning' | 'afternoon') => {
    const newShift: EventShiftInput = {
      userId: '',
      startTime: shiftType === 'morning' ? morningStartTime : shiftType === 'afternoon' ? afternoonStartTime : '09:00',
      endTime: shiftType === 'morning' ? morningEndTime : shiftType === 'afternoon' ? afternoonEndTime : '13:00',
      shiftType: shiftType || null,
      note: null,
      equipment: {},
    };

    onChange({
      ...day,
      shifts: [...day.shifts, newShift],
    });
  };

  // Remove a shift by index
  const removeShift = (index: number) => {
    onChange({
      ...day,
      shifts: day.shifts.filter((_, i) => i !== index),
    });
  };

  // Update a shift by index
  const updateShift = (index: number, data: Partial<EventShiftInput>) => {
    onChange({
      ...day,
      shifts: day.shifts.map((shift, i) =>
        i === index ? { ...shift, ...data } : shift
      ),
    });
  };

  // Update equipment for a specific shift
  const updateShiftEquipment = (index: number, equipment: ShiftEquipment) => {
    onChange({
      ...day,
      shifts: day.shifts.map((shift, i) =>
        i === index ? { ...shift, equipment } : shift
      ),
    });
  };

  // Get morning/afternoon shift for yearbook mode
  const getMorningShift = () => day.shifts.find((s) => s.shiftType === 'morning');
  const getAfternoonShift = () => day.shifts.find((s) => s.shiftType === 'afternoon');
  const getMorningShiftIndex = () => day.shifts.findIndex((s) => s.shiftType === 'morning');
  const getAfternoonShiftIndex = () => day.shifts.findIndex((s) => s.shiftType === 'afternoon');

  // Update or create yearbook shift
  const updateYearbookShift = (shiftType: 'morning' | 'afternoon', userId: string) => {
    const existingIndex = day.shifts.findIndex((s) => s.shiftType === shiftType);

    if (!userId) {
      // Remove shift if no user selected
      if (existingIndex !== -1) {
        removeShift(existingIndex);
      }
      return;
    }

    // Initialize equipment: use preset (without SD) or empty
    const initialEquipment: ShiftEquipment = usePresetEquipment && presetEquipment
      ? {
          cameraId: presetEquipment.cameraId,
          lensId: presetEquipment.lensId,
          adapterId: presetEquipment.adapterId,
          // SD card is user-selectable, don't preset it
        }
      : {};

    const shiftData: EventShiftInput = {
      userId,
      startTime: shiftType === 'morning' ? morningStartTime : afternoonStartTime,
      endTime: shiftType === 'morning' ? morningEndTime : afternoonEndTime,
      shiftType,
      note: null,
      equipment: initialEquipment,
    };

    if (existingIndex !== -1) {
      // Preserve existing equipment if updating user
      const existingEquipment = day.shifts[existingIndex].equipment;
      updateShift(existingIndex, {
        ...shiftData,
        equipment: existingEquipment || initialEquipment,
      });
    } else {
      onChange({
        ...day,
        shifts: [...day.shifts, shiftData],
      });
    }
  };

  // User options for select
  const userOptions = [
    { value: '', label: 'Sin asignar' },
    ...users.map((u) => ({ value: u.id, label: u.name })),
  ];

  // Users without shifts this day (for quick add)
  const usersWithShifts = new Set(day.shifts.map((s) => s.userId).filter(Boolean));
  const usersWithoutShifts = users.filter((u) => !usersWithShifts.has(u.id));

  // Parse day date for equipment selector
  const dayDate = parseDateFromISO(day.date);

  // Get equipment IDs that are occupied in other overlapping shifts (for conflict detection)
  const getOccupiedEquipmentForShift = (shiftIndex: number): string[] => {
    const currentShift = day.shifts[shiftIndex];
    if (!currentShift) return [];

    const occupied: string[] = [];

    day.shifts.forEach((otherShift, otherIndex) => {
      // Skip the current shift
      if (otherIndex === shiftIndex) return;

      // Check if times overlap
      if (doTimesOverlap(currentShift.startTime, currentShift.endTime, otherShift.startTime, otherShift.endTime)) {
        // Add equipment from overlapping shift
        const equipmentIds = getEquipmentIdsFromShift(otherShift.equipment);
        occupied.push(...equipmentIds);
      }
    });

    return [...new Set(occupied)]; // Remove duplicates
  };

  return (
    <div className="space-y-4">
      {/* Day Note */}
      <div>
        <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
          <FileText className="h-4 w-4" />
          Nota del día (opcional)
        </label>
        <Input
          value={day.note || ''}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder={NOTE_PLACEHOLDERS[eventType]}
        />
      </div>

      {/* Yearbook Mode - Fixed Morning/Afternoon Shifts */}
      {eventType === 'yearbook' ? (
        <div className="space-y-3">
          {/* Morning Shift */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">
                Mañana ({morningStartTime} - {morningEndTime})
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">Asignar a:</label>
                <Select
                  value={getMorningShift()?.userId || ''}
                  onChange={(e) => updateYearbookShift('morning', e.target.value)}
                  options={userOptions}
                />
              </div>
              {getMorningShift()?.userId && (
                <div className="rounded border border-amber-200 bg-white p-3">
                  <ShiftEquipmentSelector
                    equipment={getMorningShift()?.equipment || {}}
                    onChange={(equipment) => updateShiftEquipment(getMorningShiftIndex(), equipment)}
                    shiftDate={dayDate}
                    startTime={morningStartTime}
                    endTime={morningEndTime}
                    usePreset={usePresetEquipment}
                    presetEquipment={presetEquipment}
                    excludeEquipmentIds={getOccupiedEquipmentForShift(getMorningShiftIndex())}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Afternoon Shift */}
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sunset className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">
                Tarde ({afternoonStartTime} - {afternoonEndTime})
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">Asignar a:</label>
                <Select
                  value={getAfternoonShift()?.userId || ''}
                  onChange={(e) => updateYearbookShift('afternoon', e.target.value)}
                  options={userOptions}
                />
              </div>
              {getAfternoonShift()?.userId && (
                <div className="rounded border border-orange-200 bg-white p-3">
                  <ShiftEquipmentSelector
                    equipment={getAfternoonShift()?.equipment || {}}
                    onChange={(equipment) => updateShiftEquipment(getAfternoonShiftIndex(), equipment)}
                    shiftDate={dayDate}
                    startTime={afternoonStartTime}
                    endTime={afternoonEndTime}
                    usePreset={usePresetEquipment}
                    presetEquipment={presetEquipment}
                    excludeEquipmentIds={getOccupiedEquipmentForShift(getAfternoonShiftIndex())}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Other Event Types - Custom Shifts */
        <div className="space-y-3">
          {/* Existing Shifts */}
          {day.shifts.map((shift, shiftIndex) => (
            <div
              key={shiftIndex}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Turno {shiftIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeShift(shiftIndex)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* User Select */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="mb-1 block text-xs text-gray-500">Persona</label>
                  <Select
                    value={shift.userId}
                    onChange={(e) => updateShift(shiftIndex, { userId: e.target.value })}
                    options={userOptions}
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Inicio
                  </label>
                  <Input
                    type="time"
                    value={shift.startTime}
                    onChange={(e) => updateShift(shiftIndex, { startTime: e.target.value })}
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Fin
                  </label>
                  <Input
                    type="time"
                    value={shift.endTime}
                    onChange={(e) => updateShift(shiftIndex, { endTime: e.target.value })}
                  />
                </div>

                {/* Shift Note */}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Nota</label>
                  <Input
                    value={shift.note || ''}
                    onChange={(e) => updateShift(shiftIndex, { note: e.target.value || null })}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* Equipment Selector */}
              {shift.userId && (
                <div className="mt-3 rounded border border-gray-100 bg-gray-50 p-3">
                  <ShiftEquipmentSelector
                    equipment={shift.equipment || {}}
                    onChange={(equipment) => updateShiftEquipment(shiftIndex, equipment)}
                    shiftDate={dayDate}
                    startTime={shift.startTime}
                    endTime={shift.endTime}
                    excludeEquipmentIds={getOccupiedEquipmentForShift(shiftIndex)}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Add Shift Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addShift()}
            >
              <Plus className="mr-1 h-4 w-4" />
              Agregar turno
            </Button>

            {/* Quick add for users without shifts */}
            {usersWithoutShifts.length > 0 && usersWithoutShifts.length <= 3 && (
              <>
                {usersWithoutShifts.map((user) => (
                  <Button
                    key={user.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newShift: EventShiftInput = {
                        userId: user.id,
                        startTime: '09:00',
                        endTime: '13:00',
                        shiftType: null,
                        note: null,
                        equipment: {},
                      };
                      onChange({
                        ...day,
                        shifts: [...day.shifts, newShift],
                      });
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {user.name}
                  </Button>
                ))}
              </>
            )}
          </div>

          {/* Empty State */}
          {day.shifts.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
              <Clock className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                No hay turnos asignados para este día
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => addShift()}
              >
                <Plus className="mr-1 h-4 w-4" />
                Agregar primer turno
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
