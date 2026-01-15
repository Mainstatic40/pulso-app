import { Download, CheckCircle, Clock, AlertCircle, PlayCircle, ListTodo } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import type { TasksSummaryData } from '../../services/report.service';

interface TasksSummaryReportProps {
  data: TasksSummaryData | null;
  isLoading: boolean;
  onExport: () => void;
  isExporting: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`rounded-lg p-1.5 sm:p-2 ${colorClasses[color]}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
            <p className="truncate text-xs text-gray-500 sm:text-sm">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorClasses: Record<string, string> = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function TasksSummaryReport({
  data,
  isLoading,
  onExport,
  isExporting,
}: TasksSummaryReportProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 sm:space-y-4">
        <div className="h-6 w-40 rounded bg-gray-200 sm:h-8 sm:w-48" />
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-200 sm:h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center sm:p-8">
        <ListTodo className="mx-auto h-10 w-10 text-gray-300 sm:h-12 sm:w-12" />
        <p className="mt-2 text-sm text-gray-500 sm:text-base">No hay datos de tareas para el período seleccionado</p>
      </div>
    );
  }

  // Safe defaults for data properties
  const pending = data.pending ?? 0;
  const inProgress = data.inProgress ?? 0;
  const review = data.review ?? 0;
  const completed = data.completed ?? 0;
  const total = data.total ?? 0;
  const completionRate = data.completionRate ?? 0;
  const byPriority = data.byPriority ?? { high: 0, medium: 0, low: 0 };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Resumen de Tareas</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          isLoading={isExporting}
          className="w-full text-xs sm:w-auto sm:text-sm"
        >
          <Download className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
          <span className="sm:hidden">Excel</span>
          <span className="hidden sm:inline">Exportar Excel</span>
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Pendientes"
          value={pending}
          color="gray"
        />
        <StatCard
          icon={PlayCircle}
          label="En Progreso"
          value={inProgress}
          color="blue"
        />
        <StatCard
          icon={AlertCircle}
          label="En Revisión"
          value={review}
          color="yellow"
        />
        <StatCard
          icon={CheckCircle}
          label="Completadas"
          value={completed}
          color="green"
        />
      </div>

      {/* Completion Rate & Priority Distribution */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {/* Completion Rate */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <h4 className="mb-3 text-sm font-medium text-gray-900 sm:mb-4 sm:text-base">Tasa de Completitud</h4>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 sm:h-24 sm:w-24">
                <svg className="h-20 w-20 -rotate-90 transform sm:h-24 sm:w-24" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="3"
                    strokeDasharray={`${completionRate}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900 sm:text-xl">
                    {completionRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 sm:text-sm">
                  {completed} de {total} tareas completadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <h4 className="mb-3 text-sm font-medium text-gray-900 sm:mb-4 sm:text-base">Distribución por Prioridad</h4>
            <div className="space-y-2 sm:space-y-3">
              <PriorityBar
                label="Alta"
                value={byPriority.high}
                total={total}
                color="red"
              />
              <PriorityBar
                label="Media"
                value={byPriority.medium}
                total={total}
                color="yellow"
              />
              <PriorityBar
                label="Baja"
                value={byPriority.low}
                total={total}
                color="green"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
