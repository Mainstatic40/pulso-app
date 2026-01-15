import { cn } from '../../lib/utils';
import type { EventWithRelations } from '../../services/event.service';

interface CalendarEventProps {
  event: EventWithRelations;
  onClick: (event: EventWithRelations) => void;
  compact?: boolean;
  selectedDate?: Date; // The specific day this event is being displayed for
}

// Get time range from shifts for a specific date
function getShiftTimeForDate(event: EventWithRelations, date: Date): string | null {
  if (!event.days?.length) return null;

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dayData = event.days.find((d) => d.date.split('T')[0] === dateStr);

  if (!dayData?.shifts?.length) return null;

  // Sort shifts and get first start time
  const sortedShifts = [...dayData.shifts].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return sortedShifts[0].startTime;
}

// Fallback: format time from datetime string
function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function CalendarEvent({ event, onClick, compact = false, selectedDate }: CalendarEventProps) {
  // Get time from shifts if selectedDate is provided, otherwise use startDatetime
  const displayTime = selectedDate
    ? getShiftTimeForDate(event, selectedDate) || formatTime(event.startDatetime)
    : formatTime(event.startDatetime);

  return (
    <button
      onClick={() => onClick(event)}
      className={cn(
        'w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors sm:px-2 sm:py-1 sm:text-xs',
        'bg-blue-100 text-blue-800 hover:bg-blue-200',
        compact ? 'truncate' : ''
      )}
    >
      {compact ? (
        <span className="truncate">{event.name}</span>
      ) : (
        <>
          <span className="font-semibold">{displayTime}</span>
          <span className="ml-1 truncate">{event.name}</span>
        </>
      )}
    </button>
  );
}
