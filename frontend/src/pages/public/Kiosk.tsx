import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { KioskPinScreen } from '../../components/kiosk/KioskPinScreen';
import { KioskHeader } from '../../components/kiosk/KioskHeader';
import { KioskUserCard } from '../../components/kiosk/KioskUserCard';
import { kioskService } from '../../services/kiosk.service';
import type { KioskUser } from '../../types';

// Helper to extract error message from axios error
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function KioskMainScreen({ onLogout }: { onLogout: () => void }) {
  const queryClient = useQueryClient();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch users with auto-refresh every 30 seconds
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['kiosk-users'],
    queryFn: () => kioskService.getUsers(),
    refetchInterval: 30000,
    retry: 2,
  });

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: (userId: string) => kioskService.clockIn(userId),
    onSuccess: (_, userId) => {
      const user = users.find((u) => u.id === userId);
      setMessage({ type: 'success', text: `Entrada registrada para ${user?.name || 'usuario'}` });
      queryClient.invalidateQueries({ queryKey: ['kiosk-users'] });
    },
    onError: (error: unknown) => {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Error al registrar entrada') });
    },
    onSettled: () => {
      setLoadingUserId(null);
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: (userId: string) => kioskService.clockOut(userId),
    onSuccess: (_, userId) => {
      const user = users.find((u) => u.id === userId);
      setMessage({ type: 'success', text: `Salida registrada para ${user?.name || 'usuario'}` });
      queryClient.invalidateQueries({ queryKey: ['kiosk-users'] });
    },
    onError: (error: unknown) => {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Error al registrar salida') });
    },
    onSettled: () => {
      setLoadingUserId(null);
    },
  });

  const handleAction = useCallback((userId: string, action: 'clock-in' | 'clock-out') => {
    setLoadingUserId(userId);
    if (action === 'clock-in') {
      clockInMutation.mutate(userId);
    } else {
      clockOutMutation.mutate(userId);
    }
  }, [clockInMutation, clockOutMutation]);

  // Sort users: first those in office, then alphabetically
  const sortedUsers = [...users].sort((a, b) => {
    // First: users in office
    if (a.activeSession && !b.activeSession) return -1;
    if (!a.activeSession && b.activeSession) return 1;
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <KioskHeader onLogout={onLogout} />
        <div className="flex flex-col items-center justify-center p-8">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de conexion</h2>
          <p className="text-gray-500 mb-4">No se pudo conectar al servidor</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <KioskHeader onLogout={onLogout} />

      {/* Toast message */}
      {message && (
        <div
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${
            message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border px-6 py-4">
            <p className="text-sm text-gray-500">Total Usuarios</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border px-6 py-4">
            <p className="text-sm text-gray-500">En Oficina</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.activeSession).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border px-6 py-4">
            <p className="text-sm text-gray-500">Fuera</p>
            <p className="text-2xl font-bold text-gray-400">
              {users.filter((u) => !u.activeSession).length}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="ml-auto flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Loading state */}
        {isLoading && users.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* User grid */}
        {users.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedUsers.map((user: KioskUser) => (
              <KioskUserCard
                key={user.id}
                user={user}
                onAction={handleAction}
                isLoading={loadingUserId === user.id}
              />
            ))}
          </div>
        )}

        {/* No users */}
        {!isLoading && users.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No hay usuarios registrados</p>
          </div>
        )}
      </main>
    </div>
  );
}

export function Kiosk() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if PIN already exists in sessionStorage
  useEffect(() => {
    const pin = sessionStorage.getItem('kiosk_pin');
    if (pin) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('kiosk_pin');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <KioskPinScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <KioskMainScreen onLogout={handleLogout} />;
}
