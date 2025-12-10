import { Download, Calendar, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import type { HoursByEventData } from '../../services/report.service';

interface HoursByEventReportProps {
  data: HoursByEventData[];
  isLoading: boolean;
  onExport: () => void;
  isExporting: boolean;
}

export function HoursByEventReport({
  data,
  isLoading,
  onExport,
  isExporting,
}: HoursByEventReportProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-gray-500">No hay eventos con horas registradas en el período seleccionado</p>
      </div>
    );
  }

  const totalHours = data.reduce((sum, item) => sum + item.totalHours, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Horas por Evento</h3>
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
                Evento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Horas Totales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Asignados
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((item) => (
              <tr key={item.eventId} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                  {item.eventName}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                  {item.totalHours.toFixed(1)} h
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    {item.assigneesCount}
                  </div>
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
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {data.length} eventos
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
