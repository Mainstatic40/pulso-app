import { EventKanbanCard } from './EventKanbanCard';
import type { EventWithRelations } from '../../services/event.service';

export type EventColumnStatus = 'upcoming' | 'ongoing' | 'finished';

export interface EventColumnConfig {
  id: EventColumnStatus;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const eventColumnConfigs: EventColumnConfig[] = [
  {
    id: 'upcoming',
    title: 'Proximos',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'ongoing',
    title: 'En Curso',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'finished',
    title: 'Finalizados',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
];

interface EventKanbanColumnProps {
  config: EventColumnConfig;
  events: EventWithRelations[];
  onEventClick: (event: EventWithRelations) => void;
}

export function EventKanbanColumn({ config, events, onEventClick }: EventKanbanColumnProps) {
  return (
    <div className="flex h-full w-64 flex-shrink-0 flex-col sm:w-72 sm:min-w-[280px] sm:max-w-[320px] sm:flex-1 sm:flex-shrink">
      {/* Column Header */}
      <div className="mb-2 flex items-center gap-2 sm:mb-3">
        <div className={`h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3 ${config.color}`} />
        <h3 className="text-sm font-semibold text-gray-700 sm:text-base">{config.title}</h3>
        <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 sm:px-2 sm:text-xs">
          {events.length}
        </span>
      </div>

      {/* Column Content */}
      <div
        className={`flex-1 overflow-y-auto rounded-lg border-2 p-1.5 sm:p-2 ${config.bgColor} ${config.borderColor}`}
      >
        <div className="space-y-1.5 sm:space-y-2">
          {events.length === 0 ? (
            <div className="flex h-20 items-center justify-center text-xs text-gray-400 sm:h-24 sm:text-sm">
              Sin eventos
            </div>
          ) : (
            events.map((event) => (
              <EventKanbanCard
                key={event.id}
                event={event}
                onClick={() => onEventClick(event)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
