import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckSquare, Calendar, PlayCircle, StopCircle } from 'lucide-react';
import { useAuthContext } from '../stores/auth.store.tsx';
import { timeEntryService } from '../services/time-entry.service';
import { taskService, type TaskWithRelations } from '../services/task.service';
import { eventService, type EventWithRelations } from '../services/event.service';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { cn } from '../lib/utils';

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatEventDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-MX', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  review: 'En revisión',
  completed: 'Completada',
};

export function Dashboard() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Queries
  const { data: dailySummary, isLoading: isLoadingDaily } = useQuery({
    queryKey: ['time-entries', 'summary', 'daily'],
    queryFn: () => timeEntryService.getSummary('daily'),
  });

  const { data: weeklySummary, isLoading: isLoadingWeekly } = useQuery({
    queryKey: ['time-entries', 'summary', 'weekly'],
    queryFn: () => timeEntryService.getSummary('weekly'),
  });

  const { data: activeSession, isLoading: isLoadingActive } = useQuery({
    queryKey: ['time-entries', 'active'],
    queryFn: () => timeEntryService.getActive(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: tasksResponse, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', { assigneeId: user?.id, limit: 5 }],
    queryFn: () => taskService.getAll({ assigneeId: user?.id, limit: 5 }),
    enabled: !!user?.id,
  });

  const { data: pendingTasksResponse } = useQuery({
    queryKey: ['tasks', 'pending', { assigneeId: user?.id }],
    queryFn: () => taskService.getAll({ assigneeId: user?.id, status: 'pending' }),
    enabled: !!user?.id,
  });

  const { data: inProgressTasksResponse } = useQuery({
    queryKey: ['tasks', 'in_progress', { assigneeId: user?.id }],
    queryFn: () => taskService.getAll({ assigneeId: user?.id, status: 'in_progress' }),
    enabled: !!user?.id,
  });

  const { data: upcomingEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => eventService.getUpcoming(),
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

  const handleClockToggle = () => {
    if (activeSession) {
      clockOutMutation.mutate();
    } else {
      clockInMutation.mutate();
    }
  };

  const pendingCount = (pendingTasksResponse?.meta?.total || 0) + (inProgressTasksResponse?.meta?.total || 0);
  const tasks = tasksResponse?.data || [];
  const events = (upcomingEvents || []).slice(0, 3);

  const isClockLoading = clockInMutation.isPending || clockOutMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 capitalize">{formatDate(new Date())}</p>
      </div>

      {/* Clock In/Out Button */}
      <Card className={cn(
        'border-2',
        activeSession ? 'border-green-500 bg-green-50' : 'border-gray-200'
      )}>
        <CardContent className="flex items-center justify-between p-6">
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
            className="min-w-[180px]"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Horas Hoy</p>
                {isLoadingDaily ? (
                  <Spinner size="sm" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {dailySummary?.totalHours.toFixed(1) || '0.0'}h
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Horas Semana</p>
                {isLoadingWeekly ? (
                  <Spinner size="sm" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {weeklySummary?.totalHours.toFixed(1) || '0.0'}h
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <CheckSquare className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tareas Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Próximos Eventos</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks and Upcoming Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Mis Tareas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : tasks.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                No tienes tareas asignadas
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task: TaskWithRelations) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500">
                        Vence: {new Date(task.dueDate).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        priorityColors[task.priority]
                      )}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                      <span className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        statusColors[task.status]
                      )}>
                        {statusLabels[task.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : events.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                No hay eventos próximos
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((event: EventWithRelations) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{event.name}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatEventDate(event.startDatetime)} • {formatTime(event.startDatetime)} - {formatTime(event.endDatetime)}
                        </p>
                      </div>
                    </div>
                    {event.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
