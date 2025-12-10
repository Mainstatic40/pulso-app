import { Clock, CheckCircle, Calendar } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import type { WeeklyLogSummary as SummaryType } from '../../services/weekly-log.service';

interface WeeklyLogSummaryProps {
  summary: SummaryType | null;
  isLoading: boolean;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function WeeklyLogSummary({ summary, isLoading }: WeeklyLogSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No hay datos de resumen disponibles
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
          Resumen Automático de la Semana
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Total Hours */}
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Horas Trabajadas</p>
              <p className="text-xl font-bold text-blue-900">
                {formatHours(summary.totalHours)}
              </p>
            </div>
          </div>

          {/* Total Sessions */}
          <div className="flex items-center gap-3 rounded-lg bg-purple-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">Sesiones</p>
              <p className="text-xl font-bold text-purple-900">
                {summary.totalSessions}
              </p>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Tareas Completadas</p>
              <p className="text-xl font-bold text-green-900">
                {summary.completedTasks.length}
              </p>
            </div>
          </div>
        </div>

        {/* Completed Tasks List */}
        {summary.completedTasks.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-700">
              Tareas completadas esta semana:
            </h4>
            <ul className="space-y-1">
              {summary.completedTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{task.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
