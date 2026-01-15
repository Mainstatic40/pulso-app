import { Calendar, FileText, Flag, Church, Camera, Mic2 } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AvatarGroup } from '../ui/Avatar';
import type { EventWithRelations } from '../../services/event.service';
import type { EventType } from '../../types';

interface EventCardProps {
  event: EventWithRelations;
  onClick: () => void;
}

function formatDate(dateString: string): string {
  // Extract date part to avoid timezone issues
  const datePart = dateString.split('T')[0];
  const date = new Date(datePart + 'T12:00:00');
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getEventStatus(start: string, end: string): 'today' | 'upcoming' | 'past' | 'ongoing' {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  if (now >= startDate && now <= endDate) return 'ongoing';
  if (eventDay.getTime() === today.getTime()) return 'today';
  if (startDate > now) return 'upcoming';
  return 'past';
}

function getDaysCount(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

const statusConfig = {
  ongoing: { label: 'En curso', variant: 'success' as const },
  today: { label: 'Hoy', variant: 'warning' as const },
  upcoming: { label: 'Próximo', variant: 'info' as const },
  past: { label: 'Pasado', variant: 'default' as const },
};

const eventTypeConfig: Record<EventType, { label: string; icon: React.ReactNode; color: string }> = {
  civic: {
    label: 'Cívico',
    icon: <Flag className="h-3.5 w-3.5" />,
    color: 'bg-blue-100 text-blue-800',
  },
  church: {
    label: 'Iglesia',
    icon: <Church className="h-3.5 w-3.5" />,
    color: 'bg-purple-100 text-purple-800',
  },
  yearbook: {
    label: 'Anuario',
    icon: <Camera className="h-3.5 w-3.5" />,
    color: 'bg-amber-100 text-amber-800',
  },
  congress: {
    label: 'Congreso',
    icon: <Mic2 className="h-3.5 w-3.5" />,
    color: 'bg-green-100 text-green-800',
  },
};

export function EventCard({ event, onClick }: EventCardProps) {
  const status = getEventStatus(event.startDatetime, event.endDatetime);
  const statusInfo = statusConfig[status];
  const daysCount = getDaysCount(event.startDatetime, event.endDatetime);

  // Get assignees from days/shifts or legacy assignees
  const assignees: Array<{ name: string; profileImage?: string | null }> = [];
  if (event.days && event.days.length > 0) {
    // Collect unique users from all shifts
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

  const eventTypeInfo = event.eventType ? eventTypeConfig[event.eventType] : null;

  return (
    <Card className="w-full cursor-pointer overflow-hidden transition-shadow hover:shadow-md" onClick={onClick}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-gray-900 sm:text-base">{event.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
              {eventTypeInfo && (
                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-xs ${eventTypeInfo.color}`}>
                  {eventTypeInfo.icon}
                  <span className="hidden sm:inline">{eventTypeInfo.label}</span>
                </span>
              )}
              {daysCount > 1 && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 sm:px-2 sm:text-xs">
                  {daysCount} días
                </span>
              )}
            </div>
          </div>
          <Badge variant={statusInfo.variant} className="flex-shrink-0 text-[10px] sm:text-xs">{statusInfo.label}</Badge>
        </div>

        {event.description && (
          <p className="mt-2 line-clamp-2 text-xs text-gray-500 sm:text-sm">{event.description}</p>
        )}

        <div className="mt-3 sm:mt-4">
          <div className="flex flex-wrap items-center gap-1 text-xs text-gray-600 sm:gap-2 sm:text-sm">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 sm:h-4 sm:w-4" />
            <span>{formatDate(event.startDatetime)}</span>
            {daysCount > 1 && (
              <span className="text-gray-400">
                — {formatDate(event.endDatetime)}
              </span>
            )}
          </div>
        </div>

        {event.clientRequirements && (
          <div className="mt-2 rounded bg-yellow-50 p-1.5 sm:mt-3 sm:p-2">
            <div className="flex items-start gap-1.5 sm:gap-2">
              <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-600 sm:h-4 sm:w-4" />
              <p className="line-clamp-2 text-[10px] text-yellow-700 sm:text-xs">{event.clientRequirements}</p>
            </div>
          </div>
        )}

        {assignees.length > 0 && (
          <div className="mt-3 flex items-center justify-between sm:mt-4">
            <span className="text-[10px] text-gray-500 sm:text-xs">
              {assignees.length} asignado{assignees.length !== 1 ? 's' : ''}
            </span>
            <AvatarGroup users={assignees} max={4} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
