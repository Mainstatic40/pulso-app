import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Clock, Plus, Pencil, Trash2, Settings, Calendar, Star } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { MonthSelector, getMonthDateRange, formatDateForApi } from './MonthSelector';
import { BecarioHoursCard } from './BecarioHoursCard';
import { AddTimeEntryModal } from './AddTimeEntryModal';
import type { HoursByUserData } from '../../services/report.service';
import { ProgressBar } from './ProgressBar';
import { reportService } from '../../services/report.service';
import { timeEntryService, type TimeEntryWithEvent } from '../../services/time-entry.service';
import { monthlyHoursConfigService, type MonthlyHoursConfig, DEFAULT_HOURS_PER_DAY } from '../../services/monthly-hours-config.service';

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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{becario.weekdayHours.toFixed(1)}</p>
            <p className="text-xs text-blue-600">Horas L-V</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{becario.weekendHours.toFixed(1)}</p>
            <p className="text-xs text-purple-600">Horas S-D</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{becario.totalSessions}</p>
            <p className="text-xs text-gray-500">Sesiones</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {becario.totalSessions > 0
                ? (Number(becario.totalHours) / becario.totalSessions).toFixed(1)
                : '0'}
            </p>
            <p className="text-xs text-gray-500">Prom/sesión</p>
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
              {entries.data.map((entry) => {
                const entryDate = new Date(entry.clockIn);
                const isWeekend = entryDate.getDay() === 0 || entryDate.getDay() === 6;

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      isWeekend ? 'bg-purple-50' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-600">
                      {entryDate.toLocaleDateString('es-MX', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                      {isWeekend && <span className="ml-1 text-purple-500">*</span>}
                    </span>
                    <span className="text-gray-500">
                      {entryDate.toLocaleTimeString('es-MX', {
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
                );
              })}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-400">
            <span className="text-purple-500">*</span> Fin de semana (no cuenta para la meta)
          </p>
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
  config: MonthlyHoursConfig | null;
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Calculate workdays in month from a specific start date
function getWorkdaysInMonthFrom(year: number, month: number, startDateStr: string | null): number {
  // month is 0-11 in JS
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  // Determine the start day (1-31)
  let startDay = 1;
  if (startDateStr) {
    // Parse the date string directly to avoid timezone issues
    const parts = startDateStr.split('-');
    const parsedYear = parseInt(parts[0], 10);
    const parsedMonth = parseInt(parts[1], 10) - 1; // JS months are 0-11
    const parsedDay = parseInt(parts[2], 10);

    if (parsedYear === year && parsedMonth === month) {
      startDay = parsedDay;
    } else if (parsedYear > year || (parsedYear === year && parsedMonth > month)) {
      // Start date is after this month
      return 0;
    }
  }

  let workdays = 0;
  for (let day = startDay; day <= lastDayOfMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) workdays++;
  }

  return workdays;
}

function TargetHoursModal({ isOpen, onClose, year, month, config }: TargetHoursModalProps) {
  const queryClient = useQueryClient();
  const [hoursPerDay, setHoursPerDay] = useState(DEFAULT_HOURS_PER_DAY.toString());
  const [useCustomTarget, setUseCustomTarget] = useState(false);
  const [customTarget, setCustomTarget] = useState('');
  const [startDate, setStartDate] = useState<string>('');

  // Reset form when config changes
  useEffect(() => {
    if (config) {
      setHoursPerDay(config.hoursPerDay.toString());
      setUseCustomTarget(config.isCustomTarget);
      setCustomTarget(config.isCustomTarget ? config.targetHours.toString() : '');
      setStartDate(config.startDate || '');
    } else {
      setHoursPerDay(DEFAULT_HOURS_PER_DAY.toString());
      setUseCustomTarget(false);
      setCustomTarget('');
      setStartDate('');
    }
  }, [config]);

  // Calculate workdays based on start date
  const calculatedWorkdays = getWorkdaysInMonthFrom(year, month, startDate || null);
  const totalWorkdays = startDate ? calculatedWorkdays : (config?.totalWorkdays || 22);
  const calculatedTarget = parseFloat(hoursPerDay) * totalWorkdays;

  // Get min and max dates for the input (within the selected month)
  const minDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const maxDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

  const mutation = useMutation({
    mutationFn: ({ target, hpd, start }: { target: number; hpd: number; start: string | null }) =>
      monthlyHoursConfigService.upsert(year, month + 1, target, hpd, start),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-hours-config'] });
      queryClient.invalidateQueries({ queryKey: ['hours-by-user'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hpd = parseFloat(hoursPerDay);
    const target = useCustomTarget ? parseFloat(customTarget) : calculatedTarget;

    if (!isNaN(hpd) && hpd > 0 && hpd <= 12 && !isNaN(target) && target > 0) {
      mutation.mutate({ target, hpd, start: startDate || null });
    }
  };

  const handleClearStartDate = () => {
    setStartDate('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Meta de Horas">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-gray-600">
          Configura las horas objetivo para <span className="font-medium">{monthNames[month]} {year}</span>
        </p>

        {/* Start date input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de inicio (opcional)
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={minDate}
              max={maxDate}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            {startDate && (
              <Button type="button" variant="ghost" size="sm" onClick={handleClearStartDate}>
                Limpiar
              </Button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Las horas solo contarán desde esta fecha. Útil para inicio de semestre.
          </p>
        </div>

        {/* Workdays info */}
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Días laborables:</span>
            <span className="text-xl font-bold">{totalWorkdays}</span>
          </div>
          <p className="mt-1 text-xs text-blue-600">
            {startDate
              ? `Desde ${new Date(startDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} hasta fin de mes (L-V)`
              : 'Calculado automáticamente (Lunes a Viernes)'}
          </p>
        </div>

        {/* Hours per day */}
        <div>
          <Input
            label="Horas por día (L-V)"
            type="number"
            min="1"
            max="12"
            step="0.5"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">Promedio de horas de trabajo por día laborable</p>
        </div>

        {/* Calculated target */}
        <div className="rounded-lg bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">Meta calculada:</span>
            <span className="text-2xl font-bold text-green-700">
              {isNaN(calculatedTarget) ? '0' : calculatedTarget.toFixed(0)} horas
            </span>
          </div>
          <p className="mt-1 text-xs text-green-600">
            {totalWorkdays} días × {hoursPerDay || 0} horas/día
          </p>
        </div>

        {/* Custom target toggle */}
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useCustomTarget}
              onChange={(e) => setUseCustomTarget(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Usar meta personalizada</span>
          </label>

          {useCustomTarget && (
            <Input
              label="Meta personalizada (horas)"
              type="number"
              min="1"
              max="300"
              step="1"
              value={customTarget}
              onChange={(e) => setCustomTarget(e.target.value)}
              placeholder={calculatedTarget.toFixed(0)}
            />
          )}
        </div>

        {mutation.error && (
          <p className="text-sm text-red-600">Error al guardar la configuración</p>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
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

  // Fetch config for the selected month
  const { data: monthConfig } = useQuery({
    queryKey: ['monthly-hours-config', year, month + 1],
    queryFn: () => monthlyHoursConfigService.getByMonth(year, month + 1),
  });

  const targetHours = monthConfig?.targetHours || (monthConfig?.totalWorkdays || 22) * DEFAULT_HOURS_PER_DAY;
  const totalWorkdays = monthConfig?.totalWorkdays || 22;
  const workdaysElapsed = monthConfig?.workdaysElapsed || 0;
  const hoursPerDay = monthConfig?.hoursPerDay || DEFAULT_HOURS_PER_DAY;
  const configStartDate = monthConfig?.startDate || null;

  // Use the configured start date for filtering hours, or the start of the month
  const effectiveDateFrom = configStartDate || formatDateForApi(start);

  const { data: hoursData, isLoading } = useQuery({
    queryKey: ['hours-by-user', year, month, configStartDate],
    queryFn: () =>
      reportService.getHoursByUser({
        dateFrom: effectiveDateFrom,
        dateTo: formatDateForApi(end),
      }),
  });

  const becarios: HoursByUserData[] = hoursData || [];

  // Calculate team totals (using weekday hours for progress)
  const teamWeekdayHours = becarios.reduce((sum, b) => sum + (b.weekdayHours || 0), 0);
  const teamWeekendHours = becarios.reduce((sum, b) => sum + (b.weekendHours || 0), 0);
  const teamTarget = becarios.length * targetHours;
  const teamPercentage = teamTarget > 0 ? (teamWeekdayHours / teamTarget) * 100 : 0;

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
              Meta: {targetHours} hrs ({totalWorkdays} días × {hoursPerDay}h)
              {configStartDate && (
                <span className="ml-1 text-orange-600">
                  • Desde {new Date(configStartDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </span>
              )}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-2xl font-bold text-gray-900">{teamWeekdayHours.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Horas L-V</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teamWeekendHours.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Horas extra (S-D)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{workdaysElapsed} / {totalWorkdays}</p>
                <p className="text-sm text-gray-500">
                  {configStartDate
                    ? `Desde ${new Date(configStartDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
                    : 'Días laborables'}
                </p>
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
              <span className="text-sm font-medium text-gray-700">Progreso del equipo (horas L-V)</span>
              <span className="text-sm text-gray-500">
                {teamWeekdayHours.toFixed(1)} / {teamTarget} horas ({teamPercentage.toFixed(0)}%)
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar
                value={teamWeekdayHours}
                max={teamTarget}
                size="lg"
                variant={teamPercentage >= 100 ? 'success' : teamPercentage >= 50 ? 'warning' : 'danger'}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Día laborable {workdaysElapsed} de {totalWorkdays} ({totalWorkdays > 0 ? ((workdaysElapsed / totalWorkdays) * 100).toFixed(0) : 0}% transcurrido)
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">Sin becarios activos</h3>
            <p className="mt-2 text-gray-500">
              No hay becarios registrados en el sistema.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {becarios.map((becario) => (
            <BecarioHoursCard
              key={becario.userId}
              data={becario}
              workdaysElapsed={workdaysElapsed}
              totalWorkdays={totalWorkdays}
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
        config={monthConfig || null}
      />
    </div>
  );
}
