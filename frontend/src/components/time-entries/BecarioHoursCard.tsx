import { ChevronRight } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { ProgressBar } from './ProgressBar';
import type { HoursByUserData } from '../../services/report.service';

// Monthly hours target - easy to modify
export const MONTHLY_HOURS_TARGET = 80;

// Re-export for backwards compatibility
export type BecarioHoursData = HoursByUserData;

interface BecarioHoursCardProps {
  data: HoursByUserData;
  daysElapsed: number;
  totalDays: number;
  onClick?: () => void;
}

type ProgressStatus = 'completed' | 'on_track' | 'behind';

function getProgressStatus(
  hoursWorked: number,
  daysElapsed: number,
  totalDays: number
): ProgressStatus {
  if (hoursWorked >= MONTHLY_HOURS_TARGET) {
    return 'completed';
  }

  // Calculate expected hours based on days elapsed
  const expectedHours = (daysElapsed / totalDays) * MONTHLY_HOURS_TARGET;

  // Allow 10% margin before marking as behind
  if (hoursWorked >= expectedHours * 0.9) {
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
  daysElapsed,
  totalDays,
  onClick,
}: BecarioHoursCardProps) {
  const percentage = Math.min((data.totalHours / MONTHLY_HOURS_TARGET) * 100, 100);
  const status = getProgressStatus(data.totalHours, daysElapsed, totalDays);
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
          <Avatar name={data.userName} size="md" />
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
            {data.totalHours.toFixed(1)} / {MONTHLY_HOURS_TARGET} horas
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>

        <div className="mt-2">
          <ProgressBar
            value={data.totalHours}
            max={MONTHLY_HOURS_TARGET}
            variant={config.variant}
            size="md"
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{percentage.toFixed(0)}% completado</span>
          <span>{data.totalSessions} sesiones</span>
        </div>
      </div>
    </div>
  );
}
