import { cn } from '../../lib/utils';
import { CalendarEvent } from './CalendarEvent';
import { CalendarTask } from './CalendarTask';
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
const DAYS_OF_WEEK_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

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
    // Use executionDate if available, otherwise dueDate
    const taskDate = task.executionDate ? new Date(task.executionDate) : new Date(task.dueDate);
    return isSameDay(taskDate, date);
  });
}

function getTasksForDayAndHour(tasks: TaskWithRelations[], date: Date, hour: number): TaskWithRelations[] {
  const dayTasks = getTasksForDay(tasks, date);

  return dayTasks.filter((task) => {
    // Get the start hour based on shift type
    let startHour: number | null = null;

    if (task.shift === 'morning' && task.morningStartTime) {
      startHour = parseInt(task.morningStartTime.split(':')[0], 10);
    } else if (task.shift === 'afternoon' && task.afternoonStartTime) {
      startHour = parseInt(task.afternoonStartTime.split(':')[0], 10);
    } else if (task.shift === 'both') {
      // For 'both', show at morning start time
      if (task.morningStartTime) {
        startHour = parseInt(task.morningStartTime.split(':')[0], 10);
      }
    }

    // Default to 9am if no specific time
    if (startHour === null) {
      startHour = 9;
    }

    return startHour === hour;
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
      {/* Horizontal scroll container for mobile */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[600px] sm:min-w-0">
          <div className="flex">
            {/* Hours column */}
            <div className="w-[45px] flex-shrink-0 border-r border-gray-200 sm:w-[60px]">
              {/* Empty header cell */}
              <div className="h-[60px] border-b border-gray-200 bg-gray-50 sm:h-[80px]" />
              {/* Hour labels */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-[36px] border-b border-gray-200 bg-white py-1.5 pr-1 text-right text-[10px] text-gray-500 sm:h-[40px] sm:py-2 sm:pr-2 sm:text-xs"
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
                    'min-w-0 flex-1',
                    !isLastDay && 'border-r border-gray-200'
                  )}
                >
                  {/* Day header */}
                  <div className="h-[60px] overflow-hidden border-b border-gray-200 bg-gray-50 py-1 text-center sm:h-[80px] sm:py-2">
                    <div className="text-[10px] font-medium uppercase text-gray-500 sm:text-xs">
                      {/* Show single letter on mobile, short name on desktop */}
                      <span className="sm:hidden">{DAYS_OF_WEEK_SHORT[index]}</span>
                      <span className="hidden sm:inline">{DAYS_OF_WEEK[index]}</span>
                    </div>
                    <div
                      className={cn(
                        'mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:mt-1 sm:h-8 sm:w-8 sm:text-sm',
                        isDayToday ? 'bg-[#CC0000] text-white' : 'text-gray-900'
                      )}
                    >
                      {day.getDate()}
                    </div>
                    {/* Task count */}
                    {dayTasks.length > 0 && (
                      <button
                        onClick={() => onTaskClick(dayTasks[0])}
                        className="mt-0.5 w-full truncate px-0.5 text-[10px] text-gray-500 hover:text-gray-700 sm:mt-1 sm:px-1 sm:text-xs"
                      >
                        <span className="hidden sm:inline">{dayTasks.length} tarea{dayTasks.length !== 1 ? 's' : ''}</span>
                        <span className="sm:hidden">{dayTasks.length}t</span>
                      </button>
                    )}
                  </div>

                  {/* Hour cells for this day */}
                  {HOURS.map((hour) => {
                    const hourEvents = getEventsForDayAndHour(events, day, hour);
                    const hourTasks = getTasksForDayAndHour(tasks, day, hour);

                    return (
                      <div
                        key={hour}
                        className="h-[36px] overflow-hidden border-b border-gray-200 p-0.5 sm:h-[40px] sm:p-1"
                      >
                        {hourEvents.map((event) => (
                          <CalendarEvent
                            key={event.id}
                            event={event}
                            onClick={onEventClick}
                            selectedDate={day}
                          />
                        ))}
                        {hourTasks.map((task) => (
                          <CalendarTask
                            key={task.id}
                            task={task}
                            onClick={onTaskClick}
                            compact
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
      </div>
    </div>
  );
}
