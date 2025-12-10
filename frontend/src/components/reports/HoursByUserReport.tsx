import { Download, Clock, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import type { HoursByUserData } from '../../services/report.service';

interface HoursByUserReportProps {
  data: HoursByUserData[];
  isLoading: boolean;
  onExport: () => void;
  isExporting: boolean;
}

function HoursBar({ hours, maxHours }: { hours: number; maxHours: number }) {
  const percentage = maxHours > 0 ? (hours / maxHours) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-32 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-red-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700">
        {hours.toFixed(1)}h
      </span>
    </div>
  );
}

export function HoursByUserReport({
  data,
  isLoading,
  onExport,
  isExporting,
}: HoursByUserReportProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-gray-500">No hay datos de horas para el período seleccionado</p>
      </div>
    );
  }

  const totalHours = data.reduce((sum, item) => sum + item.totalHours, 0);
  const totalSessions = data.reduce((sum, item) => sum + item.totalSessions, 0);
  const maxHours = Math.max(...data.map((item) => item.totalHours));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Horas por Usuario</h3>
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

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Horas Totales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Sesiones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((item) => (
              <tr key={item.userId} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                  {item.userName}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <HoursBar hours={item.totalHours} maxHours={maxHours} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {item.totalSessions}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900">
                Total
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900">
                {totalHours.toFixed(1)} horas
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900">
                {totalSessions} sesiones
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
