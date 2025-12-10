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
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
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
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <ListTodo className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-gray-500">No hay datos de tareas para el período seleccionado</p>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Resumen de Tareas</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          isLoading={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
      <div className="grid gap-4 md:grid-cols-2">
        {/* Completion Rate */}
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-4 font-medium text-gray-900">Tasa de Completitud</h4>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24">
                <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 36 36">
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
                  <span className="text-xl font-bold text-gray-900">
                    {completionRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">
                  {completed} de {total} tareas completadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-4 font-medium text-gray-900">Distribución por Prioridad</h4>
            <div className="space-y-3">
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
