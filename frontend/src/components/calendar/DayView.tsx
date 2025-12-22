import { cn } from '../../lib/utils';
import { CalendarEvent } from './CalendarEvent';
import { CalendarTask } from './CalendarTask';
import type { EventWithRelations } from '../../services/event.service';
import type { TaskWithRelations } from '../../services/task.service';

interface DayViewProps {
  currentDate: Date;
  events: EventWithRelations[];
  tasks: TaskWithRelations[];
  onEventClick: (event: EventWithRelations) => void;
  onTaskClick: (task: TaskWithRelations) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function getEventsForHour(events: EventWithRelations[], date: Date, hour: number): EventWithRelations[] {
  return events.filter((event) => {
    const eventStart = new Date(event.startDatetime);
    const eventEnd = new Date(event.endDatetime);
    const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);

    // Event starts in this hour or spans this hour
    return (
      (isSameDay(eventStart, date) && eventStart.getHours() === hour) ||
      (eventStart < slotStart && eventEnd > slotStart && isSameDay(date, slotStart))
    );
  });
}

function getTasksForDay(tasks: TaskWithRelations[], date: Date): TaskWithRelations[] {
  return tasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    return isSameDay(dueDate, date);
  });
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function DayView({
  currentDate,
  events,
  tasks,
  onEventClick,
  onTaskClick,
}: DayViewProps) {
  const isDayToday = isToday(currentDate);
  const dayTasks = getTasksForDay(tasks, currentDate);
  const dayEvents = events.filter((event) => {
    const eventStart = new Date(event.startDatetime);
    const eventEnd = new Date(event.endDatetime);
    const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const dayEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);
    return eventStart <= dayEnd && eventEnd >= dayStart;
  });

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-center gap-4">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold',
              isDayToday ? 'bg-[#CC0000] text-white' : 'bg-gray-200 text-gray-900'
            )}
          >
            {currentDate.getDate()}
          </div>
          <div>
            <div className="text-lg font-semibold capitalize text-gray-900">
              {currentDate.toLocaleDateString('es-MX', { weekday: 'long' })}
            </div>
            <div className="text-sm text-gray-500 capitalize">
              {currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* All-day tasks section */}
      {dayTasks.length > 0 && (
        <div className="border-b border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 text-xs font-medium uppercase text-gray-500">
            Tareas con fecha limite hoy
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dayTasks.map((task) => (
              <CalendarTask key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </div>
        </div>
      )}

      {/* Events summary */}
      {dayEvents.length === 0 && dayTasks.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No hay eventos ni tareas para este dia
        </div>
      )}

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {HOURS.map((hour) => {
            const hourEvents = getEventsForHour(dayEvents, currentDate, hour);

            return (
              <div key={hour} className="flex min-h-[60px]">
                <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50 py-2 text-right pr-3 text-sm text-gray-500">
                  {formatHour(hour)}
                </div>
                <div className="flex-1 p-2">
                  <div className="space-y-1">
                    {hourEvents.map((event) => (
                      <CalendarEvent
                        key={event.id}
                        event={event}
                        onClick={onEventClick}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
