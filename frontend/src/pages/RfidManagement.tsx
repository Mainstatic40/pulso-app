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
  Clock,
  Trash2,
  Camera,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Avatar } from '../components/ui/Avatar';
import { Spinner } from '../components/ui/Spinner';
import { RfidSimulatorModal } from '../components/rfid/RfidSimulatorModal';
import { rfidService, type RfidUser, type PendingRfid } from '../services/rfid.service';
import { equipmentService } from '../services/equipment.service';
import type { Equipment } from '../types';

// Helper function for relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'hace unos segundos';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins === 1 ? '' : 's'}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
  return `hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
}

type AssignmentType = 'user' | 'equipment';

export function RfidManagement() {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newRfidTag, setNewRfidTag] = useState('');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<string | null>(null);
  const [discardConfirm, setDiscardConfirm] = useState<string | null>(null);
  const [pendingUserSelections, setPendingUserSelections] = useState<Record<string, string>>({});
  const [pendingEquipmentSelections, setPendingEquipmentSelections] = useState<Record<string, string>>({});
  const [pendingAssignmentTypes, setPendingAssignmentTypes] = useState<Record<string, AssignmentType>>({});
  const queryClient = useQueryClient();

  // Fetch users with RFID status
  const { data: users, isLoading } = useQuery({
    queryKey: ['rfid-users'],
    queryFn: () => rfidService.getUsersWithRfid(),
  });

  // Fetch equipment without RFID
  const { data: equipmentWithoutRfid = [] } = useQuery({
    queryKey: ['equipment-without-rfid'],
    queryFn: () => equipmentService.getWithoutRfid(),
  });

  // Fetch pending RFIDs with polling every 10 seconds
  const { data: pendingRfids } = useQuery({
    queryKey: ['rfid-pending'],
    queryFn: () => rfidService.getPending(),
    refetchInterval: 10000,
  });

  // Link RFID to user mutation
  const linkMutation = useMutation({
    mutationFn: ({ userId, rfidTag }: { userId: string; rfidTag: string }) =>
      rfidService.linkRfid(userId, rfidTag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfid-users'] });
      queryClient.invalidateQueries({ queryKey: ['rfid-pending'] });
      setSelectedUserId('');
      setNewRfidTag('');
      setPendingUserSelections({});
    },
  });

  // Link RFID to equipment mutation
  const linkEquipmentMutation = useMutation({
    mutationFn: ({ equipmentId, rfidTag }: { equipmentId: string; rfidTag: string }) =>
      equipmentService.linkRfid(equipmentId, rfidTag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-without-rfid'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['rfid-pending'] });
      setPendingEquipmentSelections({});
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

  // Delete pending mutation
  const deletePendingMutation = useMutation({
    mutationFn: (rfidTag: string) => rfidService.deletePending(rfidTag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfid-pending'] });
      setDiscardConfirm(null);
    },
  });

  const handleLink = () => {
    if (!selectedUserId || !newRfidTag.trim()) return;
    linkMutation.mutate({ userId: selectedUserId, rfidTag: newRfidTag.trim() });
  };

  const handleLinkPending = (rfidTag: string) => {
    const assignmentType = pendingAssignmentTypes[rfidTag] || 'user';

    if (assignmentType === 'user') {
      const userId = pendingUserSelections[rfidTag];
      if (!userId) return;
      linkMutation.mutate({ userId, rfidTag });
    } else {
      const equipmentId = pendingEquipmentSelections[rfidTag];
      if (!equipmentId) return;
      linkEquipmentMutation.mutate({ equipmentId, rfidTag });
    }
  };

  const getAssignmentType = (rfidTag: string): AssignmentType => {
    return pendingAssignmentTypes[rfidTag] || 'user';
  };

  const setAssignmentType = (rfidTag: string, type: AssignmentType) => {
    setPendingAssignmentTypes((prev) => ({ ...prev, [rfidTag]: type }));
    // Clear selections when switching type
    if (type === 'user') {
      setPendingEquipmentSelections((prev) => {
        const updated = { ...prev };
        delete updated[rfidTag];
        return updated;
      });
    } else {
      setPendingUserSelections((prev) => {
        const updated = { ...prev };
        delete updated[rfidTag];
        return updated;
      });
    }
  };

  const handleUnlink = (userId: string) => {
    unlinkMutation.mutate(userId);
  };

  const handleDiscard = (rfidTag: string) => {
    deletePendingMutation.mutate(rfidTag);
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

      {/* Pending RFIDs Section */}
      {(pendingRfids || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-amber-600" />
              Credenciales Pendientes de Asignar
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {pendingRfids?.length || 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(pendingRfids || []).map((pending: PendingRfid) => {
                const assignmentType = getAssignmentType(pending.rfidTag);
                const isLinkingUser = linkMutation.isPending;
                const isLinkingEquipment = linkEquipmentMutation.isPending;
                const isLinking = isLinkingUser || isLinkingEquipment;

                return (
                  <div
                    key={pending.id}
                    className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                  >
                    {/* Header with RFID tag */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-amber-600" />
                        <span className="font-mono text-lg font-semibold text-gray-900">
                          {pending.rfidTag}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        Escaneada: {formatRelativeTime(pending.scannedAt)}
                      </span>
                    </div>

                    {/* Assignment type toggle */}
                    <div className="mb-3">
                      <span className="text-sm text-gray-600 mr-3">Asignar a:</span>
                      <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => setAssignmentType(pending.rfidTag, 'user')}
                          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            assignmentType === 'user'
                              ? 'bg-[#CC0000] text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <User className="h-4 w-4" />
                          Usuario
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssignmentType(pending.rfidTag, 'equipment')}
                          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            assignmentType === 'equipment'
                              ? 'bg-[#CC0000] text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Camera className="h-4 w-4" />
                          Equipo
                        </button>
                      </div>
                    </div>

                    {/* Selection and actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {assignmentType === 'user' ? (
                        <Select
                          value={pendingUserSelections[pending.rfidTag] || ''}
                          onChange={(e) =>
                            setPendingUserSelections((prev) => ({
                              ...prev,
                              [pending.rfidTag]: e.target.value,
                            }))
                          }
                          options={[
                            { value: '', label: 'Seleccionar usuario...' },
                            ...usersWithoutRfid.map((u: RfidUser) => ({
                              value: u.id,
                              label: u.name,
                            })),
                          ]}
                          className="min-w-[200px]"
                        />
                      ) : (
                        <Select
                          value={pendingEquipmentSelections[pending.rfidTag] || ''}
                          onChange={(e) =>
                            setPendingEquipmentSelections((prev) => ({
                              ...prev,
                              [pending.rfidTag]: e.target.value,
                            }))
                          }
                          options={[
                            { value: '', label: 'Seleccionar equipo...' },
                            ...equipmentWithoutRfid.map((eq: Equipment) => ({
                              value: eq.id,
                              label: eq.name,
                            })),
                          ]}
                          className="min-w-[200px]"
                        />
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleLinkPending(pending.rfidTag)}
                        disabled={
                          isLinking ||
                          (assignmentType === 'user'
                            ? !pendingUserSelections[pending.rfidTag]
                            : !pendingEquipmentSelections[pending.rfidTag])
                        }
                      >
                        {isLinking ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <LinkIcon className="mr-1 h-3 w-3" />
                        )}
                        Asignar
                      </Button>

                      {discardConfirm === pending.rfidTag ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">¿Descartar?</span>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDiscard(pending.rfidTag)}
                            disabled={deletePendingMutation.isPending}
                          >
                            {deletePendingMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Sí'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDiscardConfirm(null)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDiscardConfirm(pending.rfidTag)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Descartar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Info message */}
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  Estas credenciales fueron escaneadas pero no están asignadas.
                  Selecciona si vincularla a un usuario o a un equipo.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
