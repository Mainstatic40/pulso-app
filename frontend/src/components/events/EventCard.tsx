import { Calendar, Clock, FileText } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AvatarGroup } from '../ui/Avatar';
import type { EventWithRelations } from '../../services/event.service';

interface EventCardProps {
  event: EventWithRelations;
  onClick: () => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours === 0) return `${diffMinutes}m`;
  if (diffMinutes === 0) return `${diffHours}h`;
  return `${diffHours}h ${diffMinutes}m`;
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

const statusConfig = {
  ongoing: { label: 'En curso', variant: 'success' as const },
  today: { label: 'Hoy', variant: 'warning' as const },
  upcoming: { label: 'Próximo', variant: 'info' as const },
  past: { label: 'Pasado', variant: 'default' as const },
};

export function EventCard({ event, onClick }: EventCardProps) {
  const status = getEventStatus(event.startDatetime, event.endDatetime);
  const statusInfo = statusConfig[status];
  const assignees = event.assignees?.map((a) => ({ name: a.user.name })) || [];

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900">{event.name}</h3>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        {event.description && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">{event.description}</p>
        )}

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{formatDate(event.startDatetime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>
              {formatTime(event.startDatetime)} - {formatTime(event.endDatetime)}
            </span>
            <span className="text-gray-400">
              ({formatDuration(event.startDatetime, event.endDatetime)})
            </span>
          </div>
        </div>

        {event.clientRequirements && (
          <div className="mt-3 rounded bg-yellow-50 p-2">
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 text-yellow-600" />
              <p className="line-clamp-2 text-xs text-yellow-700">
                {event.clientRequirements}
              </p>
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
