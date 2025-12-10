import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface WeekSelectorProps {
  weekStart: Date;
  weekEnd: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  hasSavedLog?: boolean;
  isCurrentWeek: boolean;
}

function formatWeekRange(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('es-MX', { month: 'long' });
  const endMonth = end.toLocaleDateString('es-MX', { month: 'long' });
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `Semana del ${startDay} al ${endDay} de ${startMonth}, ${year}`;
  }
  return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}, ${year}`;
}

export function WeekSelector({
  weekStart,
  weekEnd,
  onPrevious,
  onNext,
  onToday,
  hasSavedLog,
  isCurrentWeek,
}: WeekSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 px-4">
          <span className="text-lg font-medium text-gray-900">
            {formatWeekRange(weekStart, weekEnd)}
          </span>
          {hasSavedLog && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <Check className="h-3 w-3" />
              Guardada
            </span>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!isCurrentWeek && (
        <Button variant="outline" size="sm" onClick={onToday}>
          Ir a semana actual
        </Button>
      )}
    </div>
  );
}

// Utility functions for week calculations
export function getWeekDates(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday

  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getPreviousWeek(current: Date): { start: Date; end: Date } {
  const prev = new Date(current);
  prev.setDate(prev.getDate() - 7);
  return getWeekDates(prev);
}

export function getNextWeek(current: Date): { start: Date; end: Date } {
  const next = new Date(current);
  next.setDate(next.getDate() + 7);
  return getWeekDates(next);
}

export function isSameWeek(date1: Date, date2: Date): boolean {
  const week1 = getWeekDates(date1);
  const week2 = getWeekDates(date2);
  return week1.start.getTime() === week2.start.getTime();
}

export function formatDateForApi(date: Date): string {
  // Format as YYYY-MM-DD using local timezone to avoid UTC conversion issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
