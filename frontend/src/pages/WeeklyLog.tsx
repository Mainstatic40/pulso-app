import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Users, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import {
  WeekSelector,
  WeeklyLogSummary,
  WeeklyLogForm,
  WeeklyLogCard,
  getWeekDates,
  getPreviousWeek,
  getNextWeek,
  isSameWeek,
  formatDateForApi,
} from '../components/weekly-log';
import {
  weeklyLogService,
  type CreateWeeklyLogRequest,
  type UpdateWeeklyLogRequest,
} from '../services/weekly-log.service';
import { userService } from '../services/user.service';
import { useAuthContext } from '../stores/auth.store.tsx';

export function WeeklyLog() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // State for week selection
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekDates(new Date()));
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';
  const isCurrentWeek = isSameWeek(selectedWeek.start, new Date());
  const effectiveUserId = isAdminOrSupervisor && selectedUserId ? selectedUserId : user?.id;
  const isViewingOtherUser = !!(isAdminOrSupervisor && selectedUserId && selectedUserId !== user?.id);

  // Fetch users for admin/supervisor filter
  const { data: usersResponse } = useQuery({
    queryKey: ['users', { limit: 100 }],
    queryFn: () => userService.getAll({ limit: 100 }),
    enabled: isAdminOrSupervisor,
  });

  const users = usersResponse?.data || [];
  const userOptions = [
    { value: '', label: 'Mi bitácora' },
    ...users.filter((u) => u.id !== user?.id).map((u) => ({ value: u.id, label: u.name })),
  ];

  // Fetch current week log
  const weekStartStr = formatDateForApi(selectedWeek.start);
  const { data: weeklyLogs, isLoading: isLoadingLog } = useQuery({
    queryKey: ['weekly-logs', { userId: effectiveUserId, weekStart: weekStartStr }],
    queryFn: () =>
      weeklyLogService.getAll({
        userId: effectiveUserId,
        limit: 1,
      }),
  });

  // Find the log for the selected week
  const currentLog = useMemo(() => {
    const logs = weeklyLogs?.data || [];
    return logs.find((log) => {
      const logStart = new Date(log.weekStart);
      return isSameWeek(logStart, selectedWeek.start);
    });
  }, [weeklyLogs, selectedWeek.start]);

  // Fetch summary for the selected week
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['weekly-logs', 'summary', effectiveUserId, weekStartStr],
    queryFn: () => weeklyLogService.getSummary(effectiveUserId, weekStartStr),
  });

  // Fetch history (all logs for user)
  const { data: historyResponse, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['weekly-logs', 'history', effectiveUserId],
    queryFn: () =>
      weeklyLogService.getAll({
        userId: effectiveUserId,
        limit: 10,
      }),
  });

  // Filter history to exclude current week
  const historyLogs = useMemo(() => {
    const logs = historyResponse?.data || [];
    return logs.filter((log) => {
      const logStart = new Date(log.weekStart);
      return !isSameWeek(logStart, selectedWeek.start);
    });
  }, [historyResponse, selectedWeek.start]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateWeeklyLogRequest) => weeklyLogService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-logs'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWeeklyLogRequest }) =>
      weeklyLogService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-logs'] });
    },
  });

  // Handlers
  const handlePreviousWeek = () => {
    setSelectedWeek(getPreviousWeek(selectedWeek.start));
  };

  const handleNextWeek = () => {
    setSelectedWeek(getNextWeek(selectedWeek.start));
  };

  const handleToday = () => {
    setSelectedWeek(getWeekDates(new Date()));
  };

  const handleSubmit = (data: { activities: string; achievements?: string; challenges?: string; learnings?: string; nextGoals?: string }) => {
    if (currentLog) {
      updateMutation.mutate({
        id: currentLog.id,
        data: {
          activities: data.activities,
          achievements: data.achievements || null,
          challenges: data.challenges || null,
          learnings: data.learnings || null,
          nextGoals: data.nextGoals || null,
        },
      });
    } else {
      createMutation.mutate({
        weekStart: formatDateForApi(selectedWeek.start),
        weekEnd: formatDateForApi(selectedWeek.end),
        activities: data.activities,
        achievements: data.achievements || null,
        challenges: data.challenges || null,
        learnings: data.learnings || null,
        nextGoals: data.nextGoals || null,
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bitácora Semanal</h1>

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

      {/* Week Selector */}
      <Card>
        <CardContent className="p-4">
          <WeekSelector
            weekStart={selectedWeek.start}
            weekEnd={selectedWeek.end}
            onPrevious={handlePreviousWeek}
            onNext={handleNextWeek}
            onToday={handleToday}
            hasSavedLog={!!currentLog}
            isCurrentWeek={isCurrentWeek}
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <WeeklyLogSummary summary={summary || null} isLoading={isLoadingSummary} />

      {/* Weekly Log Form */}
      {isLoadingLog ? (
        <Card>
          <CardContent className="flex justify-center py-12">
            <Spinner size="lg" />
          </CardContent>
        </Card>
      ) : (
        <WeeklyLogForm
          key={`${weekStartStr}-${effectiveUserId}-${currentLog?.id || 'new'}`}
          existingLog={currentLog}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          isReadOnly={isViewingOtherUser}
        />
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Bitácoras
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="py-8 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No hay bitácoras anteriores</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyLogs.map((log) => (
                <WeeklyLogCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
