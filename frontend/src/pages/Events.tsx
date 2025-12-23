import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { EventCard, EventModal, EventForm } from '../components/events';
import { eventService, type EventWithRelations, type CreateEventRequest, type UpdateEventRequest } from '../services/event.service';
import { equipmentAssignmentService } from '../services/equipment-assignment.service';
import { useAuthContext } from '../stores/auth.store.tsx';
import type { EquipmentAssignments } from '../components/events/EventForm';

function sortEvents(events: EventWithRelations[]): EventWithRelations[] {
  const now = new Date();

  return [...events].sort((a, b) => {
    const aStart = new Date(a.startDatetime);
    const bStart = new Date(b.startDatetime);
    const aEnd = new Date(a.endDatetime);
    const bEnd = new Date(b.endDatetime);

    const aOngoing = now >= aStart && now <= aEnd;
    const bOngoing = now >= bStart && now <= bEnd;
    if (aOngoing && !bOngoing) return -1;
    if (!aOngoing && bOngoing) return 1;

    const aUpcoming = aStart > now;
    const bUpcoming = bStart > now;
    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;

    return aStart.getTime() - bStart.getTime();
  });
}

export function Events() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventWithRelations | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const canManageEvents = user?.role === 'admin' || user?.role === 'supervisor';

  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: ['events', { dateFrom, dateTo }],
    queryFn: () =>
      eventService.getAll({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit: 100,
      }),
  });

  const createEventMutation = useMutation({
    mutationFn: async ({
      eventData,
      equipmentAssignments,
    }: {
      eventData: CreateEventRequest;
      equipmentAssignments?: EquipmentAssignments;
    }) => {
      const event = await eventService.create(eventData);

      // Create equipment assignments if any (new shift-based structure)
      if (equipmentAssignments && Object.keys(equipmentAssignments).length > 0) {
        console.log('Processing equipment assignments:', equipmentAssignments);

        // Extract date part from event start datetime (already ISO format)
        const eventDate = new Date(eventData.startDatetime);
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
                  eventId: event.id,
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

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      setIsCreateModalOpen(false);
    },
  });

  const events = useMemo(() => {
    const allEvents = eventsResponse?.data || [];
    const filtered = allEvents.filter((event) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        event.name.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query)
      );
    });
    return sortEvents(filtered);
  }, [eventsResponse?.data, searchQuery]);

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = searchQuery || dateFrom || dateTo;

  const handleCreateEvent = (
    data: CreateEventRequest | UpdateEventRequest,
    equipmentAssignments?: EquipmentAssignments
  ) => {
    createEventMutation.mutate({ eventData: data as CreateEventRequest, equipmentAssignments });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        {canManageEvents && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Evento
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Desde</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36"
              />
              <span className="text-sm text-gray-500">hasta</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36"
              />
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay eventos</h3>
            <p className="mt-2 text-gray-500">
              {hasFilters
                ? 'No se encontraron eventos con los filtros seleccionados.'
                : 'Aun no hay eventos creados.'}
            </p>
            {canManageEvents && !hasFilters && (
              <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primer evento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      )}

      <EventModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nuevo Evento"
        size="lg"
      >
        <EventForm
          onSubmit={handleCreateEvent}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createEventMutation.isPending}
        />
      </Modal>
    </div>
  );
}
