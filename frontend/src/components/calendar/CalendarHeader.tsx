import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

export type CalendarView = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

function formatHeaderDate(date: Date, view: CalendarView): string {
  if (view === 'month') {
    return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }
  if (view === 'week') {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const startMonth = startOfWeek.toLocaleDateString('es-MX', { month: 'short' });
    const endMonth = endOfWeek.toLocaleDateString('es-MX', { month: 'short' });
    const year = endOfWeek.getFullYear();

    if (startMonth === endMonth) {
      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${startMonth} ${year}`;
    }
    return `${startOfWeek.getDate()} ${startMonth} - ${endOfWeek.getDate()} ${endMonth} ${year}`;
  }
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          Hoy
        </Button>
        <h2 className="ml-4 text-lg font-semibold capitalize text-gray-900">
          {formatHeaderDate(currentDate, view)}
        </h2>
      </div>

      <div className="flex rounded-lg border border-gray-300 bg-white p-1">
        <button
          onClick={() => onViewChange('month')}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            view === 'month'
              ? 'bg-[#CC0000] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Mes
        </button>
        <button
          onClick={() => onViewChange('week')}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            view === 'week'
              ? 'bg-[#CC0000] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Semana
        </button>
        <button
          onClick={() => onViewChange('day')}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            view === 'day'
              ? 'bg-[#CC0000] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Dia
        </button>
      </div>
    </div>
  );
}
