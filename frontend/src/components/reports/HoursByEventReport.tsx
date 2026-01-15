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
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center sm:p-8">
        <Calendar className="mx-auto h-10 w-10 text-gray-300 sm:h-12 sm:w-12" />
        <p className="mt-2 text-sm text-gray-500 sm:text-base">No hay eventos con horas registradas en el período seleccionado</p>
      </div>
    );
  }

  const totalHours = data.reduce((sum, item) => sum + item.totalHours, 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Horas por Evento</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          isLoading={isExporting}
          className="w-full text-xs sm:w-auto sm:text-sm"
        >
          <Download className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
          <span className="sm:hidden">Excel</span>
          <span className="hidden sm:inline">Exportar Excel</span>
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                Evento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                Horas Totales
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                Asignados
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((item) => (
              <tr key={item.eventId} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 sm:px-6 sm:py-4">
                  {item.eventName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 sm:px-6 sm:py-4">
                  {item.totalHours.toFixed(1)} h
                </td>
                <td className="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
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
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900 sm:px-6 sm:py-4">
                Total
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900 sm:px-6 sm:py-4">
                {totalHours.toFixed(1)} horas
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 sm:px-6 sm:py-4">
                {data.length} eventos
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-2 sm:hidden">
        {data.map((item) => (
          <div key={item.eventId} className="overflow-hidden rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-2 truncate font-medium text-gray-900">{item.eventName}</div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700">{item.totalHours.toFixed(1)} h</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="h-3.5 w-3.5" />
                {item.assigneesCount} asignados
              </div>
            </div>
          </div>
        ))}
        {/* Totals Card */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-900">{totalHours.toFixed(1)}h</span>
              <span className="ml-2 text-xs text-gray-500">({data.length} eventos)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
