import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { userService } from '../../services/user.service';
import { useAuthContext } from '../../stores/auth.store.tsx';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateConversation: (userId: string) => void;
  isCreating?: boolean;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onCreateConversation,
  isCreating,
}: NewConversationModalProps) {
  const { user: currentUser } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch all users
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
    enabled: isOpen,
  });

  const users = usersResponse?.data || [];

  // Filter users (exclude current user and filter by search)
  const filteredUsers = users.filter((u) => {
    if (u.id === currentUser?.id) return false;
    if (!u.isActive) return false;
    if (!searchQuery) return true;
    return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSelect = (userId: string) => {
    setSelectedUserId(userId === selectedUserId ? null : userId);
  };

  const handleCreate = () => {
    if (selectedUserId) {
      onCreateConversation(selectedUserId);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUserId(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva conversación" size="sm">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar usuario..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:py-2"
          />
        </div>

        {/* User list */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
            </p>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelect(u.id)}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 transition-colors ${
                    selectedUserId === u.id
                      ? 'bg-red-50 ring-1 ring-red-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar name={u.name} profileImage={u.profileImage} size="sm" />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                    <p className="truncate text-xs text-gray-500">{u.email}</p>
                  </div>
                  {selectedUserId === u.id && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:min-h-0 sm:w-auto sm:py-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!selectedUserId || isCreating}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:min-h-0 sm:w-auto sm:py-2"
          >
            {isCreating && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Iniciar conversación
          </button>
        </div>
      </div>
    </Modal>
  );
}
