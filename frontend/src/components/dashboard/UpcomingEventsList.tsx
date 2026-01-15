import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Church, GraduationCap, Camera, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { cn } from '../../lib/utils';
import type { EventWithRelations } from '../../services/event.service';

type EventType = 'civic' | 'church' | 'yearbook' | 'congress';

const eventTypeConfig: Record<EventType, { label: string; icon: React.ReactNode; color: string }> = {
  civic: { label: 'Cívico', icon: <GraduationCap className="h-4 w-4" />, color: 'text-blue-600 bg-blue-100' },
  church: { label: 'Religioso', icon: <Church className="h-4 w-4" />, color: 'text-purple-600 bg-purple-100' },
  yearbook: { label: 'Anuario', icon: <Camera className="h-4 w-4" />, color: 'text-amber-600 bg-amber-100' },
  congress: { label: 'Congreso', icon: <Users className="h-4 w-4" />, color: 'text-green-600 bg-green-100' },
};

function formatEventDateTime(startDatetime: string, endDatetime: string): string {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(start);
  eventDate.setHours(0, 0, 0, 0);

  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let dateText: string;
  if (diffDays === 0) {
    dateText = 'Hoy';
  } else if (diffDays === 1) {
    dateText = 'Mañana';
  } else if (diffDays < 7) {
    dateText = start.toLocaleDateString('es-MX', { weekday: 'long' });
    dateText = dateText.charAt(0).toUpperCase() + dateText.slice(1);
  } else {
    dateText = start.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }

  const startTime = start.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return `${dateText} ${startTime} - ${endTime}`;
}

interface UpcomingEventsListProps {
  events: EventWithRelations[];
  isLoading?: boolean;
  isBecario?: boolean;
  maxItems?: number;
}

export function UpcomingEventsList({
  events,
  isLoading = false,
  isBecario = true,
  maxItems = 5
}: UpcomingEventsListProps) {
  const displayEvents = events.slice(0, maxItems);

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Calendar className="h-5 w-5 flex-shrink-0 text-purple-600" />
          <span className="truncate">{isBecario ? 'Mis Próximos Eventos' : 'Próximos Eventos'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <Spinner />
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <Calendar className="mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">Sin eventos próximos</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-2">
              {displayEvents.map((event) => {
                const typeConfig = eventTypeConfig[(event.eventType as EventType) || 'civic'];
                const dateTime = formatEventDateTime(event.startDatetime, event.endDatetime);

                return (
                  <Link
                    key={event.id}
                    to={`/calendar?eventId=${event.id}`}
                    className="group block rounded-lg border border-gray-200 p-3 transition-all hover:border-gray-300 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', typeConfig.color)}>
                        {typeConfig.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900 group-hover:text-blue-600">
                          {event.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {dateTime}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <Link
              to="/calendar"
              className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver calendario
              <ChevronRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
