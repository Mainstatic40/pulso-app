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
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{event.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {eventTypeInfo && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${eventTypeInfo.color}`}>
                  {eventTypeInfo.icon}
                  {eventTypeInfo.label}
                </span>
              )}
              {daysCount > 1 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {daysCount} días
                </span>
              )}
            </div>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        {event.description && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">{event.description}</p>
        )}

        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{formatDate(event.startDatetime)}</span>
            {daysCount > 1 && (
              <span className="text-gray-400">
                — {formatDate(event.endDatetime)}
              </span>
            )}
          </div>
        </div>

        {event.clientRequirements && (
          <div className="mt-3 rounded bg-yellow-50 p-2">
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 text-yellow-600" />
              <p className="line-clamp-2 text-xs text-yellow-700">{event.clientRequirements}</p>
            </div>
          </div>
        )}

        {assignees.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {assignees.length} asignado{assignees.length !== 1 ? 's' : ''}
            </span>
            <AvatarGroup users={assignees} max={4} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
