import { cn } from '../../lib/utils';
import { CalendarEvent } from './CalendarEvent';
import type { EventWithRelations } from '../../services/event.service';
import type { TaskWithRelations } from '../../services/task.service';

interface WeekViewProps {
  currentDate: Date;
  events: EventWithRelations[];
  tasks: TaskWithRelations[];
  onEventClick: (event: EventWithRelations) => void;
  onTaskClick: (task: TaskWithRelations) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am to 9pm (7-21)
const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function getWeekDays(date: Date): Date[] {
  const days: Date[] = [];
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }

  return days;
}

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

function getEventsForDayAndHour(
  events: EventWithRelations[],
  date: Date,
  hour: number
): EventWithRelations[] {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return events.filter((event) => {
    // If event has days with shifts, use shift times
    if (event.days && event.days.length > 0) {
      const dayData = event.days.find((d) => d.date.split('T')[0] === dateStr);
      if (!dayData || !dayData.shifts || dayData.shifts.length === 0) {
        return false;
      }

      // Check if any shift starts at this hour
      return dayData.shifts.some((shift) => {
        const shiftStartHour = parseInt(shift.startTime.split(':')[0], 10);
        return shiftStartHour === hour;
      });
    }

    // Fallback for events without days data
    const eventStart = new Date(event.startDatetime);
    const eventEnd = new Date(event.endDatetime);
    const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);

    return (
      isSameDay(eventStart, date) &&
      eventStart.getHours() === hour
    ) || (
      eventStart < slotStart &&
      eventEnd > slotStart &&
      isSameDay(date, slotStart) &&
      hour === Math.max(0, eventStart.getHours())
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

export function WeekView({
  currentDate,
  events,
  tasks,
  onEventClick,
  onTaskClick,
}: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex">
        {/* Hours column */}
        <div className="w-[60px] flex-shrink-0 border-r border-gray-200">
          {/* Empty header cell */}
          <div className="h-[80px] border-b border-gray-200 bg-gray-50" />
          {/* Hour labels */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[40px] border-b border-gray-200 bg-white py-2 text-right pr-2 text-xs text-gray-500"
            >
              {formatHour(hour)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day, index) => {
          const isDayToday = isToday(day);
          const dayTasks = getTasksForDay(tasks, day);
          const isLastDay = index === weekDays.length - 1;

          return (
            <div
              key={index}
              className={cn(
                'flex-1 min-w-0',
                !isLastDay && 'border-r border-gray-200'
              )}
            >
              {/* Day header */}
              <div className="h-[80px] border-b border-gray-200 bg-gray-50 py-2 text-center overflow-hidden">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {DAYS_OF_WEEK[index]}
                </div>
                <div
                  className={cn(
                    'mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                    isDayToday ? 'bg-[#CC0000] text-white' : 'text-gray-900'
                  )}
                >
                  {day.getDate()}
                </div>
                {/* Tasks for the day */}
                {dayTasks.length > 0 && (
                  <button
                    onClick={() => onTaskClick(dayTasks[0])}
                    className="mt-1 px-1 truncate text-xs text-gray-500 hover:text-gray-700 w-full"
                  >
                    {dayTasks.length} tarea{dayTasks.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>

              {/* Hour cells for this day */}
              {HOURS.map((hour) => {
                const hourEvents = getEventsForDayAndHour(events, day, hour);

                return (
                  <div
                    key={hour}
                    className="h-[40px] border-b border-gray-200 p-1 overflow-hidden"
                  >
                    {hourEvents.map((event) => (
                      <CalendarEvent
                        key={event.id}
                        event={event}
                        onClick={onEventClick}
                        selectedDate={day}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
