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
    <div className="flex h-full min-w-[280px] max-w-[320px] flex-1 flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${config.color}`} />
        <h3 className="font-semibold text-gray-700">{config.title}</h3>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
          {events.length}
        </span>
      </div>

      {/* Column Content */}
      <div
        className={`flex-1 overflow-y-auto rounded-lg border-2 p-2 ${config.bgColor} ${config.borderColor}`}
      >
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-gray-400">
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
