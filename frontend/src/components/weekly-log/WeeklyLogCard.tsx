import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';
import type { WeeklyLogWithUser } from '../../services/weekly-log.service';

interface WeeklyLogCardProps {
  log: WeeklyLogWithUser;
}

function formatWeekRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = startDate.toLocaleDateString('es-MX', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('es-MX', { month: 'short' });
  const year = endDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${startMonth} ${year}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function WeeklyLogCard({ log }: WeeklyLogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {formatWeekRange(log.weekStart, log.weekEnd)}
              </p>
              <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">
                {log.activities.substring(0, 100)}
                {log.activities.length > 100 ? '...' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{formatHours(log.totalHours)}</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            isExpanded ? 'max-h-[1000px]' : 'max-h-0'
          )}
        >
          <div className="space-y-4 border-t border-gray-100 bg-gray-50 p-4">
            {/* Activities */}
            <div>
              <h4 className="text-sm font-medium text-gray-700">
                Actividades realizadas
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                {log.activities}
              </p>
            </div>

            {/* Achievements */}
            {log.achievements && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Logros destacados
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                  {log.achievements}
                </p>
              </div>
            )}

            {/* Challenges */}
            {log.challenges && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Dificultades encontradas
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                  {log.challenges}
                </p>
              </div>
            )}

            {/* Learnings */}
            {log.learnings && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Aprendizajes</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                  {log.learnings}
                </p>
              </div>
            )}

            {/* Next Goals */}
            {log.nextGoals && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Objetivos próxima semana
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                  {log.nextGoals}
                </p>
              </div>
            )}

            {/* User info if available */}
            {log.user && (
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500">
                  Autor: {log.user.name} ({log.user.email})
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
