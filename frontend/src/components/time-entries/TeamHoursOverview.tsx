import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Clock, TrendingUp, Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { MonthSelector, getMonthDateRange, formatDateForApi } from './MonthSelector';
import { BecarioHoursCard, DEFAULT_MONTHLY_HOURS_TARGET } from './BecarioHoursCard';
import { AddTimeEntryModal } from './AddTimeEntryModal';
import type { HoursByUserData } from '../../services/report.service';
import { ProgressBar } from './ProgressBar';
import { reportService } from '../../services/report.service';
import { timeEntryService, type TimeEntryWithEvent } from '../../services/time-entry.service';
import { monthlyHoursConfigService } from '../../services/monthly-hours-config.service';

interface BecarioDetailModalProps {
  becario: HoursByUserData | null;
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  onEditEntry: (entry: TimeEntryWithEvent) => void;
  onAddEntry: (userId: string) => void;
}

function BecarioDetailModal({ becario, isOpen, onClose, year, month, onEditEntry, onAddEntry }: BecarioDetailModalProps) {
  const queryClient = useQueryClient();
  const { start, end } = getMonthDateRange(year, month);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['time-entries', becario?.userId, year, month],
    queryFn: () =>
      timeEntryService.getAll({
        userId: becario!.userId,
        dateFrom: formatDateForApi(start),
        dateTo: formatDateForApi(end),
        limit: 100,
      }),
    enabled: isOpen && !!becario,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => timeEntryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['hours-by-user'] });
    },
  });

  const handleDelete = (entry: TimeEntryWithEvent) => {
    if (window.confirm('¿Eliminar este registro de horas?')) {
      deleteMutation.mutate(entry.id);
    }
  };

  if (!becario) return null;

  // Group entries by week
  const entriesByWeek: Record<string, { hours: number; sessions: number }> = {};

  if (entries?.data) {
    entries.data.forEach((entry) => {
      const date = new Date(entry.clockIn);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!entriesByWeek[weekKey]) {
        entriesByWeek[weekKey] = { hours: 0, sessions: 0 };
      }
      entriesByWeek[weekKey].hours += Number(entry.totalHours || 0);
      entriesByWeek[weekKey].sessions += 1;
    });
  }

  const weeks = Object.entries(entriesByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, data]) => ({
      weekStart,
      hours: Number(data.hours) || 0,
      sessions: Number(data.sessions) || 0,
    }));

  const maxWeekHours = Math.max(...weeks.map((w) => w.hours), 20);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalle - ${becario.userName}`} size="lg">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{Number(becario.totalHours).toFixed(1)}</p>
            <p className="text-sm text-gray-500">Horas trabajadas</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{becario.totalSessions}</p>
            <p className="text-sm text-gray-500">Sesiones</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {becario.totalSessions > 0
                ? (Number(becario.totalHours) / becario.totalSessions).toFixed(1)
                : '0'}
            </p>
            <p className="text-sm text-gray-500">Prom. por sesión</p>
          </div>
        </div>

        {/* Weekly breakdown */}
        <div>
          <h3 className="mb-4 font-medium text-gray-900">Horas por Semana</h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : weeks.length === 0 ? (
            <p className="py-4 text-center text-gray-500">Sin registros este mes</p>
          ) : (
            <div className="space-y-3">
              {weeks.map((week) => {
                const weekDate = new Date(week.weekStart);
                const weekLabel = `Semana del ${weekDate.getDate()} de ${weekDate.toLocaleDateString('es-MX', { month: 'short' })}`;

                return (
                  <div key={week.weekStart} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{weekLabel}</span>
                      <span className="font-medium text-gray-900">
                        {week.hours.toFixed(1)}h ({week.sessions} sesiones)
                      </span>
                    </div>
                    <div className="h-6 w-full overflow-hidden rounded bg-gray-100">
                      <div
                        className="flex h-full items-center justify-end rounded bg-blue-500 px-2 text-xs font-medium text-white transition-all duration-300"
                        style={{ width: `${(week.hours / maxWeekHours) * 100}%` }}
                      >
                        {week.hours >= 5 && `${week.hours.toFixed(1)}h`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent entries with edit/delete */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Registros del Mes</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddEntry(becario.userId)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Agregar
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : !entries?.data || entries.data.length === 0 ? (
            <p className="py-4 text-center text-gray-500">Sin registros</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {entries.data.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="text-gray-600">
                    {new Date(entry.clockIn).toLocaleDateString('es-MX', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="text-gray-500">
                    {new Date(entry.clockIn).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {entry.clockOut && (
                      <>
                        {' - '}
                        {new Date(entry.clockOut).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </>
                    )}
                  </span>
                  <span className="font-medium text-gray-900">
                    {entry.totalHours ? Number(entry.totalHours).toFixed(1) : '0'}h
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditEntry(entry)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-blue-600"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                      title="Eliminar"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Modal for configuring target hours
interface TargetHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  currentTarget: number;
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function TargetHoursModal({ isOpen, onClose, year, month, currentTarget }: TargetHoursModalProps) {
  const queryClient = useQueryClient();
  const [targetHours, setTargetHours] = useState(currentTarget.toString());

  const mutation = useMutation({
    mutationFn: (hours: number) => monthlyHoursConfigService.upsert(year, month + 1, hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-hours-config'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(targetHours);
    if (!isNaN(hours) && hours > 0 && hours <= 200) {
      mutation.mutate(hours);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Meta de Horas">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Configura las horas objetivo para {monthNames[month]} {year}
        </p>

        <Input
          label="Horas objetivo por becario"
          type="number"
          min="1"
          max="200"
          step="0.5"
          value={targetHours}
          onChange={(e) => setTargetHours(e.target.value)}
        />

        {mutation.error && (
          <p className="text-sm text-red-600">Error al guardar la configuración</p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function TeamHoursOverview() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedBecario, setSelectedBecario] = useState<HoursByUserData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntryWithEvent | null>(null);
  const [preselectedUserId, setPreselectedUserId] = useState<string | undefined>();

  const { start, end } = getMonthDateRange(year, month);

  // Calculate days elapsed and total days
  const totalDays = end.getDate();
  const today = new Date();
  let daysElapsed = totalDays;

  if (year === today.getFullYear() && month === today.getMonth()) {
    daysElapsed = today.getDate();
  } else if (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth())) {
    daysElapsed = 0;
  }

  // Fetch target hours for the selected month
  const { data: targetData } = useQuery({
    queryKey: ['monthly-hours-config', year, month + 1],
    queryFn: () => monthlyHoursConfigService.getByMonth(year, month + 1),
  });

  const targetHours = targetData?.targetHours || DEFAULT_MONTHLY_HOURS_TARGET;

  const { data: hoursData, isLoading } = useQuery({
    queryKey: ['hours-by-user', year, month],
    queryFn: () =>
      reportService.getHoursByUser({
        dateFrom: formatDateForApi(start),
        dateTo: formatDateForApi(end),
      }),
  });

  const becarios: HoursByUserData[] = hoursData || [];

  // Calculate team totals
  const teamTotalHours = becarios.reduce((sum, b) => sum + Number(b.totalHours || 0), 0);
  const teamTotalSessions = becarios.reduce((sum, b) => sum + b.totalSessions, 0);
  const teamTarget = becarios.length * targetHours;
  const teamPercentage = teamTarget > 0 ? (teamTotalHours / teamTarget) * 100 : 0;

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const handleAddEntry = (userId?: string) => {
    setPreselectedUserId(userId);
    setEditingEntry(null);
    setIsAddModalOpen(true);
  };

  const handleEditEntry = (entry: TimeEntryWithEvent) => {
    setEditingEntry(entry);
    setPreselectedUserId(entry.userId);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingEntry(null);
    setPreselectedUserId(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Horas del Equipo</h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-gray-500">
              Meta mensual: {targetHours} horas por becario
            </p>
            <button
              onClick={() => setIsTargetModalOpen(true)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Configurar meta"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => handleAddEntry()}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar horas
          </Button>
          <MonthSelector year={year} month={month} onChange={handleMonthChange} />
        </div>
      </div>

      {/* Team Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{becarios.length}</p>
                <p className="text-sm text-gray-500">Becarios activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 text-green-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teamTotalHours.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Horas totales del equipo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teamTotalSessions}</p>
                <p className="text-sm text-gray-500">Sesiones registradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Progress */}
      {becarios.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progreso del equipo</span>
              <span className="text-sm text-gray-500">
                {teamTotalHours.toFixed(1)} / {teamTarget} horas ({teamPercentage.toFixed(0)}%)
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar
                value={teamTotalHours}
                max={teamTarget}
                size="lg"
                variant={teamPercentage >= 100 ? 'success' : teamPercentage >= 50 ? 'warning' : 'danger'}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Día {daysElapsed} de {totalDays} del mes ({((daysElapsed / totalDays) * 100).toFixed(0)}% transcurrido)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Becarios List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : becarios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Sin registros</h3>
            <p className="mt-2 text-gray-500">
              No hay registros de horas para este mes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {becarios.map((becario) => (
            <BecarioHoursCard
              key={becario.userId}
              data={becario}
              daysElapsed={daysElapsed}
              totalDays={totalDays}
              targetHours={targetHours}
              onClick={() => setSelectedBecario(becario)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <BecarioDetailModal
        becario={selectedBecario}
        isOpen={!!selectedBecario}
        onClose={() => setSelectedBecario(null)}
        year={year}
        month={month}
        onEditEntry={handleEditEntry}
        onAddEntry={handleAddEntry}
      />

      {/* Add/Edit Time Entry Modal */}
      <AddTimeEntryModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        editingEntry={editingEntry}
        preselectedUserId={preselectedUserId}
      />

      {/* Target Hours Config Modal */}
      <TargetHoursModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        year={year}
        month={month}
        currentTarget={targetHours}
      />
    </div>
  );
}
