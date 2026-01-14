import { useMemo } from 'react';
import { EventKanbanColumn, eventColumnConfigs, type EventColumnStatus } from './EventKanbanColumn';
import type { EventWithRelations } from '../../services/event.service';

interface EventKanbanBoardProps {
  events: EventWithRelations[];
  selectedMonth: Date; // For filtering upcoming and finished to current month
  onEventClick: (event: EventWithRelations) => void;
}

export function EventKanbanBoard({ events, selectedMonth, onEventClick }: EventKanbanBoardProps) {
  // Group events by status based on dates
  const eventsByStatus = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);

    const grouped: Record<EventColumnStatus, EventWithRelations[]> = {
      upcoming: [],
      ongoing: [],
      finished: [],
    };

    events.forEach((event) => {
      const startDate = new Date(event.startDatetime);
      const endDate = new Date(event.endDatetime);

      // Determine event status based on dates
      if (now >= startDate && now <= endDate) {
        // Event is currently ongoing - show all active events regardless of month
        grouped.ongoing.push(event);
      } else if (startDate > now) {
        // Event is in the future - filter by selected month
        if (startDate >= monthStart && startDate <= monthEnd) {
          grouped.upcoming.push(event);
        }
      } else if (endDate < now) {
        // Event has finished - filter by selected month
        if (endDate >= monthStart && endDate <= monthEnd) {
          grouped.finished.push(event);
        }
      }
    });

    // Sort events within each column
    // Upcoming: closest first
    grouped.upcoming.sort((a, b) =>
      new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()
    );
    // Ongoing: started most recently first
    grouped.ongoing.sort((a, b) =>
      new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime()
    );
    // Finished: most recently finished first
    grouped.finished.sort((a, b) =>
      new Date(b.endDatetime).getTime() - new Date(a.endDatetime).getTime()
    );

    return grouped;
  }, [events, selectedMonth]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {eventColumnConfigs.map((config) => (
        <EventKanbanColumn
          key={config.id}
          config={config}
          events={eventsByStatus[config.id]}
          onEventClick={onEventClick}
        />
      ))}
    </div>
  );
}
