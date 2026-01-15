import { Clock, CheckSquare, Calendar, Camera } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Spinner } from '../ui/Spinner';

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  subLabel?: string;
  isLoading?: boolean;
}

function StatCard({ icon, iconBg, label, value, subLabel, isLoading }: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-xl ${iconBg}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 sm:text-sm">{label}</p>
            {isLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <p className="text-lg font-bold text-gray-900 sm:text-2xl">{value}</p>
                {subLabel && (
                  <p className="text-[10px] text-gray-400 sm:text-xs">{subLabel}</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  monthlyHours: number;
  targetHours: number;
  pendingTasks: number;
  upcomingEvents: number;
  equipmentInUse: number;
  isLoading?: {
    hours?: boolean;
    tasks?: boolean;
    events?: boolean;
    equipment?: boolean;
  };
}

export function DashboardStats({
  monthlyHours,
  targetHours,
  pendingTasks,
  upcomingEvents,
  equipmentInUse,
  isLoading = {},
}: DashboardStatsProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-3 overflow-hidden sm:gap-4 lg:grid-cols-4">
      <StatCard
        icon={<Clock className="h-6 w-6 text-blue-600" />}
        iconBg="bg-blue-100"
        label="Horas del mes"
        value={`${monthlyHours.toFixed(0)}/${targetHours}`}
        subLabel="del objetivo"
        isLoading={isLoading.hours}
      />
      <StatCard
        icon={<CheckSquare className="h-6 w-6 text-amber-600" />}
        iconBg="bg-amber-100"
        label="Tareas"
        value={pendingTasks}
        subLabel="pendientes"
        isLoading={isLoading.tasks}
      />
      <StatCard
        icon={<Calendar className="h-6 w-6 text-purple-600" />}
        iconBg="bg-purple-100"
        label="Eventos"
        value={upcomingEvents}
        subLabel="esta semana"
        isLoading={isLoading.events}
      />
      <StatCard
        icon={<Camera className="h-6 w-6 text-green-600" />}
        iconBg="bg-green-100"
        label="Equipos"
        value={equipmentInUse}
        subLabel="en uso"
        isLoading={isLoading.equipment}
      />
    </div>
  );
}
