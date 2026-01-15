import { Calendar, Clock, Flag, Church, Camera, Mic2 } from 'lucide-react';
import { AvatarGroup } from '../ui/Avatar';
import type { EventWithRelations } from '../../services/event.service';
import type { EventType } from '../../types';

interface EventKanbanCardProps {
  event: EventWithRelations;
  onClick: () => void;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}

// Get time range from shifts (first start to last end)
function getEventTimeRange(event: EventWithRelations): { start: string; end: string } | null {
  if (!event.days?.length) return null;

  const allShifts = event.days.flatMap(day => day.shifts || []);
  if (!allShifts.length) return null;

  // Sort shifts by start time
  const sortedByStart = [...allShifts].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
  const sortedByEnd = [...allShifts].sort((a, b) =>
    a.endTime.localeCompare(b.endTime)
  );

  return {
    start: sortedByStart[0].startTime,
    end: sortedByEnd[sortedByEnd.length - 1].endTime,
  };
}

const eventTypeConfig: Record<EventType, { label: string; icon: React.ReactNode; borderColor: string }> = {
  civic: {
    label: 'Civico',
    icon: <Flag className="h-3 w-3" />,
    borderColor: 'border-l-blue-500',
  },
  church: {
    label: 'Iglesia',
    icon: <Church className="h-3 w-3" />,
    borderColor: 'border-l-purple-500',
  },
  yearbook: {
    label: 'Anuario',
    icon: <Camera className="h-3 w-3" />,
    borderColor: 'border-l-amber-500',
  },
  congress: {
    label: 'Congreso',
    icon: <Mic2 className="h-3 w-3" />,
    borderColor: 'border-l-green-500',
  },
};

export function EventKanbanCard({ event, onClick }: EventKanbanCardProps) {
  const eventTypeInfo = event.eventType ? eventTypeConfig[event.eventType] : null;
  const borderColor = eventTypeInfo?.borderColor || 'border-l-gray-300';

  // Get assignees from days/shifts or legacy assignees
  const assignees: Array<{ name: string; profileImage?: string | null }> = [];
  if (event.days && event.days.length > 0) {
    const userMap = new Map<string, { name: string; profileImage?: string | null }>();
    event.days.forEach((day) => {
      day.shifts?.forEach((shift) => {
        if (shift.user && !userMap.has(shift.userId)) {
          userMap.set(shift.userId, { name: shift.user.name, profileImage: shift.user.profileImage });
        }
      });
    });
    userMap.forEach((userData) => assignees.push(userData));
  } else if (event.assignees) {
    event.assignees.forEach((a) => assignees.push({ name: a.user.name, profileImage: a.user.profileImage }));
  }

  const isSameDay = formatDateTime(event.startDatetime) === formatDateTime(event.endDatetime);
  const timeRange = getEventTimeRange(event);

  return (
    <div
      onClick={onClick}
      className={`w-full cursor-pointer overflow-hidden rounded-lg border border-l-4 bg-white p-2.5 shadow-sm transition-all hover:shadow-md sm:p-3 ${borderColor}`}
    >
      {/* Title */}
      <h4 className="line-clamp-2 text-xs font-medium text-gray-900 sm:text-sm">{event.name}</h4>

      {/* Event Type Badge */}
      {eventTypeInfo && (
        <div className="mt-1.5 sm:mt-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 sm:text-xs">
            {eventTypeInfo.icon}
            {eventTypeInfo.label}
          </span>
        </div>
      )}

      {/* Date and Time */}
      <div className="mt-1.5 space-y-0.5 sm:mt-2 sm:space-y-1">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 sm:gap-1.5 sm:text-xs">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {formatDateTime(event.startDatetime)}
            {!isSameDay && ` - ${formatDateTime(event.endDatetime)}`}
          </span>
        </div>
        {timeRange && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500 sm:gap-1.5 sm:text-xs">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{timeRange.start} - {timeRange.end}</span>
          </div>
        )}
      </div>

      {/* Assignees */}
      {assignees.length > 0 && (
        <div className="mt-2 flex items-center justify-between sm:mt-3">
          <span className="text-[10px] text-gray-400 sm:text-xs">
            {assignees.length} asignado{assignees.length !== 1 ? 's' : ''}
          </span>
          <AvatarGroup users={assignees} max={3} size="sm" />
        </div>
      )}
    </div>
  );
}
