import { cn } from '../../lib/utils';
import type { EventWithRelations } from '../../services/event.service';

interface CalendarEventProps {
  event: EventWithRelations;
  onClick: (event: EventWithRelations) => void;
  compact?: boolean;
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function CalendarEvent({ event, onClick, compact = false }: CalendarEventProps) {
  return (
    <button
      onClick={() => onClick(event)}
      className={cn(
        'w-full text-left rounded px-2 py-1 text-xs font-medium transition-colors',
        'bg-blue-100 text-blue-800 hover:bg-blue-200',
        compact ? 'truncate' : ''
      )}
    >
      {compact ? (
        <span className="truncate">{event.name}</span>
      ) : (
        <>
          <span className="font-semibold">{formatTime(event.startDatetime)}</span>
          <span className="ml-1 truncate">{event.name}</span>
        </>
      )}
    </button>
  );
}
