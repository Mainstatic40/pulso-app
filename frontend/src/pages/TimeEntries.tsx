import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Users } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Tabs } from '../components/ui/Tabs';
import { Spinner } from '../components/ui/Spinner';
import { ClockButton, TimeEntryList, TimeEntrySummary } from '../components/time-entries';
import { timeEntryService, type TimeEntryWithEvent } from '../services/time-entry.service';
import { userService } from '../services/user.service';
import { useAuthContext } from '../stores/auth.store.tsx';

type Period = 'daily' | 'weekly' | 'monthly' | 'all';

const periodTabs = [
  { id: 'daily', label: 'Hoy' },
  { id: 'weekly', label: 'Esta Semana' },
  { id: 'monthly', label: 'Este Mes' },
  { id: 'all', label: 'Todos' },
];

const periodLabels: Record<Period, string> = {
  daily: 'Hoy',
  weekly: 'Esta Semana',
  monthly: 'Este Mes',
  all: 'Total',
};

function getDateRange(period: Period): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'daily': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        dateFrom: today.toISOString(),
        dateTo: tomorrow.toISOString(),
      };
    }
    case 'weekly': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return {
        dateFrom: startOfWeek.toISOString(),
        dateTo: endOfWeek.toISOString(),
      };
    }
    case 'monthly': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return {
        dateFrom: startOfMonth.toISOString(),
        dateTo: endOfMonth.toISOString(),
      };
    }
    case 'all':
    default:
      return {};
  }
}

export function TimeEntries() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [activePeriod, setActivePeriod] = useState<Period>('daily');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';
  const effectiveUserId = isAdminOrSupervisor && selectedUserId ? selectedUserId : undefined;

  // Fetch active session
  const { data: activeSession, isLoading: isLoadingActive } = useQuery({
    queryKey: ['time-entries', 'active'],
    queryFn: () => timeEntryService.getActive(),
    refetchInterval: 30000,
  });

  // Fetch summary based on period
  const summaryPeriod = activePeriod === 'all' ? 'monthly' : activePeriod;
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['time-entries', 'summary', summaryPeriod, effectiveUserId],
    queryFn: () => timeEntryService.getSummary(summaryPeriod, effectiveUserId),
  });

  // Fetch all entries for current period (for the table)
  const dateRange = useMemo(() => getDateRange(activePeriod), [activePeriod]);
  const { data: entriesResponse, isLoading: isLoadingEntries } = useQuery({
    queryKey: ['time-entries', 'list', dateRange, effectiveUserId],
    queryFn: () =>
      timeEntryService.getAll({
        ...dateRange,
        userId: effectiveUserId,
        limit: 100,
      }),
  });

  // Fetch users for admin/supervisor filter
  const { data: usersResponse } = useQuery({
    queryKey: ['users', { limit: 100 }],
    queryFn: () => userService.getAll({ limit: 100 }),
    enabled: isAdminOrSupervisor,
  });

  const users = usersResponse?.data || [];
  const userOptions = [
    { value: '', label: 'Todos los usuarios' },
    ...users.map((u) => ({ value: u.id, label: u.name })),
  ];

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

  // Calculate summary for 'all' period from entries
  const displaySummary = useMemo(() => {
    if (activePeriod !== 'all' && summary) {
      return {
        totalHours: summary.totalHours,
        totalSessions: summary.totalSessions,
        completedSessions: summary.completedSessions,
        activeSessions: summary.activeSessions,
      };
    }

    // Calculate from entries for 'all'
    const totalSessions = entries.length;
    const completedSessions = entries.filter((e) => e.clockOut).length;
    const activeSessions = entries.filter((e) => !e.clockOut).length;
    const totalHours = entries.reduce((acc, e) => acc + (e.totalHours || 0), 0);

    return { totalHours, totalSessions, completedSessions, activeSessions };
  }, [activePeriod, summary, entries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Registro de Horas</h1>

        {/* User filter for admin/supervisor */}
        {isAdminOrSupervisor && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              options={userOptions}
              className="w-48"
            />
          </div>
        )}
      </div>

      {/* Clock Button Section - Only show for current user */}
      {!selectedUserId && (
        <Card>
          <CardContent className="flex flex-col items-center py-8">
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

      {/* Period Tabs */}
      <Tabs
        tabs={periodTabs}
        activeTab={activePeriod}
        onChange={(id) => setActivePeriod(id as Period)}
      />

      {/* Summary Cards */}
      {isLoadingSummary && activePeriod !== 'all' ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <TimeEntrySummary
          totalHours={displaySummary.totalHours}
          totalSessions={displaySummary.totalSessions}
          completedSessions={displaySummary.completedSessions}
          activeSessions={displaySummary.activeSessions}
          periodLabel={periodLabels[activePeriod]}
        />
      )}

      {/* Entries Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="flex items-center gap-2 font-medium text-gray-900">
              <Clock className="h-5 w-5" />
              Historial de Registros
            </h2>
          </div>
          <div className="p-6">
            <TimeEntryList entries={entries} isLoading={isLoadingEntries} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
