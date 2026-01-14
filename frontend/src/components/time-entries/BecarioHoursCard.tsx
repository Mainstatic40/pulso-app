import { ChevronRight } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { ProgressBar } from './ProgressBar';
import type { HoursByUserData } from '../../services/report.service';

interface BecarioHoursCardProps {
  data: HoursByUserData;
  workdaysElapsed: number;
  totalWorkdays: number;
  targetHours?: number;
  onClick?: () => void;
}

type ProgressStatus = 'completed' | 'on_track' | 'behind';

function getProgressStatus(
  weekdayHours: number,
  workdaysElapsed: number,
  totalWorkdays: number,
  targetHours: number
): ProgressStatus {
  if (weekdayHours >= targetHours) {
    return 'completed';
  }

  // Calculate expected hours based on workdays elapsed
  const expectedHours = totalWorkdays > 0
    ? (workdaysElapsed / totalWorkdays) * targetHours
    : 0;

  // Allow 10% margin before marking as behind
  if (weekdayHours >= expectedHours * 0.9) {
    return 'on_track';
  }

  return 'behind';
}

const statusConfig: Record<ProgressStatus, { label: string; color: string; variant: 'success' | 'warning' | 'danger' }> = {
  completed: {
    label: 'Completado',
    color: 'bg-green-100 text-green-700',
    variant: 'success',
  },
  on_track: {
    label: 'En progreso',
    color: 'bg-yellow-100 text-yellow-700',
    variant: 'warning',
  },
  behind: {
    label: 'Atrasado',
    color: 'bg-red-100 text-red-700',
    variant: 'danger',
  },
};

export function BecarioHoursCard({
  data,
  workdaysElapsed,
  totalWorkdays,
  targetHours = 88,
  onClick,
}: BecarioHoursCardProps) {
  // Use weekday hours for progress calculation
  const weekdayHours = data.weekdayHours || 0;
  const weekendHours = data.weekendHours || 0;

  const percentage = Math.min((weekdayHours / targetHours) * 100, 100);
  const status = getProgressStatus(weekdayHours, workdaysElapsed, totalWorkdays, targetHours);
  const config = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-gray-200 bg-white p-4 transition-all ${
        onClick ? 'cursor-pointer hover:border-gray-300 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={data.userName} profileImage={data.userProfileImage} size="md" />
          <div>
            <h3 className="font-medium text-gray-900">{data.userName}</h3>
            <p className="text-sm text-gray-500">{data.userEmail}</p>
          </div>
        </div>
        {onClick && (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {weekdayHours.toFixed(1)} / {targetHours} horas
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>

        <div className="mt-2">
          <ProgressBar
            value={weekdayHours}
            max={targetHours}
            variant={config.variant}
            size="md"
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{percentage.toFixed(0)}% completado</span>
          <div className="flex items-center gap-2">
            <span>{data.totalSessions} sesiones</span>
            {weekendHours > 0 && (
              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700">
                +{weekendHours.toFixed(1)}h extra
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
