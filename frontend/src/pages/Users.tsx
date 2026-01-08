import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { UserTable, UserModal } from '../components/users';
import { userService } from '../services/user.service';
import type { User, UserRole } from '../types';

type StatusFilter = 'all' | 'active' | 'inactive';

export function Users() {
  const queryClient = useQueryClient();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;

  // Query users
  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, limit, role: roleFilter, status: statusFilter, search }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';
      if (search.trim()) params.search = search.trim();
      return userService.getAll(params);
    },
  });

  const users = data?.data || [];
  const meta = data?.meta;

  // Mutations
  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Error al actualizar usuario';
      alert(`Error: ${message}`);
      console.error('[updateMutation] Error:', error);
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: string) => userService.hardDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Error al eliminar usuario';
      alert(`Error: ${message}`);
      console.error('[hardDeleteMutation] Error:', error);
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleToggleActive = (user: User) => {
    const action = user.isActive ? 'desactivar' : 'activar';
    if (confirm(`¿Estás seguro de ${action} a ${user.name}?`)) {
      updateMutation.mutate({
        id: user.id,
        data: { isActive: !user.isActive },
      });
    }
  };

  const handleHardDelete = (user: User) => {
    if (confirm(`¿Estás seguro de ELIMINAR PERMANENTEMENTE a ${user.name}?\n\nEsta acción no se puede deshacer y se eliminarán todos sus registros asociados (tareas, eventos, horas, etc.).`)) {
      if (confirm(`Confirma escribiendo: ¿Realmente deseas eliminar a "${user.name}"?`)) {
        hardDeleteMutation.mutate(user.id);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = (data: any) => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const totalPages = meta ? Math.ceil(meta.total / limit) : 1;

  const roleOptions = [
    { value: 'all', label: 'Todos los roles' },
    { value: 'admin', label: 'Administrador' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'becario', label: 'Becario' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 sm:min-w-[300px]">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre o email..."
              className="h-10 w-full rounded-md border border-gray-300 px-10 py-2 text-base focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | 'all');
              setPage(1);
            }}
            className="w-40"
          />
        </div>

        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter);
            setPage(1);
          }}
          className="w-32"
        />
      </div>

      {/* Table */}
      <UserTable
        users={users}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onHardDelete={handleHardDelete}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {meta && meta.total > limit && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="text-sm text-gray-500">
            Mostrando {(page - 1) * limit + 1} a{' '}
            {Math.min(page * limit, meta.total)} de {meta.total} usuarios
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
