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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {/* Title - shown first on mobile for context */}
      <h2 className="order-first text-center text-base font-semibold capitalize text-gray-900 sm:order-none sm:ml-4 sm:text-left sm:text-lg">
        {formatHeaderDate(currentDate, view)}
      </h2>

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-1.5 sm:order-first sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          className="min-h-[44px] min-w-[44px] p-2 sm:min-h-0 sm:min-w-0 sm:p-1.5"
        >
          <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="min-h-[44px] px-4 sm:min-h-0 sm:px-3"
        >
          Hoy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          className="min-h-[44px] min-w-[44px] p-2 sm:min-h-0 sm:min-w-0 sm:p-1.5"
        >
          <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      {/* View selector */}
      <div className="flex justify-center rounded-lg border border-gray-300 bg-white p-1 sm:justify-end">
        <button
          onClick={() => onViewChange('month')}
          className={`min-h-[36px] rounded px-3 py-1.5 text-xs font-medium transition-colors sm:min-h-0 sm:px-3 sm:py-1 sm:text-sm ${
            view === 'month'
              ? 'bg-[#CC0000] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Mes
        </button>
        <button
          onClick={() => onViewChange('week')}
          className={`min-h-[36px] rounded px-3 py-1.5 text-xs font-medium transition-colors sm:min-h-0 sm:px-3 sm:py-1 sm:text-sm ${
            view === 'week'
              ? 'bg-[#CC0000] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="sm:hidden">Sem</span>
          <span className="hidden sm:inline">Semana</span>
        </button>
        <button
          onClick={() => onViewChange('day')}
          className={`min-h-[36px] rounded px-3 py-1.5 text-xs font-medium transition-colors sm:min-h-0 sm:px-3 sm:py-1 sm:text-sm ${
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
