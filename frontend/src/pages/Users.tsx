import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { UserTable, UserModal } from '../components/users';
import { userService } from '../services/user.service';
import { useAuth } from '../hooks/useAuth';
import type { User, UserRole } from '../types';

type StatusFilter = 'all' | 'active' | 'inactive';

export function Users() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
      setShowDeleteModal(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Error al eliminar usuario';
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
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      hardDeleteMutation.mutate(userToDelete.id);
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
    <div className="w-full max-w-full space-y-4 overflow-hidden sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Usuarios</h1>
        <Button onClick={handleOpenCreate} className="w-full text-sm sm:w-auto sm:text-base">
          <Plus className="mr-1.5 h-4 w-4 sm:mr-2" />
          <span className="sm:hidden">Nuevo</span>
          <span className="hidden sm:inline">Nuevo Usuario</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:p-4">
        <div className="min-w-0 flex-1 sm:min-w-[250px]">
          <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
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
              className="h-9 w-full rounded-md border border-gray-300 px-10 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:h-10 sm:text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
          <div className="flex items-center gap-2">
            <Filter className="hidden h-4 w-4 text-gray-400 sm:block" />
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | 'all');
                setPage(1);
              }}
              className="w-full sm:w-40"
            />
          </div>

          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="w-full sm:w-32"
          />
        </div>
      </div>

      {/* Table */}
      <UserTable
        users={users}
        currentUser={currentUser}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onHardDelete={handleHardDelete}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {meta && meta.total > limit && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 sm:flex-row sm:justify-between sm:px-4">
          <div className="order-2 text-xs text-gray-500 sm:order-1 sm:text-sm">
            Mostrando {(page - 1) * limit + 1} a{' '}
            {Math.min(page * limit, meta.total)} de {meta.total} usuarios
          </div>
          <div className="order-1 flex gap-2 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs sm:text-sm"
            >
              Anterior
            </Button>
            <div className="hidden items-center gap-1 sm:flex">
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
            <span className="flex items-center text-xs text-gray-500 sm:hidden">
              {page}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs sm:text-sm"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-xl bg-white p-4 shadow-xl sm:max-w-md sm:rounded-xl sm:p-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mb-4 sm:h-16 sm:w-16">
                <AlertTriangle className="h-6 w-6 text-red-600 sm:h-8 sm:w-8" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-gray-900 sm:text-xl">
                ¿Eliminar usuario?
              </h2>
              <p className="mb-3 text-sm text-gray-600 sm:mb-4 sm:text-base">
                Estás a punto de eliminar permanentemente a{' '}
                <strong>{userToDelete.name}</strong>. Esta acción no se puede
                deshacer y se eliminarán todos sus registros asociados.
              </p>

              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-left sm:mb-4 sm:p-3">
                <p className="mb-1 text-xs font-medium text-red-800 sm:text-sm">
                  Se eliminarán:
                </p>
                <ul className="list-inside list-disc text-xs text-red-700 sm:text-sm">
                  <li>Entradas de tiempo</li>
                  <li>Asignaciones de tareas y eventos</li>
                  <li>Comentarios y mensajes</li>
                  <li>Registros de uso de equipo</li>
                </ul>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 rounded-lg bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 sm:px-4 sm:py-2 sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={hardDeleteMutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-base"
                >
                  {hardDeleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
