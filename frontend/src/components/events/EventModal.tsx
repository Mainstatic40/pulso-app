import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, FileText, User, Trash2, Edit2, Camera } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { EventForm, type EquipmentAssignments } from './EventForm';
import { eventService, type EventWithRelations, type UpdateEventRequest } from '../../services/event.service';
import { equipmentAssignmentService } from '../../services/equipment-assignment.service';
import { useAuthContext } from '../../stores/auth.store.tsx';
import type { EquipmentCategory, EquipmentAssignment } from '../../types';

const categoryConfig: Record<EquipmentCategory, { label: string; color: string; order: number }> = {
  camera: { label: 'Cámara', color: 'bg-blue-100 text-blue-800', order: 1 },
  lens: { label: 'Lente', color: 'bg-purple-100 text-purple-800', order: 2 },
  adapter: { label: 'Adaptador', color: 'bg-orange-100 text-orange-800', order: 3 },
  sd_card: { label: 'SD', color: 'bg-green-100 text-green-800', order: 4 },
};

interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
}

interface AssignmentBlock {
  odrenequipoId: string; // Unique key for this block
  odrenHoraInicio: string; // HH:mm
  HoraFin: string; // HH:mm
  userId: string;
  userName: string;
  equipment: EquipmentItem[];
}

// Parse time slot from notes field (format: "Turno: HH:mm - HH:mm")
function parseTimeSlotFromNotes(notes: string | null | undefined): { start: string; end: string } | null {
  if (!notes) return null;
  const match = notes.match(/Turno:\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
  if (match) {
    return { start: match[1], end: match[2] };
  }
  return null;
}

// Extract time from ISO datetime string
function extractTimeFromISO(isoString: string): string {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

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

  // Query equipment assignments for this event
  const { data: assignmentsData } = useQuery({
    queryKey: ['equipment-assignments', { eventId: event?.id }],
    queryFn: () => equipmentAssignmentService.getAll({ eventId: event!.id, limit: 100 }),
    enabled: !!event?.id && isOpen,
  });

  // Create individual assignment blocks (user + time slot + equipment)
  const assignmentBlocks = useMemo((): AssignmentBlock[] => {
    const assignments = assignmentsData?.data || [];
    const blocksMap = new Map<string, AssignmentBlock>();

    assignments.forEach((assignment: EquipmentAssignment) => {
      if (!assignment.user || !assignment.equipment) return;

      // Try to get time slot from notes, fallback to startTime
      const parsedTime = parseTimeSlotFromNotes(assignment.notes);
      let startTime: string;
      let endTime: string;

      if (parsedTime) {
        startTime = parsedTime.start;
        endTime = parsedTime.end;
      } else {
        startTime = extractTimeFromISO(assignment.startTime);
        endTime = assignment.endTime ? extractTimeFromISO(assignment.endTime) : '--:--';
      }

      // Create unique key for this block: odrenequipoId + odrenHoraInicio + HoraFin
      const blockKey = `${assignment.userId}-${startTime}-${endTime}`;

      // Get or create block
      if (!blocksMap.has(blockKey)) {
        blocksMap.set(blockKey, {
          odrenequipoId: blockKey,
          odrenHoraInicio: startTime,
          HoraFin: endTime,
          userId: assignment.user.id,
          userName: assignment.user.name,
          equipment: [],
        });
      }

      // Add equipment to block
      blocksMap.get(blockKey)!.equipment.push({
        id: assignment.equipment.id,
        name: assignment.equipment.name,
        category: assignment.equipment.category,
      });
    });

    // Convert to array
    const result = Array.from(blocksMap.values());

    // Sort by start time
    result.sort((a, b) => a.odrenHoraInicio.localeCompare(b.odrenHoraInicio));

    // Sort equipment within each block by category order
    result.forEach(block => {
      block.equipment.sort((a, b) =>
        categoryConfig[a.category].order - categoryConfig[b.category].order
      );
    });

    return result;
  }, [assignmentsData]);

  // Debug: Log assignments data
  console.log('EventModal - Event ID:', event?.id);
  console.log('EventModal - Assignments received:', assignmentsData?.data?.length || 0, 'items');
  console.log('EventModal - Assignment blocks:', assignmentBlocks.length, 'blocks');

  const updateEventMutation = useMutation({
    mutationFn: async ({
      eventData,
      equipmentAssignments,
    }: {
      eventData: UpdateEventRequest;
      equipmentAssignments?: EquipmentAssignments;
    }) => {
      const updatedEvent = await eventService.update(event!.id, eventData);

      // Step 1: Return all existing equipment assignments for this event
      const existingAssignments = assignmentsData?.data || [];
      for (const assignment of existingAssignments) {
        try {
          await equipmentAssignmentService.returnEquipment(assignment.id);
        } catch (error) {
          console.error('Error returning equipment:', error);
        }
      }

      // Step 2: Create new equipment assignments if any
      if (equipmentAssignments && Object.keys(equipmentAssignments).length > 0) {
        console.log('Processing equipment assignments for update:', equipmentAssignments);

        // Extract date part from event start datetime
        const eventDate = new Date(eventData.startDatetime || event!.startDatetime);
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Collect all assignment promises
        const assignmentPromises: Promise<{ userId: string; shift: string; success: boolean; error?: unknown }>[] = [];

        for (const [userId, userShifts] of Object.entries(equipmentAssignments)) {
          console.log(`Processing user ${userId} with ${userShifts.odrenedequipos.length} shifts`);

          for (const shift of userShifts.odrenedequipos) {
            const equipmentIds = [
              shift.cameraId,
              shift.lensId,
              shift.adapterId,
              shift.sdCardId,
            ].filter((id): id is string => !!id);

            if (equipmentIds.length > 0) {
              // Ensure time format is HH:mm (remove extra :00 if present)
              const startTimeStr = shift.odrenHoraInicio.substring(0, 5);
              const endTimeStr = shift.HoraFin.substring(0, 5);

              // Construct ISO datetime strings
              const startTime = new Date(`${dateStr}T${startTimeStr}:00`).toISOString();
              const endTime = new Date(`${dateStr}T${endTimeStr}:00`).toISOString();

              const shiftLabel = `${shift.odrenHoraInicio}-${shift.HoraFin}`;
              console.log(`Creating assignment: user=${userId}, shift=${shiftLabel}, equipmentIds=`, equipmentIds);

              // Add promise to array
              assignmentPromises.push(
                equipmentAssignmentService.create({
                  equipmentIds,
                  userId,
                  eventId: event!.id,
                  startTime,
                  endTime,
                  notes: `Turno: ${shiftLabel}`,
                })
                .then(() => ({ userId, shift: shiftLabel, success: true }))
                .catch((error) => ({ userId, shift: shiftLabel, success: false, error }))
              );
            }
          }
        }

        // Execute all assignments in parallel
        if (assignmentPromises.length > 0) {
          console.log(`Executing ${assignmentPromises.length} equipment assignments...`);
          const results = await Promise.all(assignmentPromises);

          // Log results
          const successful = results.filter(r => r.success);
          const failed = results.filter(r => !r.success);

          console.log(`Equipment assignments: ${successful.length} successful, ${failed.length} failed`);

          if (failed.length > 0) {
            console.error('Failed assignments:', failed);
          }
        }
      }

      return updatedEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
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
    if (window.confirm('Estas seguro de que deseas eliminar este evento?')) {
      deleteEventMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleUpdateEvent = (
    data: UpdateEventRequest,
    equipmentAssignments?: EquipmentAssignments
  ) => {
    updateEventMutation.mutate({ eventData: data, equipmentAssignments });
  };

  if (!isOpen || !event) return null;

  const status = getEventStatus(event.startDatetime, event.endDatetime);
  const statusInfo = statusConfig[status];

  if (isEditing) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Editar Evento" size="lg">
        <EventForm
          event={event}
          existingAssignments={assignmentsData?.data}
          onSubmit={handleUpdateEvent}
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

        {/* Equipment Distribution */}
        <div className="mt-6">
          <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Camera className="h-4 w-4" />
            Distribución de Equipos
          </h3>

          {assignmentBlocks.length > 0 ? (
            <div className="mt-3 space-y-3">
              {assignmentBlocks.map((block) => (
                <div
                  key={block.odrenequipoId}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  {/* User Name */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-gray-900">
                      {block.userName}
                    </span>
                  </div>

                  {/* Time Slot */}
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{block.odrenHoraInicio} - {block.HoraFin}</span>
                  </div>

                  {/* Equipment List */}
                  <div className="mt-3 space-y-1.5">
                    {block.equipment.map((eq) => (
                      <div
                        key={eq.id}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <span className="text-gray-400">•</span>
                        <span>{eq.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Sin equipos asignados</p>
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
