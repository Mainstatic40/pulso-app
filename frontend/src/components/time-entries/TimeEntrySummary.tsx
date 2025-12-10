import { Clock, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface TimeEntrySummaryProps {
  totalHours: number;
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  periodLabel: string;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TimeEntrySummary({
  totalHours,
  totalSessions,
  completedSessions,
  activeSessions,
  periodLabel,
}: TimeEntrySummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Horas {periodLabel}</p>
              <p className="text-xl font-bold text-gray-900">{formatHours(totalHours)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sesiones</p>
              <p className="text-xl font-bold text-gray-900">{totalSessions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completadas</p>
              <p className="text-xl font-bold text-gray-900">{completedSessions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <div className="relative">
                <Clock className="h-5 w-5 text-yellow-600" />
                {activeSessions > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-green-500" />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">En Curso</p>
              <p className="text-xl font-bold text-gray-900">{activeSessions}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
