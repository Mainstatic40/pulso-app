import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Filter, Calendar, User, Loader2 } from 'lucide-react';
import { equipmentLoanService, type EquipmentUsageLog } from '../services/equipment-loan.service';
import { userService } from '../services/user.service';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';

const categoryIcons: Record<string, string> = {
  camera: '📷',
  lens: '🔭',
  sd_card: '💾',
  adapter: '🔌',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Hoy, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Ayer, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  } else {
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
}

export function EquipmentLoans() {
  const [filters, setFilters] = useState({
    userId: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['equipment-usage-logs', filters],
    queryFn: () =>
      equipmentLoanService.getHistory({
        userId: filters.userId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: 100,
      }),
    refetchInterval: 10000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-for-filter'],
    queryFn: () => userService.getAll(),
  });

  const users = usersData?.data || [];

  // Group logs by date
  const groupedLogs = logs.reduce(
    (groups: Record<string, EquipmentUsageLog[]>, log) => {
      const date = new Date(log.loggedAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
      return groups;
    },
    {}
  );

  const clearFilters = () => {
    setFilters({ userId: '', startDate: '', endDate: '' });
  };

  const hasActiveFilters = filters.userId || filters.startDate || filters.endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-[#CC0000]" />
          <h1 className="text-2xl font-bold text-gray-900">Historial de Equipos</h1>
        </div>
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-2 rounded-full bg-white px-1.5 text-xs font-bold text-[#CC0000]">
              !
            </span>
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                <User className="h-4 w-4" />
                Usuario
              </label>
              <Select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                options={[
                  { value: '', label: 'Todos los usuarios' },
                  ...users.map((user) => ({
                    value: user.id,
                    label: user.name,
                  })),
                ]}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                Desde
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                Hasta
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Logs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No hay registros</h3>
          <p className="mt-2 text-sm text-gray-500">
            Los registros de uso de equipos aparecerán aquí cuando los becarios escaneen sus
            credenciales y equipos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([dateString, dateLogs]) => (
            <div key={dateString}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                {formatDateLabel(dateLogs[0].loggedAt)}
              </h2>
              <div className="space-y-3">
                {dateLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        name={log.user.name}
                        profileImage={log.user.profileImage}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{log.user.name}</h3>
                          <span className="text-sm text-gray-500">
                            {formatDate(log.loggedAt)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {log.items.map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                            >
                              {categoryIcons[item.equipment.category] || '📦'}
                              {item.equipment.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
