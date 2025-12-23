import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Circle, Disc, CreditCard, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Spinner } from '../ui/Spinner';
import { userService } from '../../services/user.service';
import { eventService } from '../../services/event.service';
import { equipmentService } from '../../services/equipment.service';
import { equipmentAssignmentService } from '../../services/equipment-assignment.service';
import type { Equipment, EquipmentCategory } from '../../types';

interface AssignEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const categoryIcons: Record<EquipmentCategory, React.ReactNode> = {
  camera: <Camera className="h-4 w-4" />,
  lens: <Circle className="h-4 w-4" />,
  adapter: <Disc className="h-4 w-4" />,
  sd_card: <CreditCard className="h-4 w-4" />,
};

const categoryLabels: Record<EquipmentCategory, string> = {
  camera: 'Cámara',
  lens: 'Lente',
  adapter: 'Adaptador',
  sd_card: 'Tarjeta SD',
};

export function AssignEquipmentModal({ isOpen, onClose }: AssignEquipmentModalProps) {
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState('');
  const [eventId, setEventId] = useState('');
  const [startTime, setStartTime] = useState(formatDateTimeLocal(new Date()));
  const [notes, setNotes] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<Record<EquipmentCategory, string>>({
    camera: '',
    lens: '',
    adapter: '',
    sd_card: '',
  });
  const [error, setError] = useState('');

  // Fetch active becarios
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', { role: 'becario', isActive: true }],
    queryFn: () => userService.getAll({ limit: 100 }),
    enabled: isOpen,
  });

  // Fetch upcoming events
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => eventService.getUpcoming(),
    enabled: isOpen,
  });

  // Fetch available equipment
  const { data: equipmentData, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['equipment', { status: 'available' }],
    queryFn: () => equipmentService.getAll({ status: 'available', limit: 100 }),
    enabled: isOpen,
  });

  const users = usersData?.data?.filter((u) => u.isActive) || [];
  const events = eventsData || [];
  const equipment = equipmentData?.data || [];

  // Group equipment by category
  const equipmentByCategory = useMemo(() => {
    const grouped: Record<EquipmentCategory, Equipment[]> = {
      camera: [],
      lens: [],
      adapter: [],
      sd_card: [],
    };

    equipment.forEach((eq) => {
      if (eq.status === 'available' && eq.isActive) {
        grouped[eq.category].push(eq);
      }
    });

    return grouped;
  }, [equipment]);

  const createMutation = useMutation({
    mutationFn: equipmentAssignmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || 'Error al asignar equipos');
    },
  });

  const handleClose = () => {
    setUserId('');
    setEventId('');
    setStartTime(formatDateTimeLocal(new Date()));
    setNotes('');
    setSelectedEquipment({ camera: '', lens: '', adapter: '', sd_card: '' });
    setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('Selecciona un usuario');
      return;
    }

    const equipmentIds = Object.values(selectedEquipment).filter((id) => id !== '');

    if (equipmentIds.length === 0) {
      setError('Selecciona al menos un equipo');
      return;
    }

    createMutation.mutate({
      equipmentIds,
      userId,
      eventId: eventId || null,
      startTime: new Date(startTime).toISOString(),
      notes: notes || null,
    });
  };

  const handleEquipmentChange = (category: EquipmentCategory, value: string) => {
    setSelectedEquipment((prev) => ({ ...prev, [category]: value }));
  };

  const userOptions = [
    { value: '', label: 'Seleccionar usuario...' },
    ...users.map((u) => ({ value: u.id, label: u.name })),
  ];

  const eventOptions = [
    { value: '', label: 'Sin evento (préstamo general)' },
    ...events.map((e) => ({ value: e.id, label: e.name })),
  ];

  const selectedCount = Object.values(selectedEquipment).filter((id) => id !== '').length;

  if (!isOpen) return null;

  const isLoading = isLoadingUsers || isLoadingEvents || isLoadingEquipment;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Asignar Equipos" size="lg">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* User selection */}
          <Select
            label="Usuario"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            options={userOptions}
          />

          {/* Event selection */}
          <Select
            label="Evento (opcional)"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            options={eventOptions}
          />

          {/* Start time */}
          <Input
            type="datetime-local"
            label="Fecha y hora de inicio"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          {/* Equipment selection */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Equipos a asignar ({selectedCount} seleccionados)
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(categoryLabels) as EquipmentCategory[]).map((category) => {
                const categoryEquipment = equipmentByCategory[category];
                const options = [
                  { value: '', label: `Sin ${categoryLabels[category].toLowerCase()}` },
                  ...categoryEquipment.map((eq) => ({
                    value: eq.id,
                    label: eq.serialNumber ? `${eq.name} (${eq.serialNumber})` : eq.name,
                  })),
                ];

                return (
                  <div key={category} className="rounded-lg border border-gray-200 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                      {categoryIcons[category]}
                      {categoryLabels[category]}
                      <span className="text-xs text-gray-400">
                        ({categoryEquipment.length} disponibles)
                      </span>
                    </div>
                    <Select
                      value={selectedEquipment[category]}
                      onChange={(e) => handleEquipmentChange(category, e.target.value)}
                      options={options}
                      disabled={categoryEquipment.length === 0}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <Textarea
            label="Notas (opcional)"
            placeholder="Notas adicionales sobre el préstamo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={selectedCount === 0 || !userId}
            >
              Asignar {selectedCount > 0 && `(${selectedCount})`}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
