import { cn } from '../../lib/utils';
import { CalendarEvent } from './CalendarEvent';
import { CalendarTask } from './CalendarTask';
import type { EventWithRelations } from '../../services/event.service';
import type { TaskWithRelations } from '../../services/task.service';

interface MonthViewProps {
  currentDate: Date;
  events: EventWithRelations[];
  tasks: TaskWithRelations[];
  onEventClick: (event: EventWithRelations) => void;
  onTaskClick: (task: TaskWithRelations) => void;
  onDayClick: (date: Date) => void;
}

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const DAYS_OF_WEEK_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Get the day of week (0 = Sunday, adjust for Monday start)
  let startDay = firstDayOfMonth.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const days: Date[] = [];

  // Add days from previous month
  for (let i = startDay - 1; i >= 0; i--) {
    const day = new Date(year, month, -i);
    days.push(day);
  }

  // Add days of current month
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Add days from next month to complete the grid (6 rows)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
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

function getEventsForDay(events: EventWithRelations[], date: Date): EventWithRelations[] {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return events.filter((event) => {
    // If event has days with shifts, only show on days that have shifts
    if (event.days && event.days.length > 0) {
      return event.days.some((day) => {
        const dayDateStr = day.date.split('T')[0];
        return dayDateStr === dateStr && day.shifts && day.shifts.length > 0;
      });
    }

    // Fallback for events without days data: use date range
    const eventStart = new Date(event.startDatetime);
    const eventEnd = new Date(event.endDatetime);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    return eventStart <= dayEnd && eventEnd >= dayStart;
  });
}

function getTasksForDay(tasks: TaskWithRelations[], date: Date): TaskWithRelations[] {
  return tasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    return isSameDay(dueDate, date);
  });
}

export function MonthView({
  currentDate,
  events,
  tasks,
  onEventClick,
  onTaskClick,
  onDayClick,
}: MonthViewProps) {
  const days = getMonthDays(currentDate);
  const currentMonth = currentDate.getMonth();

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {DAYS_OF_WEEK.map((day, index) => (
          <div
            key={day}
            className="py-1.5 text-center text-[10px] font-semibold uppercase text-gray-500 sm:py-2 sm:text-xs"
          >
            {/* Show single letter on mobile, short name on desktop */}
            <span className="sm:hidden">{DAYS_OF_WEEK_SHORT[index]}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(events, day);
          const dayTasks = getTasksForDay(tasks, day);
          const isCurrentMonth = day.getMonth() === currentMonth;
          const isDayToday = isToday(day);
          const totalItems = dayEvents.length + dayTasks.length;

          return (
            <div
              key={index}
              className={cn(
                'min-h-[60px] border-b border-r border-gray-200 p-0.5 sm:min-h-[100px] sm:p-1',
                !isCurrentMonth && 'bg-gray-50'
              )}
            >
              <button
                onClick={() => onDayClick(day)}
                className={cn(
                  'mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors sm:mb-1 sm:h-7 sm:w-7 sm:text-sm',
                  isDayToday
                    ? 'bg-[#CC0000] text-white'
                    : isCurrentMonth
                    ? 'text-gray-900 hover:bg-gray-100'
                    : 'text-gray-400 hover:bg-gray-100'
                )}
              >
                {day.getDate()}
              </button>

              <div className="space-y-0.5 sm:space-y-1">
                {/* On mobile, show dots for events; on desktop, show event names */}
                <div className="hidden sm:block">
                  {dayEvents.slice(0, 2).map((event) => (
                    <CalendarEvent
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      compact
                      selectedDate={day}
                    />
                  ))}
                  {dayTasks.slice(0, 2 - dayEvents.length).map((task) => (
                    <CalendarTask
                      key={task.id}
                      task={task}
                      onClick={onTaskClick}
                      compact
                    />
                  ))}
                </div>

                {/* Mobile: show colored dots */}
                <div className="flex flex-wrap gap-0.5 sm:hidden">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="h-1.5 w-1.5 rounded-full bg-blue-500"
                      aria-label={event.name}
                    />
                  ))}
                  {dayTasks.slice(0, 3 - dayEvents.length).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      )}
                      aria-label={task.title}
                    />
                  ))}
                </div>

                {/* More items indicator */}
                {totalItems > 2 && (
                  <button
                    onClick={() => onDayClick(day)}
                    className="hidden w-full text-center text-xs text-gray-500 hover:text-gray-700 sm:block"
                  >
                    +{totalItems - 2} mas
                  </button>
                )}
                {totalItems > 3 && (
                  <button
                    onClick={() => onDayClick(day)}
                    className="w-full text-center text-[10px] text-gray-500 hover:text-gray-700 sm:hidden"
                  >
                    +{totalItems - 3}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
