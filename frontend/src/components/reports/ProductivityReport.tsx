import { Download, TrendingUp, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import type { ProductivityData } from '../../services/report.service';

interface ProductivityReportProps {
  data: ProductivityData[];
  isLoading: boolean;
  onExport: () => void;
  isExporting: boolean;
}

function ProductivityScore({ score }: { score: number }) {
  let color = 'bg-gray-100 text-gray-600';
  if (score >= 0.8) {
    color = 'bg-green-100 text-green-700';
  } else if (score >= 0.5) {
    color = 'bg-yellow-100 text-yellow-700';
  } else if (score > 0) {
    color = 'bg-red-100 text-red-700';
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {(score * 100).toFixed(0)}%
    </span>
  );
}

export function ProductivityReport({
  data,
  isLoading,
  onExport,
  isExporting,
}: ProductivityReportProps) {
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
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center sm:p-8">
        <TrendingUp className="mx-auto h-10 w-10 text-gray-300 sm:h-12 sm:w-12" />
        <p className="mt-2 text-sm text-gray-500 sm:text-base">No hay datos de productividad para el período seleccionado</p>
      </div>
    );
  }

  // Calculate productivity score for sorting
  const dataWithScore = data.map((item) => ({
    ...item,
    productivityScore:
      item.hoursWorked > 0
        ? item.tasksCompleted / (item.hoursWorked / 8) // Tasks per 8-hour day
        : 0,
  }));

  // Sort by productivity score descending
  const sortedData = [...dataWithScore].sort(
    (a, b) => b.productivityScore - a.productivityScore
  );

  const maxScore = Math.max(...sortedData.map((d) => d.productivityScore));

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Productividad del Equipo</h3>
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
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 lg:px-6">
                #
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 lg:px-6">
                Usuario
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 lg:px-6">
                Horas
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 lg:px-6">
                Completadas
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 lg:px-6">
                En Prog.
              </th>
              <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 lg:table-cell lg:px-6">
                Prom. h/Tarea
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 lg:px-6">
                Prod.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedData.map((item, index) => (
              <tr key={item.userId} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                  {index === 0 && item.productivityScore > 0 ? (
                    <Award className="h-4 w-4 text-yellow-500 sm:h-5 sm:w-5" />
                  ) : (
                    <span className="text-sm text-gray-500">{index + 1}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900 sm:px-4 sm:py-4 lg:px-6">
                  {item.userName}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700 sm:px-4 sm:py-4 lg:px-6">
                  {item.hoursWorked.toFixed(1)} h
                </td>
                <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    {item.tasksCompleted}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {item.tasksInProgress}
                  </span>
                </td>
                <td className="hidden whitespace-nowrap px-3 py-3 text-sm text-gray-700 sm:px-4 lg:table-cell lg:px-6">
                  {item.avgHoursPerTask > 0 ? `${item.avgHoursPerTask.toFixed(1)} h` : '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                  <ProductivityScore
                    score={maxScore > 0 ? item.productivityScore / maxScore : 0}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-2 sm:hidden">
        {sortedData.map((item, index) => (
          <div key={item.userId} className="overflow-hidden rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {index === 0 && item.productivityScore > 0 ? (
                  <Award className="h-4 w-4 text-yellow-500" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">
                    {index + 1}
                  </span>
                )}
                <span className="font-medium text-gray-900">{item.userName}</span>
              </div>
              <ProductivityScore
                score={maxScore > 0 ? item.productivityScore / maxScore : 0}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-gray-500">Horas</p>
                <p className="font-semibold text-gray-900">{item.hoursWorked.toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-gray-500">Completadas</p>
                <p className="font-semibold text-green-700">{item.tasksCompleted}</p>
              </div>
              <div>
                <p className="text-gray-500">En Prog.</p>
                <p className="font-semibold text-blue-700">{item.tasksInProgress}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-500 sm:text-xs">
        * La productividad se calcula como tareas completadas por jornada de 8 horas trabajadas
      </p>
    </div>
  );
}
