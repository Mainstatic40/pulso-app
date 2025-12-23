import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2, User, Calendar, Hash } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
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

  const isAdmin = user?.role === 'admin';

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

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
      deleteMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
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
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{equipment.name}</h2>
              {equipment.serialNumber && (
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <Hash className="h-4 w-4" />
                  {equipment.serialNumber}
                </p>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={deleteMutation.isPending}
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
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700">Descripción</h3>
              <p className="mt-2 whitespace-pre-wrap text-gray-600">{equipment.description}</p>
            </div>
          )}

          {/* Active Assignment */}
          {equipment.assignments && equipment.assignments.length > 0 && (
            <div className="mt-6 rounded-lg bg-red-50 p-4">
              <h3 className="text-sm font-medium text-red-800">Actualmente en uso</h3>
              {equipment.assignments.map((assignment) => (
                <div key={assignment.id} className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{assignment.user?.name}</span>
                    <span className="text-red-600">({assignment.user?.email})</span>
                  </div>
                  {assignment.event && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <Calendar className="h-4 w-4" />
                      <span>{assignment.event.name}</span>
                    </div>
                  )}
                  <p className="text-xs text-red-500">
                    Desde: {formatDateTime(assignment.startTime)}
                  </p>
                  {assignment.notes && (
                    <p className="text-sm text-red-600 italic">"{assignment.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
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
                <dd className="font-medium text-gray-900">
                  {formatDateTime(equipment.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Actualizado</dt>
                <dd className="font-medium text-gray-900">
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
