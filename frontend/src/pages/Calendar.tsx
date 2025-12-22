import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarHeader, type CalendarView } from '../components/calendar/CalendarHeader';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { DayView } from '../components/calendar/DayView';
import { EventModal } from '../components/events/EventModal';
import { TaskModal } from '../components/tasks/TaskModal';
import { Spinner } from '../components/ui/Spinner';
import { eventService, type EventWithRelations } from '../services/event.service';
import { taskService, type TaskWithRelations } from '../services/task.service';

function getMonthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Get first day of previous month (to cover days shown from prev month)
  const start = new Date(year, month - 1, 1);
  // Get last day of next month (to cover days shown from next month)
  const end = new Date(year, month + 2, 0);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedEvent, setSelectedEvent] = useState<EventWithRelations | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const dateRange = useMemo(() => getMonthRange(currentDate), [currentDate]);

  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['events', 'calendar', dateRange.start, dateRange.end],
    queryFn: () =>
      eventService.getAll({
        dateFrom: dateRange.start,
        dateTo: dateRange.end,
        limit: 100,
      }),
  });

  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', 'calendar', dateRange.start, dateRange.end],
    queryFn: () =>
      taskService.getAll({
        dueDateFrom: dateRange.start,
        dueDateTo: dateRange.end,
        limit: 100,
      }),
  });

  const events = eventsData?.data || [];
  const tasks = tasksData?.data || [];
  const isLoading = isLoadingEvents || isLoadingTasks;

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView('day');
  };

  const handleEventClick = (event: EventWithRelations) => {
    setSelectedEvent(event);
  };

  const handleTaskClick = (task: TaskWithRelations) => {
    setSelectedTaskId(task.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visualiza eventos y tareas programadas
        </p>
      </div>

      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              tasks={tasks}
              onEventClick={handleEventClick}
              onTaskClick={handleTaskClick}
              onDayClick={handleDayClick}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              tasks={tasks}
              onEventClick={handleEventClick}
              onTaskClick={handleTaskClick}
            />
          )}
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              tasks={tasks}
              onEventClick={handleEventClick}
              onTaskClick={handleTaskClick}
            />
          )}
        </>
      )}

      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Task Modal */}
      <TaskModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}
