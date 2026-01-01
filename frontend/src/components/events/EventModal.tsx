import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, FileText, Trash2, Edit2, Flag, Church, Camera, Mic2, Users } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { EventForm } from './EventForm';
import { EventDaysDisplay } from './EventDaysDisplay';
import { AttachmentsList } from '../shared/AttachmentsList';
import { eventService, type EventWithRelations, type EventWithDetails, type CreateEventRequest, type UpdateEventRequest } from '../../services/event.service';
import { useAuthContext } from '../../stores/auth.store.tsx';
import type { EventType } from '../../types';

interface EventModalProps {
  event: EventWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatFullDate(dateString: string): string {
  // Extract date part to avoid timezone issues
  const datePart = dateString.split('T')[0];
  const date = new Date(datePart + 'T12:00:00');
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getDaysCount(start: string, end: string): number {
  const startPart = start.split('T')[0];
  const endPart = end.split('T')[0];

  // Si son el mismo día, retornar 1
  if (startPart === endPart) {
    return 1;
  }

  const startDate = new Date(startPart + 'T12:00:00');
  const endDate = new Date(endPart + 'T12:00:00');
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

function isSameDay(start: string, end: string): boolean {
  const startPart = start.split('T')[0];
  const endPart = end.split('T')[0];
  return startPart === endPart;
}

function getEventStatus(start: string, end: string): 'today' | 'upcoming' | 'past' | 'ongoing' {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  if (now >= startDate && now <= endDate) return 'ongoing';
  if (eventDay.getTime() === today.getTime()) return 'today';
  if (startDate > now) return 'upcoming';
  return 'past';
}

const statusConfig = {
  ongoing: { label: 'En curso', variant: 'success' as const },
  today: { label: 'Hoy', variant: 'warning' as const },
  upcoming: { label: 'Próximo', variant: 'info' as const },
  past: { label: 'Pasado', variant: 'default' as const },
};

const eventTypeConfig: Record<EventType, { label: string; icon: React.ReactNode; color: string }> = {
  civic: {
    label: 'Evento Cívico',
    icon: <Flag className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800',
  },
  church: {
    label: 'Iglesia Universitaria',
    icon: <Church className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800',
  },
  yearbook: {
    label: 'Foto de Anuario',
    icon: <Camera className="h-4 w-4" />,
    color: 'bg-amber-100 text-amber-800',
  },
  congress: {
    label: 'Congreso',
    icon: <Mic2 className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800',
  },
};

export function EventModal({ event, isOpen, onClose }: EventModalProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'supervisor';

  // Fetch full event details when modal opens
  const { data: eventDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['event', event?.id],
    queryFn: () => eventService.getById(event!.id),
    enabled: isOpen && !!event?.id,
    staleTime: 0, // Always refetch to get fresh data
  });

  // Use full details when available, otherwise fall back to list data
  const fullEvent: EventWithDetails | null = eventDetails || event;

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  const updateEventMutation = useMutation({
    mutationFn: (data: UpdateEventRequest) => eventService.update(event!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', event?.id] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      setIsEditing(false);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: () => eventService.delete(event!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      deleteEventMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleUpdateEvent = (data: CreateEventRequest | UpdateEventRequest) => {
    updateEventMutation.mutate(data as UpdateEventRequest);
  };

  if (!isOpen || !event) return null;

  // Show loading state while fetching details
  if (isLoadingDetails && !eventDetails) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Cargando..." size="2xl">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Modal>
    );
  }

  if (!fullEvent) return null;

  const status = getEventStatus(fullEvent.startDatetime, fullEvent.endDatetime);
  const statusInfo = statusConfig[status];
  const eventTypeInfo = fullEvent.eventType ? eventTypeConfig[fullEvent.eventType] : null;

  // Count total shifts
  const totalShifts = fullEvent.days?.reduce((acc, day) => acc + (day.shifts?.length || 0), 0) || 0;

  // DEBUG: Log event data
  console.log('=== EventModal fullEvent ===');
  console.log('Event ID:', fullEvent.id);
  console.log('Days count:', fullEvent.days?.length || 0);
  console.log('Total shifts:', totalShifts);
  fullEvent.days?.forEach((day, i) => {
    console.log(`Day ${i + 1}:`, {
      date: day.date,
      shiftsCount: day.shifts?.length || 0,
    });
  });
  console.log('=== End EventModal ===');

  if (isEditing) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Editar Evento" size="2xl">
        <EventForm
          event={fullEvent}
          onSubmit={handleUpdateEvent}
          onCancel={() => setIsEditing(false)}
          isLoading={updateEventMutation.isPending}
        />
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Detalle del Evento" size="2xl">
      <div className="p-6">
        {/* 1. Header - Nombre */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{fullEvent.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {eventTypeInfo && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${eventTypeInfo.color}`}>
                  {eventTypeInfo.icon}
                  {eventTypeInfo.label}
                </span>
              )}
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={deleteEventMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 2. Date - Fecha */}
        <div className="mt-6">
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium">{formatFullDate(fullEvent.startDatetime)}</p>
              {!isSameDay(fullEvent.startDatetime, fullEvent.endDatetime) && (
                <p className="text-sm text-gray-500">
                  hasta {formatFullDate(fullEvent.endDatetime)} ({getDaysCount(fullEvent.startDatetime, fullEvent.endDatetime)} días)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. Description - Descripción */}
        {fullEvent.description && (
          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              Descripción
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-gray-600">{fullEvent.description}</p>
          </div>
        )}

        {/* 4. Client Requirements - Requisitos */}
        {fullEvent.clientRequirements && (
          <div className="mt-6 rounded-lg bg-yellow-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-yellow-800">
              <FileText className="h-4 w-4" />
              Requisitos del Cliente
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-yellow-700">
              {fullEvent.clientRequirements}
            </p>
          </div>
        )}

        {/* 5. Attachments - Archivos adjuntos */}
        <div className="mt-6">
          <AttachmentsList
            attachments={fullEvent.attachments || []}
            eventId={fullEvent.id}
            queryKey={['event', fullEvent.id]}
          />
        </div>

        {/* 6. Days and Shifts - Turnos */}
        {fullEvent.days && fullEvent.days.length > 0 && (
          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4" />
              {isSameDay(fullEvent.startDatetime, fullEvent.endDatetime)
                ? `Turnos (${totalShifts} ${totalShifts === 1 ? 'turno' : 'turnos'})`
                : `Días y Turnos (${fullEvent.days.length} ${fullEvent.days.length === 1 ? 'día' : 'días'}, ${totalShifts} ${totalShifts === 1 ? 'turno' : 'turnos'})`
              }
            </h3>
            <div className="mt-3">
              <EventDaysDisplay days={fullEvent.days} />
            </div>
          </div>
        )}

        {/* Yearbook-specific info */}
        {fullEvent.eventType === 'yearbook' && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <h3 className="text-sm font-medium text-blue-800">Configuración de Anuario</h3>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-blue-700">
              {fullEvent.morningStartTime && fullEvent.morningEndTime && (
                <div>
                  <span className="font-medium">Mañana:</span> {fullEvent.morningStartTime} - {fullEvent.morningEndTime}
                </div>
              )}
              {fullEvent.afternoonStartTime && fullEvent.afternoonEndTime && (
                <div>
                  <span className="font-medium">Tarde:</span> {fullEvent.afternoonStartTime} - {fullEvent.afternoonEndTime}
                </div>
              )}
              {fullEvent.usePresetEquipment && (
                <div className="col-span-2">
                  <span className="font-medium">Equipo preset:</span> Activado
                </div>
              )}
            </div>
          </div>
        )}

        {/* Creator info */}
        {fullEvent.creator && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              Creado por {fullEvent.creator.name}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
