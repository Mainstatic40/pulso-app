import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, FileText, Trash2, Edit2, Flag, Church, Camera, Mic2, Users, MessageSquare, Send } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { Textarea } from '../ui/Textarea';
import { Avatar } from '../ui/Avatar';
import { EventForm } from './EventForm';
import { EventDaysDisplay } from './EventDaysDisplay';
import { EventChecklist } from './EventChecklist';
import { AttachmentsList } from '../shared/AttachmentsList';
import { eventService, type EventWithRelations, type EventWithDetails, type CreateEventRequest, type UpdateEventRequest } from '../../services/event.service';
import { commentService, type CommentWithUser } from '../../services/comment.service';
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

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  const [newComment, setNewComment] = useState('');

  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'supervisor';

  // Fetch full event details when modal opens
  const { data: eventDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['event', event?.id],
    queryFn: () => eventService.getById(event!.id),
    enabled: isOpen && !!event?.id,
    staleTime: 0, // Always refetch to get fresh data
  });

  // Fetch comments
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['event', event?.id, 'comments'],
    queryFn: () => commentService.getByEventId(event!.id),
    enabled: isOpen && !!event?.id,
    refetchInterval: 15000, // Poll every 15 seconds for new comments
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

  const addCommentMutation = useMutation({
    mutationFn: () => commentService.createForEvent(event!.id, { content: newComment }),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['event', event?.id, 'comments'] });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData(['event', event?.id, 'comments']);

      // Optimistically add comment
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content: newComment,
        createdAt: new Date().toISOString(),
        userId: user?.id,
        user: {
          id: user?.id,
          name: user?.name || '',
          email: user?.email || '',
          profileImage: user?.profileImage,
        },
      };

      queryClient.setQueryData(['event', event?.id, 'comments'], (old: CommentWithUser[] | undefined) => {
        return old ? [...old, optimisticComment] : [optimisticComment];
      });

      // Clear input immediately for better UX
      setNewComment('');

      return { previousComments };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(['event', event?.id, 'comments'], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event', event?.id, 'comments'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentService.delete(commentId),
    onMutate: async (commentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['event', event?.id, 'comments'] });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData(['event', event?.id, 'comments']);

      // Optimistically remove comment
      queryClient.setQueryData(['event', event?.id, 'comments'], (old: CommentWithUser[] | undefined) => {
        return old ? old.filter((c) => c.id !== commentId) : [];
      });

      return { previousComments };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(['event', event?.id, 'comments'], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event', event?.id, 'comments'] });
    },
  });

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      deleteEventMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setNewComment('');
    onClose();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate();
    }
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

  if (isEditing) {
    // If eventDetails hasn't loaded yet, show loading state
    if (!eventDetails && isLoadingDetails) {
      return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Cargando..." size="2xl">
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        </Modal>
      );
    }

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Editar Evento" size="2xl">
        <EventForm
          event={eventDetails || fullEvent}
          onSubmit={handleUpdateEvent}
          onCancel={() => setIsEditing(false)}
          isLoading={updateEventMutation.isPending}
        />
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Detalle del Evento" size="2xl">
      <div className="p-4 sm:p-6">
        {/* 1. Header - Nombre */}
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">{fullEvent.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {eventTypeInfo && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs ${eventTypeInfo.color}`}>
                  {eventTypeInfo.icon}
                  <span className="hidden sm:inline">{eventTypeInfo.label}</span>
                </span>
              )}
            </div>
          </div>
          {canEdit && (
            <div className="flex flex-shrink-0 gap-1 sm:gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="min-h-[36px] min-w-[36px] p-1.5 sm:min-h-0 sm:min-w-0 sm:p-2">
                <Edit2 className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={deleteEventMutation.isPending}
                  className="min-h-[36px] min-w-[36px] p-1.5 sm:min-h-0 sm:min-w-0 sm:p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 2. Date - Fecha */}
        <div className="mt-4 sm:mt-6">
          <div className="flex items-start gap-2 text-gray-600 sm:items-center sm:gap-3">
            <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 sm:mt-0 sm:h-5 sm:w-5" />
            <div className="min-w-0">
              <p className="text-sm font-medium sm:text-base">{formatFullDate(fullEvent.startDatetime)}</p>
              {!isSameDay(fullEvent.startDatetime, fullEvent.endDatetime) && (
                <p className="text-xs text-gray-500 sm:text-sm">
                  hasta {formatFullDate(fullEvent.endDatetime)} ({getDaysCount(fullEvent.startDatetime, fullEvent.endDatetime)} días)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. Description - Descripción */}
        {fullEvent.description && (
          <div className="mt-4 sm:mt-6">
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              Descripción
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-xs text-gray-600 sm:text-sm">{fullEvent.description}</p>
          </div>
        )}

        {/* 4. Client Requirements - Requisitos */}
        {fullEvent.clientRequirements && (
          <div className="mt-4 rounded-lg bg-yellow-50 p-3 sm:mt-6 sm:p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-yellow-800">
              <FileText className="h-4 w-4" />
              Requisitos del Cliente
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-xs text-yellow-700 sm:text-sm">
              {fullEvent.clientRequirements}
            </p>
          </div>
        )}

        {/* 5. Attachments - Archivos adjuntos */}
        <div className="mt-4 sm:mt-6">
          <AttachmentsList
            attachments={fullEvent.attachments || []}
            eventId={fullEvent.id}
            queryKey={['event', fullEvent.id]}
          />
        </div>

        {/* 6. Days and Shifts - Turnos */}
        {fullEvent.days && fullEvent.days.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isSameDay(fullEvent.startDatetime, fullEvent.endDatetime)
                  ? `Turnos (${totalShifts} ${totalShifts === 1 ? 'turno' : 'turnos'})`
                  : `Días y Turnos (${fullEvent.days.length} ${fullEvent.days.length === 1 ? 'día' : 'días'}, ${totalShifts} ${totalShifts === 1 ? 'turno' : 'turnos'})`
                }
              </span>
              <span className="sm:hidden">
                Turnos ({totalShifts})
              </span>
            </h3>
            <div className="mt-2 sm:mt-3">
              <EventDaysDisplay days={fullEvent.days} />
            </div>
          </div>
        )}

        {/* Yearbook-specific info */}
        {fullEvent.eventType === 'yearbook' && (
          <div className="mt-4 rounded-lg bg-blue-50 p-3 sm:mt-6 sm:p-4">
            <h3 className="text-sm font-medium text-blue-800">Configuración de Anuario</h3>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-blue-700 sm:grid-cols-2 sm:gap-4 sm:text-sm">
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
                <div className="sm:col-span-2">
                  <span className="font-medium">Equipo preset:</span> Activado
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Checklist Section */}
        <div className="mt-4 sm:mt-6">
          <EventChecklist
            eventId={fullEvent.id}
            items={fullEvent.checklistItems || []}
            readOnly={false}
          />
        </div>

        {/* 8. Comments Section */}
        <div className="mt-6 border-t border-gray-200 pt-4 sm:mt-8 sm:pt-6">
          <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MessageSquare className="h-4 w-4" />
            Comentarios ({comments?.length || 0})
          </h3>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="mt-3 sm:mt-4">
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={2}
                className="min-w-0 flex-1 text-sm sm:text-base"
              />
              <Button
                type="submit"
                isLoading={addCommentMutation.isPending}
                disabled={!newComment.trim()}
                className="flex-shrink-0 px-3 sm:px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Comments List */}
          <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
            {isLoadingComments ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : comments && comments.length > 0 ? (
              comments.map((comment: CommentWithUser) => (
                <div key={comment.id} className="flex gap-2 sm:gap-3">
                  <Avatar name={comment.user.name} profileImage={comment.user.profileImage} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="text-xs font-medium text-gray-900 sm:text-sm">
                        {comment.user.name}
                      </span>
                      <span className="text-[10px] text-gray-500 sm:text-xs">
                        {formatDateTime(comment.createdAt)}
                      </span>
                      {(user?.id === comment.userId || canEdit) && (
                        <button
                          onClick={() => {
                            if (window.confirm('¿Eliminar este comentario?')) {
                              deleteCommentMutation.mutate(comment.id);
                            }
                          }}
                          className="ml-auto min-h-[28px] min-w-[28px] p-1 text-gray-400 hover:text-red-600 sm:min-h-0 sm:min-w-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-600 sm:text-sm">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-gray-500 sm:text-sm">
                No hay comentarios aún
              </p>
            )}
          </div>
        </div>

        {/* Creator info */}
        {fullEvent.creator && (
          <div className="mt-4 border-t border-gray-200 pt-3 sm:mt-6 sm:pt-4">
            <p className="text-[10px] text-gray-500 sm:text-xs">
              Creado por {fullEvent.creator.name}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
