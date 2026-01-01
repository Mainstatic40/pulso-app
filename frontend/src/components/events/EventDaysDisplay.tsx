import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, Clock, FileText, Camera, Circle, Disc, HardDrive } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import type { EventDay, EventShift } from '../../types';

interface EventDaysDisplayProps {
  days: EventDay[];
}

function formatDateWithDay(dateString: string): string {
  const datePart = dateString.split('T')[0];
  const date = new Date(datePart + 'T12:00:00');
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

function formatShiftType(shiftType: string | null): string {
  if (shiftType === 'morning') return 'Mañana';
  if (shiftType === 'afternoon') return 'Tarde';
  return 'Personalizado';
}

function getShiftTypeColor(shiftType: string | null): string {
  if (shiftType === 'morning') return 'bg-amber-100 text-amber-800';
  if (shiftType === 'afternoon') return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-800';
}

interface EquipmentIconProps {
  category: string;
  className?: string;
}

function EquipmentIcon({ category, className = 'h-3.5 w-3.5' }: EquipmentIconProps) {
  switch (category) {
    case 'camera':
      return <Camera className={`${className} text-blue-600`} />;
    case 'lens':
      return <Circle className={`${className} text-purple-600`} />;
    case 'adapter':
      return <Disc className={`${className} text-orange-600`} />;
    case 'sd_card':
      return <HardDrive className={`${className} text-green-600`} />;
    default:
      return null;
  }
}

interface ShiftCardProps {
  shift: EventShift;
}

function ShiftCard({ shift }: ShiftCardProps) {
  const equipmentItems = shift.equipmentAssignments || [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={shift.user?.name || 'Usuario'} size="sm" />
          <div>
            <p className="font-medium text-gray-900">{shift.user?.name || 'Sin asignar'}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{shift.startTime} - {shift.endTime}</span>
            </div>
          </div>
        </div>
        {shift.shiftType && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getShiftTypeColor(shift.shiftType)}`}>
            {formatShiftType(shift.shiftType)}
          </span>
        )}
      </div>

      {shift.note && (
        <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
          <FileText className="mt-0.5 h-3.5 w-3.5 text-gray-400" />
          <span>{shift.note}</span>
        </div>
      )}

      {equipmentItems.length > 0 && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <div className="flex flex-wrap gap-2">
            {equipmentItems.map((ea) => (
              ea.equipment && (
                <div
                  key={ea.id}
                  className="flex items-center gap-1.5 rounded bg-gray-50 px-2 py-1 text-xs text-gray-700"
                >
                  <EquipmentIcon category={ea.equipment.category} />
                  <span>{ea.equipment.name}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DayCardProps {
  day: EventDay;
  dayNumber: number;
  defaultExpanded?: boolean;
}

function DayCard({ day, dayNumber, defaultExpanded = false }: DayCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const shiftsCount = day.shifts?.length || 0;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      {/* Day Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">
            {dayNumber}
          </span>
          <div>
            <p className="font-medium capitalize text-gray-900">
              {formatDateWithDay(day.date)}
            </p>
            {day.note && (
              <p className="text-sm text-gray-500">{day.note}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {shiftsCount} {shiftsCount === 1 ? 'turno' : 'turnos'}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Day Content */}
      {isExpanded && (
        <div className="space-y-3 bg-white p-4">
          {day.shifts && day.shifts.length > 0 ? (
            day.shifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))
          ) : (
            <p className="py-4 text-center text-sm text-gray-500">
              Sin turnos asignados
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function EventDaysDisplay({ days }: EventDaysDisplayProps) {
  if (!days || days.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
        <Calendar className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">No hay días configurados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {days.map((day, index) => (
        <DayCard
          key={day.id || day.date}
          day={day}
          dayNumber={index + 1}
          defaultExpanded={index === 0}
        />
      ))}
    </div>
  );
}
