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
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <TrendingUp className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-gray-500">No hay datos de productividad para el período seleccionado</p>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Productividad del Equipo</h3>
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
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Horas Trabajadas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tareas Completadas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                En Progreso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Prom. Horas/Tarea
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Productividad
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedData.map((item, index) => (
              <tr key={item.userId} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  {index === 0 && item.productivityScore > 0 ? (
                    <Award className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <span className="text-sm text-gray-500">{index + 1}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                  {item.userName}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                  {item.hoursWorked.toFixed(1)} h
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    {item.tasksCompleted}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {item.tasksInProgress}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                  {item.avgHoursPerTask > 0 ? `${item.avgHoursPerTask.toFixed(1)} h` : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <ProductivityScore
                    score={maxScore > 0 ? item.productivityScore / maxScore : 0}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        * La productividad se calcula como tareas completadas por jornada de 8 horas trabajadas
      </p>
    </div>
  );
}
