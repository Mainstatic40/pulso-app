import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ProgressBar } from '../time-entries/ProgressBar';
import { Spinner } from '../ui/Spinner';

interface WeekdayHours {
  day: string;
  hours: number;
}

interface HoursProgressCardProps {
  monthlyHours: number;
  targetHours: number;
  weeklyHours?: WeekdayHours[];
  monthName: string;
  year: number;
  isLoading?: boolean;
  isBecario?: boolean;
}

export function HoursProgressCard({
  monthlyHours,
  targetHours,
  weeklyHours = [],
  monthName,
  year,
  isLoading = false,
  isBecario = true,
}: HoursProgressCardProps) {
  const percentage = targetHours > 0 ? (monthlyHours / targetHours) * 100 : 0;
  const variant = percentage >= 100 ? 'success' : percentage >= 50 ? 'warning' : 'danger';

  const maxWeekdayHours = Math.max(...weeklyHours.map((w) => w.hours), 8);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            {isBecario ? 'Mi Progreso' : 'Progreso del Equipo'} - {monthName} {year}
          </CardTitle>
          <Link
            to="/time-entries"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ver detalle
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main progress bar */}
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {monthlyHours.toFixed(1)} hrs
                </span>
                <span className="text-sm text-gray-500">
                  de {targetHours} horas ({percentage.toFixed(0)}%)
                </span>
              </div>
              <ProgressBar
                value={monthlyHours}
                max={targetHours}
                variant={variant}
                size="lg"
              />
            </div>

            {/* Weekly breakdown */}
            {weeklyHours.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">Esta semana</p>
                <div className="flex items-end gap-1">
                  {weeklyHours.map((day, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-1">
                      <div className="relative w-full">
                        <div
                          className="mx-auto w-6 rounded-t bg-blue-500 transition-all"
                          style={{
                            height: `${Math.max((day.hours / maxWeekdayHours) * 48, 4)}px`,
                            opacity: day.hours > 0 ? 1 : 0.3,
                          }}
                        />
                        {day.hours > 0 && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-600">
                            {day.hours.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
