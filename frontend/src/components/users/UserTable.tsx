import { Edit2, Trash2, MoreVertical, UserX } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Avatar } from '../ui/Avatar';
import { RoleBadge } from './RoleBadge';
import { Button } from '../ui/Button';
import type { User } from '../../types';

interface UserTableProps {
  users: User[];
  currentUser?: User | null;
  onEdit: (user: User) => void;
  onToggleActive: (user: User) => void;
  onHardDelete: (user: User) => void;
  isLoading?: boolean;
}

function ActionMenu({
  user,
  currentUser,
  onEdit,
  onToggleActive,
  onHardDelete,
}: {
  user: User;
  currentUser?: User | null;
  onEdit: (user: User) => void;
  onToggleActive: (user: User) => void;
  onHardDelete: (user: User) => void;
}) {
  // Only show delete option if current user is admin and not deleting themselves
  const canDelete = currentUser?.role === 'admin' && user.id !== currentUser?.id;
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              onEdit(user);
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Edit2 className="h-4 w-4" />
            Editar
          </button>
          <button
            onClick={() => {
              onToggleActive(user);
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50"
          >
            <UserX className="h-4 w-4" />
            {user.isActive ? 'Desactivar' : 'Activar'}
          </button>
          {canDelete && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => {
                  onHardDelete(user);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function UserTable({ users, currentUser, onEdit, onToggleActive, onHardDelete, isLoading }: UserTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="animate-pulse p-4 sm:p-8">
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 sm:h-10 sm:w-10" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-gray-200 sm:w-1/4" />
                  <div className="h-3 w-3/4 rounded bg-gray-200 sm:w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center sm:p-8">
        <p className="text-sm text-gray-500 sm:text-base">No se encontraron usuarios</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6">
                  Rol
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell lg:px-6">
                  RFID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 lg:px-6 lg:py-4">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <Avatar name={user.name} profileImage={user.profileImage} size="sm" />
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 lg:px-6 lg:py-4">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 lg:px-6 lg:py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-500 lg:table-cell lg:px-6 lg:py-4">
                    {user.rfidTag || (
                      <span className="text-gray-400">Sin asignar</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 lg:px-6 lg:py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right lg:px-6 lg:py-4">
                    <ActionMenu user={user} currentUser={currentUser} onEdit={onEdit} onToggleActive={onToggleActive} onHardDelete={onHardDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-2 sm:hidden">
        {users.map((user) => (
          <div key={user.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-start gap-3">
              <Avatar name={user.name} profileImage={user.profileImage} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-gray-900">{user.name}</h3>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <RoleBadge role={user.role} />
                  <ActionMenu user={user} currentUser={currentUser} onEdit={onEdit} onToggleActive={onToggleActive} onHardDelete={onHardDelete} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
