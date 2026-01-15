import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlayCircle, StopCircle } from 'lucide-react';
import { useAuthContext } from '../stores/auth.store.tsx';
import { timeEntryService } from '../services/time-entry.service';
import { taskService, type TaskWithRelations } from '../services/task.service';
import { eventService } from '../services/event.service';
import { equipmentAssignmentService } from '../services/equipment-assignment.service';
import { reportService } from '../services/report.service';
import { monthlyHoursConfigService, DEFAULT_HOURS_PER_DAY } from '../services/monthly-hours-config.service';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  DashboardStats,
  PendingTasksList,
  UpcomingEventsList,
  EquipmentInUse,
  HoursProgressCard,
} from '../components/dashboard';
import { cn } from '../lib/utils';

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format date to YYYY-MM-DD using LOCAL time (not UTC)
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthDateRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start,
    end,
    startStr: formatDateLocal(start),
    endStr: formatDateLocal(end),
  };
}

function getWeekDateRange() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    monday,
    sunday,
    mondayStr: formatDateLocal(monday),
    sundayStr: formatDateLocal(sunday),
  };
}

export function Dashboard() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const isBecario = user?.role === 'becario';
  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const { startStr: monthStart, endStr: monthEnd } = getMonthDateRange(currentYear, currentMonth);
  const { mondayStr, sundayStr } = getWeekDateRange();

  // Active session query (for clock in/out)
  const { data: activeSession, isLoading: isLoadingActive } = useQuery({
    queryKey: ['time-entries', 'active'],
    queryFn: () => timeEntryService.getActive(),
    refetchInterval: 30000,
    enabled: isBecario,
  });

  // Target hours configuration
  const { data: targetData } = useQuery({
    queryKey: ['monthly-hours-config', currentYear, currentMonth + 1],
    queryFn: () => monthlyHoursConfigService.getByMonth(currentYear, currentMonth + 1),
  });
  // Use configured target or calculate default (workdays × 4 hours)
  const totalWorkdays = targetData?.totalWorkdays || 22;
  const targetHours = targetData?.targetHours || totalWorkdays * DEFAULT_HOURS_PER_DAY;
  const configStartDate = targetData?.startDate || null;

  // Monthly hours for becario - fetch entries directly like TimeEntries.tsx does
  // Use configured start date if available for filtering
  const becarioEffectiveDateFrom = configStartDate || monthStart;

  const { data: monthlyEntriesData, isLoading: isLoadingMonthlyEntries } = useQuery({
    queryKey: ['time-entries', 'monthly', currentYear, currentMonth, user?.id, configStartDate],
    queryFn: () => timeEntryService.getAll({
      userId: user!.id,
      dateFrom: becarioEffectiveDateFrom,
      dateTo: monthEnd,
      limit: 100,
    }),
    enabled: isBecario && !!user?.id,
  });

  // Monthly hours for admin - use report service for team totals
  // Use configured start date if available
  const effectiveDateFrom = configStartDate || monthStart;

  const { data: teamHoursData, isLoading: isLoadingTeamHours } = useQuery({
    queryKey: ['hours-by-user', currentYear, currentMonth, configStartDate],
    queryFn: () => reportService.getHoursByUser({
      dateFrom: effectiveDateFrom,
      dateTo: monthEnd,
    }),
    enabled: isAdminOrSupervisor,
  });

  // Calculate monthly hours - becario from entries, admin from report (using weekday hours for progress)
  const monthlyHours = isBecario
    ? (monthlyEntriesData?.data || []).reduce((sum, e) => sum + Number(e.totalHours || 0), 0)
    : teamHoursData?.reduce((sum, h) => sum + (h.weekdayHours || 0), 0) || 0;

  const isLoadingMonthlyHours = isBecario ? isLoadingMonthlyEntries : isLoadingTeamHours;

  // Weekly hours breakdown
  const { data: weeklyEntries } = useQuery({
    queryKey: ['time-entries', 'weekly', user?.id, mondayStr],
    queryFn: () => timeEntryService.getAll({
      userId: isBecario ? user?.id : undefined,
      dateFrom: mondayStr,
      dateTo: sundayStr,
      limit: 100,
    }),
    enabled: isBecario,
  });

  // Calculate weekly hours by day
  const weekdayHours = (() => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    const hoursByDay: { day: string; hours: number }[] = days.map(day => ({ day, hours: 0 }));

    if (weeklyEntries?.data) {
      weeklyEntries.data.forEach(entry => {
        const entryDate = new Date(entry.clockIn);
        const dayOfWeek = entryDate.getDay();
        const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;
        if (dayIndex >= 0 && dayIndex < 5 && entry.totalHours) {
          hoursByDay[dayIndex].hours += Number(entry.totalHours);
        }
      });
    }

    return hoursByDay;
  })();

  // Pending tasks - we'll fetch and filter on the frontend
  const { data: tasksResponse, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', 'dashboard', user?.id, isBecario],
    queryFn: () => taskService.getAll({
      assigneeId: isBecario ? user?.id : undefined,
      limit: 20,
    }),
  });

  // Filter to only pending and in_progress tasks
  const pendingTasks: TaskWithRelations[] = (tasksResponse?.data || [])
    .filter(task => task.status === 'pending' || task.status === 'in_progress')
    .slice(0, 10);

  // Upcoming events - all users see all events (informational for the office)
  const { data: upcomingEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => eventService.getUpcoming(),
  });

  // Equipment in use
  const { data: equipmentResponse, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['equipment-assignments', 'active', user?.id, isBecario],
    queryFn: () => equipmentAssignmentService.getAll({
      active: true,
      userId: isBecario ? user?.id : undefined,
      limit: 20,
    }),
    refetchInterval: 30000,
  });

  const equipmentInUse = equipmentResponse?.data || [];

  // Clock mutations
  const clockInMutation = useMutation({
    mutationFn: () => timeEntryService.clockIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => timeEntryService.clockOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['hours-by-user'] });
    },
  });

  const handleClockToggle = () => {
    if (activeSession) {
      clockOutMutation.mutate();
    } else {
      clockInMutation.mutate();
    }
  };

  const isClockLoading = clockInMutation.isPending || clockOutMutation.isPending;

  return (
    <div className="w-full max-w-full space-y-4 overflow-hidden sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500">
            {isAdminOrSupervisor ? 'Panel de administración' : 'Tu resumen del día'}
          </p>
        </div>
        <p className="text-sm font-medium text-gray-600">
          {monthNames[currentMonth]} {currentYear}
        </p>
      </div>

      {/* Clock In/Out Button - Only for Becarios */}
      {isBecario && (
        <Card className={cn(
          'border-2 transition-colors',
          activeSession ? 'border-green-500 bg-green-50' : 'border-gray-200'
        )}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h3 className="font-medium text-gray-900">
                {activeSession ? 'Sesión Activa' : 'Sin sesión activa'}
              </h3>
              {activeSession && (
                <p className="text-sm text-gray-500">
                  Entrada: {formatTime(activeSession.clockIn)}
                </p>
              )}
            </div>
            <Button
              size="lg"
              variant={activeSession ? 'danger' : 'primary'}
              onClick={handleClockToggle}
              isLoading={isClockLoading || isLoadingActive}
              className="w-full sm:w-auto sm:min-w-[160px]"
            >
              {activeSession ? (
                <>
                  <StopCircle className="mr-2 h-5 w-5" />
                  Registrar Salida
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Registrar Entrada
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <DashboardStats
        monthlyHours={Number(monthlyHours)}
        targetHours={isAdminOrSupervisor ? targetHours * (teamHoursData?.length || 1) : targetHours}
        pendingTasks={pendingTasks.length}
        upcomingEvents={(upcomingEvents || []).length}
        equipmentInUse={equipmentInUse.length}
        isLoading={{
          hours: isLoadingMonthlyHours,
          tasks: isLoadingTasks,
          events: isLoadingEvents,
          equipment: isLoadingEquipment,
        }}
      />

      {/* Tasks and Events */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <PendingTasksList
            tasks={pendingTasks}
            isLoading={isLoadingTasks}
            isBecario={isBecario}
          />
        </div>
        <div className="min-w-0">
          <UpcomingEventsList
            events={upcomingEvents || []}
            isLoading={isLoadingEvents}
            isBecario={isBecario}
          />
        </div>
      </div>

      {/* Equipment in Use */}
      {equipmentInUse.length > 0 && (
        <EquipmentInUse
          assignments={equipmentInUse}
          isLoading={isLoadingEquipment}
          isBecario={isBecario}
        />
      )}

      {/* Hours Progress */}
      <HoursProgressCard
        monthlyHours={Number(monthlyHours)}
        targetHours={isAdminOrSupervisor ? targetHours * (teamHoursData?.length || 1) : targetHours}
        weeklyHours={isBecario ? weekdayHours : undefined}
        monthName={monthNames[currentMonth]}
        year={currentYear}
        isLoading={isLoadingMonthlyHours}
        isBecario={isBecario}
      />
    </div>
  );
}
