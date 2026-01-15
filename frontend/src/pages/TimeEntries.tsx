import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Calendar, CheckCircle, Timer, Sun, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { ClockButton, TimeEntryList, TeamHoursOverview, MonthSelector, getMonthDateRange, formatDateForApi } from '../components/time-entries';
import { timeEntryService, type TimeEntryWithEvent } from '../services/time-entry.service';
import { useAuthContext } from '../stores/auth.store.tsx';

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hrs`;
  return `${h}:${m.toString().padStart(2, '0')} hrs`;
}

// Becario view component with month selector
function BecarioTimeEntries() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // Get date range for selected month
  const { start, end } = getMonthDateRange(year, month);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  // Fetch active session
  const { data: activeSession, isLoading: isLoadingActive } = useQuery({
    queryKey: ['time-entries', 'active'],
    queryFn: () => timeEntryService.getActive(),
    refetchInterval: 30000,
  });

  // Fetch entries for selected month
  const { data: entriesResponse, isLoading: isLoadingEntries } = useQuery({
    queryKey: ['time-entries', 'list', year, month],
    queryFn: () =>
      timeEntryService.getAll({
        dateFrom: formatDateForApi(start),
        dateTo: formatDateForApi(end),
        limit: 100,
      }),
  });

  // Mutations
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
    },
  });

  const entries: TimeEntryWithEvent[] = entriesResponse?.data || [];
  const isClockLoading = clockInMutation.isPending || clockOutMutation.isPending || isLoadingActive;

  // Calculate summary from entries
  const summary = useMemo(() => {
    const today = new Date();

    // Helper to get local date string (YYYY-MM-DD)
    const getLocalDateStr = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const todayStr = getLocalDateStr(today);

    // Get start of current week (Monday) at midnight local time
    const weekStart = new Date(today);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    // End of today for comparison
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const completedSessions = entries.filter((e) => e.clockOut).length;
    const activeSessions = entries.filter((e) => !e.clockOut).length;
    const monthlyHours = entries.reduce((acc, e) => acc + Number(e.totalHours || 0), 0);

    // Daily hours (today only) - compare local dates
    const dailyHours = entries
      .filter((e) => {
        const entryDate = new Date(e.clockIn);
        const entryDateStr = getLocalDateStr(entryDate);
        return entryDateStr === todayStr;
      })
      .reduce((acc, e) => acc + Number(e.totalHours || 0), 0);

    // Weekly hours (current week) - compare local times
    const weeklyHours = entries
      .filter((e) => {
        const entryDate = new Date(e.clockIn);
        return entryDate >= weekStart && entryDate <= todayEnd;
      })
      .reduce((acc, e) => acc + Number(e.totalHours || 0), 0);

    return { dailyHours, weeklyHours, monthlyHours, completedSessions, activeSessions };
  }, [entries]);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  return (
    <div className="w-full max-w-full space-y-4 overflow-hidden sm:space-y-6">
      {/* Header with Month Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Registro de Horas</h1>
        <MonthSelector year={year} month={month} onChange={handleMonthChange} />
      </div>

      {/* Clock Button Section - Only show in current month */}
      {isCurrentMonth && (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center py-6 sm:py-8">
            <ClockButton
              isActive={!!activeSession}
              clockInTime={activeSession?.clockIn}
              onClockIn={() => clockInMutation.mutate()}
              onClockOut={() => clockOutMutation.mutate()}
              isLoading={isClockLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Month Summary Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <Calendar className="h-5 w-5 flex-shrink-0 text-red-600" />
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
              {monthNames[month]} {year}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {/* Diario */}
            <div className="rounded-lg bg-amber-50 p-3 text-center sm:p-4">
              <div className="flex items-center justify-center gap-2">
                <Sun className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5" />
              </div>
              <p className="mt-1 text-lg font-bold text-amber-700 sm:mt-2 sm:text-2xl">
                {formatDuration(summary.dailyHours)}
              </p>
              <p className="text-xs text-amber-600 sm:text-sm">Hoy</p>
            </div>

            {/* Semanal */}
            <div className="rounded-lg bg-blue-50 p-3 text-center sm:p-4">
              <div className="flex items-center justify-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
              </div>
              <p className="mt-1 text-lg font-bold text-blue-700 sm:mt-2 sm:text-2xl">
                {formatDuration(summary.weeklyHours)}
              </p>
              <p className="text-xs text-blue-600 sm:text-sm">Semana</p>
            </div>

            {/* Mensual */}
            <div className="rounded-lg bg-purple-50 p-3 text-center sm:p-4">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5" />
              </div>
              <p className="mt-1 text-lg font-bold text-purple-700 sm:mt-2 sm:text-2xl">
                {formatDuration(summary.monthlyHours)}
              </p>
              <p className="text-xs text-purple-600 sm:text-sm">Mes</p>
            </div>

            {/* Sesiones realizadas */}
            <div className="rounded-lg bg-green-50 p-3 text-center sm:p-4">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
              </div>
              <p className="mt-1 text-lg font-bold text-green-700 sm:mt-2 sm:text-2xl">{summary.completedSessions}</p>
              <p className="text-xs text-green-600 sm:text-sm">Sesiones</p>
            </div>

            {/* En curso */}
            <div className="col-span-2 rounded-lg bg-yellow-50 p-3 text-center sm:col-span-1 sm:p-4">
              <div className="flex items-center justify-center gap-2">
                <Timer className="h-4 w-4 text-yellow-600 sm:h-5 sm:w-5" />
              </div>
              <p className="mt-1 text-lg font-bold text-yellow-700 sm:mt-2 sm:text-2xl">{summary.activeSessions}</p>
              <p className="text-xs text-yellow-600 sm:text-sm">En curso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-gray-900 sm:text-base">
              <Clock className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
              <span className="truncate">Historial de Registros - {monthNames[month]}</span>
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {isLoadingEntries ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <TimeEntryList entries={entries} isLoading={false} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TimeEntries() {
  const { user } = useAuthContext();

  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  // Show team overview for admin/supervisor, individual view for becario
  if (isAdminOrSupervisor) {
    return <TeamHoursOverview />;
  }

  return <BecarioTimeEntries />;
}
