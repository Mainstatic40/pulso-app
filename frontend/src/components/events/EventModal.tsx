import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, FileText, User, Trash2, Edit2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { EventForm } from './EventForm';
import { eventService, type EventWithRelations, type UpdateEventRequest } from '../../services/event.service';
import { useAuthContext } from '../../stores/auth.store.tsx';

interface EventModalProps {
  event: EventWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours === 0) return `${diffMinutes} minutos`;
  if (diffMinutes === 0) return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  return `${diffHours}h ${diffMinutes}m`;
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
  upcoming: { label: 'Proximo', variant: 'info' as const },
  past: { label: 'Pasado', variant: 'default' as const },
};

export function EventModal({ event, isOpen, onClose }: EventModalProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'supervisor';

  const updateEventMutation = useMutation({
    mutationFn: (data: UpdateEventRequest) => eventService.update(event!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
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
    if (window.confirm('Estas seguro de que deseas eliminar este evento?')) {
      deleteEventMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!isOpen || !event) return null;

  const status = getEventStatus(event.startDatetime, event.endDatetime);
  const statusInfo = statusConfig[status];

  if (isEditing) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Editar Evento" size="lg">
        <EventForm
          event={event}
          onSubmit={(data) => updateEventMutation.mutate(data)}
          onCancel={() => setIsEditing(false)}
          isLoading={updateEventMutation.isPending}
        />
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Detalle del Evento" size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{event.name}</h2>
            <Badge variant={statusInfo.variant} className="mt-2">
              {statusInfo.label}
            </Badge>
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

        {/* Description */}
        {event.description && (
          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              Descripcion
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-gray-600">{event.description}</p>
          </div>
        )}

        {/* Date and Time */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium">{formatFullDate(event.startDatetime)}</p>
              {formatFullDate(event.startDatetime) !== formatFullDate(event.endDatetime) && (
                <p className="text-sm text-gray-500">
                  hasta {formatFullDate(event.endDatetime)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Clock className="h-5 w-5 text-gray-400" />
            <div>
              <p>
                {formatTime(event.startDatetime)} - {formatTime(event.endDatetime)}
              </p>
              <p className="text-sm text-gray-500">
                Duracion: {formatDuration(event.startDatetime, event.endDatetime)}
              </p>
            </div>
          </div>
        </div>

        {/* Client Requirements */}
        {event.clientRequirements && (
          <div className="mt-6 rounded-lg bg-yellow-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-yellow-800">
              <FileText className="h-4 w-4" />
              Requisitos del Cliente
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-yellow-700">
              {event.clientRequirements}
            </p>
          </div>
        )}

        {/* Assignees */}
        <div className="mt-6">
          <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="h-4 w-4" />
            Personal Asignado ({event.assignees?.length || 0})
          </h3>
          {event.assignees && event.assignees.length > 0 ? (
            <div className="mt-3 space-y-2">
              {event.assignees.map((assignee) => (
                <div
                  key={assignee.user.id}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                >
                  <Avatar name={assignee.user.name} size="md" />
                  <div>
                    <p className="font-medium text-gray-900">{assignee.user.name}</p>
                    <p className="text-sm text-gray-500">{assignee.user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Sin personal asignado</p>
          )}
        </div>

        {/* Creator info */}
        {event.creator && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              Creado por {event.creator.name}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
