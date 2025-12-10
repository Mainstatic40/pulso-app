import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { TimeEntry } from '../../types';

interface TimeEntryWithEvent extends TimeEntry {
  event?: {
    id: string;
    name: string;
  } | null;
}

interface TimeEntryListProps {
  entries: TimeEntryWithEvent[];
  isLoading?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(hours: number | undefined | null): string {
  if (!hours) return '-';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TimeEntryList({ entries, isLoading }: TimeEntryListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-12 text-center">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Sin registros</h3>
        <p className="mt-2 text-gray-500">No hay registros de horas en este período.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Entrada
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Salida
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Duración
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Evento
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {formatDate(entry.clockIn)}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {formatTime(entry.clockIn)}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                {entry.clockOut ? (
                  <span className="text-gray-900">{formatTime(entry.clockOut)}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    En curso
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {entry.clockOut ? formatDuration(entry.totalHours) : '-'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {entry.event?.name || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Compact version for dashboard or mobile
export function TimeEntryListCompact({ entries, isLoading }: TimeEntryListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">Sin registros en este período</p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">{formatDate(entry.clockIn)}</p>
            <p className="text-xs text-gray-500">
              {formatTime(entry.clockIn)} - {entry.clockOut ? formatTime(entry.clockOut) : 'En curso'}
            </p>
          </div>
          <div className="text-right">
            <p className={cn(
              'text-sm font-medium',
              entry.clockOut ? 'text-gray-900' : 'text-green-600'
            )}>
              {entry.clockOut ? formatDuration(entry.totalHours) : 'Activo'}
            </p>
            {entry.event && (
              <p className="text-xs text-gray-500">{entry.event.name}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
