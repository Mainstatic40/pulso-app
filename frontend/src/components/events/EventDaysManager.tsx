import { useEffect, useMemo, useState } from 'react';
import { Calendar, Users, Copy, CopyCheck, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { EventDayForm } from './EventDayForm';
import type { EventType, EventDayInput, ShiftEquipment, EventShiftInput } from '../../types';

interface EventDaysManagerProps {
  eventType: EventType;
  startDate: Date | null;
  endDate: Date | null;
  days: EventDayInput[];
  onChange: (days: EventDayInput[]) => void;
  users: Array<{ id: string; name: string }>;
  morningStartTime?: string;
  morningEndTime?: string;
  afternoonStartTime?: string;
  afternoonEndTime?: string;
  usePresetEquipment?: boolean;
  presetEquipment?: ShiftEquipment;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateWithDay(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getDatesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  current.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

  const endDate = new Date(end);
  endDate.setHours(12, 0, 0, 0);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function dateToISOString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function EventDaysManager({
  eventType,
  startDate,
  endDate,
  days,
  onChange,
  users,
  morningStartTime,
  morningEndTime,
  afternoonStartTime,
  afternoonEndTime,
  usePresetEquipment,
  presetEquipment,
}: EventDaysManagerProps) {
  // Generate days when dates change
  useEffect(() => {
    if (!startDate || !endDate) {
      if (days.length > 0) {
        onChange([]);
      }
      return;
    }

    const dateRange = getDatesBetween(startDate, endDate);
    const existingDaysByDate = new Map<string, EventDayInput>();

    // Index existing days by date
    days.forEach((day) => {
      const dateKey = day.date.split('T')[0];
      existingDaysByDate.set(dateKey, day);
    });

    // Generate new days array
    const newDays: EventDayInput[] = dateRange.map((date) => {
      const dateKey = dateToISOString(date);
      const existing = existingDaysByDate.get(dateKey);

      if (existing) {
        return existing;
      }

      // Create new empty day
      return {
        date: dateKey,
        note: null,
        shifts: [],
      };
    });

    // Only update if there are actual changes
    const daysChanged =
      newDays.length !== days.length ||
      newDays.some((newDay, i) => {
        const oldDay = days[i];
        return !oldDay || newDay.date !== oldDay.date.split('T')[0];
      });

    if (daysChanged) {
      onChange(newDays);
    }
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate summary info
  const summary = useMemo(() => {
    if (!startDate || !endDate) return null;

    const totalShifts = days.reduce((acc, day) => acc + day.shifts.length, 0);

    return {
      totalDays: days.length,
      totalShifts,
      startFormatted: formatDateShort(startDate),
      endFormatted: formatDateShort(endDate),
    };
  }, [startDate, endDate, days]);

  // Handle day update
  const handleDayChange = (index: number, updatedDay: EventDayInput) => {
    const newDays = [...days];
    newDays[index] = updatedDay;
    onChange(newDays);
  };

  // Copy shifts from one day to next
  const copyShiftsToNextDay = (fromIndex: number) => {
    if (fromIndex >= days.length - 1) return;

    const sourceDay = days[fromIndex];
    const newDays = [...days];

    // Copy shifts (deep clone to avoid reference issues)
    newDays[fromIndex + 1] = {
      ...newDays[fromIndex + 1],
      shifts: sourceDay.shifts.map((shift) => ({
        ...shift,
        equipment: shift.equipment ? { ...shift.equipment } : {},
      })),
    };

    onChange(newDays);
  };

  // Copy shifts from day 1 to all other days
  const copyDay1ToAll = () => {
    if (days.length <= 1) return;

    const sourceDay = days[0];
    const newDays = days.map((day, index) => {
      if (index === 0) return day;

      return {
        ...day,
        shifts: sourceDay.shifts.map((shift) => ({
          ...shift,
          equipment: shift.equipment ? { ...shift.equipment } : {},
        })),
      };
    });

    onChange(newDays);
  };

  // Check if day 1 has shifts to copy
  const canCopyFromDay1 = days.length > 1 && days[0].shifts.length > 0;

  // Quick assignment state for yearbook (assign same person to multiple days)
  const [quickAssignUser, setQuickAssignUser] = useState('');
  const [quickAssignShiftType, setQuickAssignShiftType] = useState<'morning' | 'afternoon' | 'both'>('morning');
  const [quickAssignFromDay, setQuickAssignFromDay] = useState(1);
  const [quickAssignToDay, setQuickAssignToDay] = useState(days.length || 1);

  // Update quickAssignToDay when days change
  useEffect(() => {
    if (days.length > 0 && quickAssignToDay > days.length) {
      setQuickAssignToDay(days.length);
    }
    if (days.length > 0 && quickAssignFromDay > days.length) {
      setQuickAssignFromDay(1);
    }
  }, [days.length, quickAssignFromDay, quickAssignToDay]);

  // Apply quick assignment for yearbook
  const applyQuickAssignment = () => {
    if (!quickAssignUser || days.length === 0) return;

    const fromIndex = quickAssignFromDay - 1;
    const toIndex = quickAssignToDay - 1;

    const newDays = days.map((day, index) => {
      // Skip days outside the range
      if (index < fromIndex || index > toIndex) return day;

      const existingShifts = [...day.shifts];
      const shiftsToAdd: EventShiftInput[] = [];

      // Helper to create shift
      const createShift = (shiftType: 'morning' | 'afternoon'): EventShiftInput => ({
        userId: quickAssignUser,
        startTime: shiftType === 'morning' ? (morningStartTime || '08:00') : (afternoonStartTime || '14:30'),
        endTime: shiftType === 'morning' ? (morningEndTime || '12:00') : (afternoonEndTime || '18:30'),
        shiftType,
        note: null,
        equipment: usePresetEquipment && presetEquipment
          ? {
              cameraId: presetEquipment.cameraId,
              lensId: presetEquipment.lensId,
              adapterId: presetEquipment.adapterId,
            }
          : {},
      });

      // Add morning shift if needed
      if (quickAssignShiftType === 'morning' || quickAssignShiftType === 'both') {
        const existingMorning = existingShifts.findIndex((s) => s.shiftType === 'morning');
        if (existingMorning === -1) {
          shiftsToAdd.push(createShift('morning'));
        } else {
          // Update existing morning shift
          existingShifts[existingMorning] = {
            ...existingShifts[existingMorning],
            userId: quickAssignUser,
          };
        }
      }

      // Add afternoon shift if needed
      if (quickAssignShiftType === 'afternoon' || quickAssignShiftType === 'both') {
        const existingAfternoon = existingShifts.findIndex((s) => s.shiftType === 'afternoon');
        if (existingAfternoon === -1) {
          shiftsToAdd.push(createShift('afternoon'));
        } else {
          // Update existing afternoon shift
          existingShifts[existingAfternoon] = {
            ...existingShifts[existingAfternoon],
            userId: quickAssignUser,
          };
        }
      }

      return {
        ...day,
        shifts: [...existingShifts, ...shiftsToAdd],
      };
    });

    onChange(newDays);
  };

  // No dates selected
  if (!startDate || !endDate) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          Selecciona las fechas del evento para configurar los días
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      {summary && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">
                {summary.totalDays} {summary.totalDays === 1 ? 'día' : 'días'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {summary.startFormatted}{summary.totalDays > 1 ? ` al ${summary.endFormatted}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {canCopyFromDay1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('¿Copiar los turnos del día 1 a todos los demás días? Esto sobrescribirá los turnos existentes.')) {
                    copyDay1ToAll();
                  }
                }}
                title="Copiar turnos del día 1 a todos los días"
              >
                <CopyCheck className="mr-1 h-4 w-4" />
                Copiar a todos
              </Button>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{summary.totalShifts} turnos</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Assignment for Yearbook (only when multiple days) */}
      {eventType === 'yearbook' && days.length > 1 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-amber-800">Asignación rápida</span>
          </div>
          <p className="mb-3 text-xs text-amber-700">
            Asigna la misma persona a múltiples días consecutivos
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {/* User Select */}
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-xs text-gray-600">Persona</label>
              <Select
                value={quickAssignUser}
                onChange={(e) => setQuickAssignUser(e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  ...users.map((u) => ({ value: u.id, label: u.name })),
                ]}
                className="text-sm"
              />
            </div>

            {/* Shift Type */}
            <div>
              <label className="mb-1 block text-xs text-gray-600">Turno</label>
              <Select
                value={quickAssignShiftType}
                onChange={(e) => setQuickAssignShiftType(e.target.value as 'morning' | 'afternoon' | 'both')}
                options={[
                  { value: 'morning', label: '☀️ Mañana' },
                  { value: 'afternoon', label: '🌅 Tarde' },
                  { value: 'both', label: '📅 Ambos' },
                ]}
                className="text-sm"
              />
            </div>

            {/* From Day */}
            <div>
              <label className="mb-1 block text-xs text-gray-600">Desde día</label>
              <Select
                value={quickAssignFromDay.toString()}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setQuickAssignFromDay(val);
                  if (val > quickAssignToDay) setQuickAssignToDay(val);
                }}
                options={days.map((_, i) => ({ value: (i + 1).toString(), label: `Día ${i + 1}` }))}
                className="text-sm"
              />
            </div>

            {/* To Day */}
            <div>
              <label className="mb-1 block text-xs text-gray-600">Hasta día</label>
              <Select
                value={quickAssignToDay.toString()}
                onChange={(e) => setQuickAssignToDay(parseInt(e.target.value))}
                options={days
                  .map((_, i) => ({ value: (i + 1).toString(), label: `Día ${i + 1}` }))
                  .filter((_, i) => i + 1 >= quickAssignFromDay)}
                className="text-sm"
              />
            </div>

            {/* Apply Button */}
            <div className="col-span-2 flex items-end sm:col-span-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={applyQuickAssignment}
                disabled={!quickAssignUser}
                className="w-full"
              >
                Aplicar
              </Button>
            </div>
          </div>

          {quickAssignUser && (
            <p className="mt-2 text-xs text-amber-600">
              Se asignará a {users.find((u) => u.id === quickAssignUser)?.name} en{' '}
              {quickAssignShiftType === 'both' ? 'ambos turnos' : `turno de ${quickAssignShiftType === 'morning' ? 'mañana' : 'tarde'}`}{' '}
              del día {quickAssignFromDay} al {quickAssignToDay}
            </p>
          )}
        </div>
      )}

      {/* Days List */}
      <div className="space-y-3">
        {days.map((day, index) => {
          const dayDate = new Date(day.date + 'T12:00:00');

          return (
            <div
              key={day.date}
              className="rounded-lg border border-gray-200 bg-white"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">
                    {index + 1}
                  </span>
                  <span className="font-medium capitalize text-gray-900">
                    {formatDateWithDay(dayDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Copy to next day button */}
                  {day.shifts.length > 0 && index < days.length - 1 && (
                    <button
                      type="button"
                      onClick={() => copyShiftsToNextDay(index)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                      title={`Copiar turnos al día ${index + 2}`}
                    >
                      <Copy className="h-3 w-3" />
                      <span className="hidden sm:inline">Copiar al siguiente</span>
                    </button>
                  )}
                  {day.shifts.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {day.shifts.length} {day.shifts.length === 1 ? 'turno' : 'turnos'}
                    </span>
                  )}
                </div>
              </div>

              {/* Day Content */}
              <div className="p-4">
                <EventDayForm
                  eventType={eventType}
                  day={day}
                  dayIndex={index}
                  onChange={(updatedDay) => handleDayChange(index, updatedDay)}
                  users={users}
                  morningStartTime={morningStartTime}
                  morningEndTime={morningEndTime}
                  afternoonStartTime={afternoonStartTime}
                  afternoonEndTime={afternoonEndTime}
                  usePresetEquipment={usePresetEquipment}
                  presetEquipment={presetEquipment}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Type specific info */}
      {eventType === 'yearbook' && days.length === 1 && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          <p className="font-medium">Modo Anuario</p>
          <p className="mt-1 text-blue-600">
            Puedes asignar turnos de mañana y tarde con horarios predefinidos.
            {usePresetEquipment && ' El equipo se asignará automáticamente.'}
          </p>
        </div>
      )}
    </div>
  );
}
