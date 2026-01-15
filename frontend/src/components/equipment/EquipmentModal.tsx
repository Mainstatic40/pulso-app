import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2, User, Calendar, Hash, CreditCard, Link as LinkIcon, Unlink, Loader2, Info } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { EquipmentForm } from './EquipmentForm';
import { EquipmentStatusBadge } from './EquipmentStatusBadge';
import { EquipmentCategoryBadge, getCategoryLabel } from './EquipmentCategoryBadge';
import { equipmentService, type UpdateEquipmentRequest } from '../../services/equipment.service';
import { useAuthContext } from '../../stores/auth.store';

interface EquipmentModalProps {
  equipmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EquipmentModal({ equipmentId, isOpen, onClose }: EquipmentModalProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [newRfidTag, setNewRfidTag] = useState('');
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  const isAdmin = user?.role === 'admin';
  const canManageRfid = user?.role === 'admin' || user?.role === 'supervisor';

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => equipmentService.getById(equipmentId!),
    enabled: !!equipmentId && isOpen,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEquipmentRequest) => equipmentService.update(equipmentId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => equipmentService.delete(equipmentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      onClose();
    },
  });

  const linkRfidMutation = useMutation({
    mutationFn: (rfidTag: string) => equipmentService.linkRfid(equipmentId!, rfidTag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-without-rfid'] });
      setNewRfidTag('');
    },
  });

  const unlinkRfidMutation = useMutation({
    mutationFn: () => equipmentService.unlinkRfid(equipmentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-without-rfid'] });
      setShowUnlinkConfirm(false);
    },
  });

  const handleLinkRfid = () => {
    if (!newRfidTag.trim()) return;
    linkRfidMutation.mutate(newRfidTag.trim().toUpperCase());
  };

  const handleUnlinkRfid = () => {
    unlinkRfidMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
      deleteMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setNewRfidTag('');
    setShowUnlinkConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  if (isEditing && equipment) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Editar Equipo" size="md">
        <EquipmentForm
          equipment={equipment}
          onSubmit={(data) => updateMutation.mutate(data as UpdateEquipmentRequest)}
          onCancel={() => setIsEditing(false)}
          isLoading={updateMutation.isPending}
        />
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Detalle del Equipo" size="md">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : equipment ? (
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">{equipment.name}</h2>
              {equipment.serialNumber && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 sm:text-sm">
                  <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="truncate">{equipment.serialNumber}</span>
                </p>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="min-h-[36px] min-w-[36px] p-1.5 sm:min-h-0 sm:min-w-0 sm:p-2"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={deleteMutation.isPending}
                  className="min-h-[36px] min-w-[36px] p-1.5 sm:min-h-0 sm:min-w-0 sm:p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Status and Category */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <EquipmentStatusBadge status={equipment.status} />
            <EquipmentCategoryBadge category={equipment.category} />
          </div>

          {/* Description */}
          {equipment.description && (
            <div className="mt-4 sm:mt-6">
              <h3 className="text-xs font-medium text-gray-700 sm:text-sm">Descripción</h3>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-gray-600 sm:mt-2">{equipment.description}</p>
            </div>
          )}

          {/* Active Assignment */}
          {equipment.assignments && equipment.assignments.length > 0 && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 sm:mt-6 sm:p-4">
              <h3 className="text-xs font-medium text-red-800 sm:text-sm">Actualmente en uso</h3>
              {equipment.assignments.map((assignment) => (
                <div key={assignment.id} className="mt-2 space-y-1.5 sm:space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-red-700 sm:gap-2 sm:text-sm">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="font-medium">{assignment.user?.name}</span>
                    <span className="hidden text-red-600 sm:inline">({assignment.user?.email})</span>
                  </div>
                  {assignment.event && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 sm:gap-2 sm:text-sm">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="truncate">{assignment.event.name}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-red-500 sm:text-xs">
                    Desde: {formatDateTime(assignment.startTime)}
                  </p>
                  {assignment.notes && (
                    <p className="text-xs italic text-red-600 sm:text-sm">"{assignment.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* RFID Tag Section */}
          {canManageRfid && (
            <div className="mt-4 sm:mt-6">
              <h3 className="flex items-center gap-2 text-xs font-medium text-gray-700 sm:text-sm">
                <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                RFID Tag
              </h3>
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                {equipment.rfidTag ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="truncate font-mono text-base font-semibold text-gray-900 sm:text-lg">
                      {equipment.rfidTag}
                    </span>
                    {showUnlinkConfirm ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 sm:text-sm">¿Desvincular?</span>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={handleUnlinkRfid}
                          disabled={unlinkRfidMutation.isPending}
                          className="min-h-[36px] px-3 sm:min-h-0"
                        >
                          {unlinkRfidMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Sí'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowUnlinkConfirm(false)}
                          className="min-h-[36px] px-3 sm:min-h-0"
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowUnlinkConfirm(true)}
                        className="min-h-[36px] text-red-600 hover:bg-red-50 hover:text-red-700 sm:min-h-0"
                      >
                        <Unlink className="mr-1 h-3 w-3" />
                        Desvincular
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 sm:text-sm">Sin RFID asignado</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={newRfidTag}
                        onChange={(e) => setNewRfidTag(e.target.value)}
                        placeholder="Ingresa el tag RFID..."
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleLinkRfid}
                        disabled={!newRfidTag.trim() || linkRfidMutation.isPending}
                        className="min-h-[36px] w-full sm:min-h-0 sm:w-auto"
                      >
                        {linkRfidMutation.isPending ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <LinkIcon className="mr-1 h-3 w-3" />
                        )}
                        Vincular
                      </Button>
                    </div>
                    <div className="flex items-start gap-2 text-[10px] text-gray-500 sm:text-xs">
                      <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                      <span>
                        También puedes escanear el RFID en el lector y asignarlo desde la página de Credenciales RFID.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-4 border-t border-gray-200 pt-3 sm:mt-6 sm:pt-4">
            <dl className="grid grid-cols-2 gap-3 text-xs sm:gap-4 sm:text-sm">
              <div>
                <dt className="text-gray-500">Categoría</dt>
                <dd className="font-medium text-gray-900">
                  {getCategoryLabel(equipment.category)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd className="font-medium text-gray-900">
                  {equipment.isActive ? 'Activo' : 'Inactivo'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Creado</dt>
                <dd className="truncate font-medium text-gray-900">
                  {formatDateTime(equipment.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Actualizado</dt>
                <dd className="truncate font-medium text-gray-900">
                  {formatDateTime(equipment.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500">Equipo no encontrado</div>
      )}
    </Modal>
  );
}

interface CreateEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateEquipmentModal({ isOpen, onClose }: CreateEquipmentModalProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: equipmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Equipo" size="md">
      <EquipmentForm
        onSubmit={(data) => createMutation.mutate(data as Parameters<typeof equipmentService.create>[0])}
        onCancel={onClose}
        isLoading={createMutation.isPending}
      />
    </Modal>
  );
}
