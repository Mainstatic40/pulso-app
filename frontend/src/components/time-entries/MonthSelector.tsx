import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface MonthSelectorProps {
  year: number;
  month: number; // 0-11
  onChange: (year: number, month: number) => void;
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function MonthSelector({ year, month, onChange }: MonthSelectorProps) {
  const handlePrevious = () => {
    if (month === 0) {
      onChange(year - 1, 11);
    } else {
      onChange(year, month - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      onChange(year + 1, 0);
    } else {
      onChange(year, month + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    onChange(now.getFullYear(), now.getMonth());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth();
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Button variant="outline" size="sm" onClick={handlePrevious}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-[120px] text-center sm:min-w-[180px]">
        <span className="text-sm font-semibold text-gray-900 sm:text-lg">
          {monthNames[month]} {year}
        </span>
      </div>

      <Button variant="outline" size="sm" onClick={handleNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrentMonth() && (
        <Button variant="outline" size="sm" onClick={handleToday} className="hidden sm:flex">
          Mes actual
        </Button>
      )}
    </div>
  );
}

export function getMonthDateRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
