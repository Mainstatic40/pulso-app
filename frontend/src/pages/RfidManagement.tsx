import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Wifi,
  User,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  Unlink,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Avatar } from '../components/ui/Avatar';
import { Spinner } from '../components/ui/Spinner';
import { RfidSimulatorModal } from '../components/rfid/RfidSimulatorModal';
import { rfidService, type RfidUser } from '../services/rfid.service';

export function RfidManagement() {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newRfidTag, setNewRfidTag] = useState('');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch users with RFID status
  const { data: users, isLoading } = useQuery({
    queryKey: ['rfid-users'],
    queryFn: () => rfidService.getUsersWithRfid(),
  });

  // Link RFID mutation
  const linkMutation = useMutation({
    mutationFn: ({ userId, rfidTag }: { userId: string; rfidTag: string }) =>
      rfidService.linkRfid(userId, rfidTag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfid-users'] });
      setSelectedUserId('');
      setNewRfidTag('');
    },
  });

  // Unlink RFID mutation
  const unlinkMutation = useMutation({
    mutationFn: (userId: string) => rfidService.unlinkRfid(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfid-users'] });
      setUnlinkConfirm(null);
    },
  });

  const handleLink = () => {
    if (!selectedUserId || !newRfidTag.trim()) return;
    linkMutation.mutate({ userId: selectedUserId, rfidTag: newRfidTag.trim() });
  };

  const handleUnlink = (userId: string) => {
    unlinkMutation.mutate(userId);
  };

  // Filter users without RFID for the select dropdown
  const usersWithoutRfid = (users || []).filter((u: RfidUser) => !u.hasRfid);

  // Mask RFID for display (show first 4 and last 2 characters)
  const maskRfid = (rfidTag: string) => {
    if (rfidTag.length <= 6) return rfidTag;
    return `${rfidTag.slice(0, 4)}...${rfidTag.slice(-2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credenciales RFID</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las credenciales RFID de los usuarios para el registro de horas
          </p>
        </div>
        <Button onClick={() => setIsSimulatorOpen(true)} variant="outline">
          <Wifi className="mr-2 h-4 w-4" />
          Simular Escaneo
        </Button>
      </div>

      {/* Link New RFID Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LinkIcon className="h-5 w-5 text-blue-600" />
            Vincular Nueva Credencial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* User Select */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  1. Selecciona el usuario
                </label>
                <Select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  options={[
                    { value: '', label: 'Seleccionar usuario...' },
                    ...usersWithoutRfid.map((u: RfidUser) => ({
                      value: u.id,
                      label: u.name,
                    })),
                  ]}
                />
              </div>

              {/* RFID Input */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  2. Ingresa el ID RFID
                </label>
                <Input
                  value={newRfidTag}
                  onChange={(e) => setNewRfidTag(e.target.value)}
                  placeholder="Ej: A1:B2:C3:D4"
                />
              </div>

              {/* Link Button */}
              <div className="flex items-end">
                <Button
                  onClick={handleLink}
                  disabled={!selectedUserId || !newRfidTag.trim() || linkMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {linkMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="mr-2 h-4 w-4" />
                  )}
                  Vincular
                </Button>
              </div>
            </div>

            {/* Link Error */}
            {linkMutation.isError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4" />
                {(linkMutation.error as Error & { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
                  'Error al vincular RFID'}
              </div>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <CreditCard className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                El ID RFID se obtiene al escanear la credencial universitaria con el lector.
                Para pruebas, puedes usar cualquier texto como identificador.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-gray-600" />
            Usuarios y sus Credenciales
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600">
              {users?.length || 0}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {(users || []).map((user: RfidUser) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} profileImage={user.profileImage} size="md" />
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {user.hasRfid ? (
                    <>
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          {maskRfid(user.rfidTag!)}
                        </span>
                      </div>

                      {unlinkConfirm === user.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">¿Confirmar?</span>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleUnlink(user.id)}
                            disabled={unlinkMutation.isPending}
                          >
                            {unlinkMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Sí'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUnlinkConfirm(null)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUnlinkConfirm(user.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Unlink className="mr-1 h-3 w-3" />
                          Desvincular
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5">
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Sin credencial</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {(users || []).length === 0 && (
              <div className="py-8 text-center text-gray-500">
                No hay usuarios activos
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simulator Modal */}
      <RfidSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}
