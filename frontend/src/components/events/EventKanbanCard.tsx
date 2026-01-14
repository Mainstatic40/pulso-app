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

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
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

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-lg border border-l-4 bg-white p-3 shadow-sm transition-all hover:shadow-md ${borderColor}`}
    >
      {/* Title */}
      <h4 className="font-medium text-gray-900 line-clamp-2 text-sm">{event.name}</h4>

      {/* Event Type Badge */}
      {eventTypeInfo && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            {eventTypeInfo.icon}
            {eventTypeInfo.label}
          </span>
        </div>
      )}

      {/* Date and Time */}
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>
            {formatDateTime(event.startDatetime)}
            {!isSameDay && ` - ${formatDateTime(event.endDatetime)}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>
            {formatTime(event.startDatetime)} - {formatTime(event.endDatetime)}
          </span>
        </div>
      </div>

      {/* Assignees */}
      {assignees.length > 0 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {assignees.length} asignado{assignees.length !== 1 ? 's' : ''}
          </span>
          <AvatarGroup users={assignees} max={3} size="sm" />
        </div>
      )}
    </div>
  );
}
