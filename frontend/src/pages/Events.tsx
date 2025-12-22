import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { EventCard, EventModal, EventForm } from '../components/events';
import { eventService, type EventWithRelations, type CreateEventRequest } from '../services/event.service';
import { useAuthContext } from '../stores/auth.store.tsx';

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
    mutationFn: (data: CreateEventRequest) => eventService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
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
          onSubmit={(data) => createEventMutation.mutate(data as CreateEventRequest)}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createEventMutation.isPending}
        />
      </Modal>
    </div>
  );
}
