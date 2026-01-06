import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { EventCard, EventModal, EventForm } from '../components/events';
import { eventService, type EventWithRelations, type CreateEventRequest } from '../services/event.service';
import { useAuthContext } from '../stores/auth.store.tsx';
import type { EventType } from '../types';

function groupEventsByStatus(events: EventWithRelations[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming: EventWithRelations[] = [];
  const past: EventWithRelations[] = [];

  events.forEach(event => {
    const eventDate = new Date(event.startDatetime);
    if (eventDate >= today) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  });

  // Proximos: el mas cercano primero
  upcoming.sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime());
  // Pasados: el mas reciente primero
  past.sort((a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime());

  return { upcoming, past };
}

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'civic', label: 'Cívico' },
  { value: 'church', label: 'Iglesia' },
  { value: 'yearbook', label: 'Anuario' },
  { value: 'congress', label: 'Congreso' },
];

export function Events() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | ''>('');
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

  // Create event mutation - now simpler since equipment is handled within days/shifts
  const createEventMutation = useMutation({
    mutationFn: (eventData: CreateEventRequest) => eventService.create(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      setIsCreateModalOpen(false);
    },
  });

  const { upcoming, past } = useMemo(() => {
    const allEvents = eventsResponse?.data || [];
    const filtered = allEvents.filter((event) => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          event.name.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Filter by event type
      if (eventTypeFilter && event.eventType !== eventTypeFilter) {
        return false;
      }

      return true;
    });
    return groupEventsByStatus(filtered);
  }, [eventsResponse?.data, searchQuery, eventTypeFilter]);

  const hasEvents = upcoming.length > 0 || past.length > 0;

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setEventTypeFilter('');
  };

  const hasFilters = searchQuery || dateFrom || dateTo || eventTypeFilter;

  const handleCreateEvent = (data: CreateEventRequest) => {
    createEventMutation.mutate(data);
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
          {/* Desktop: single row */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Search */}
            <div className="relative min-w-[300px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Event Type */}
            <Select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value as EventType | '')}
              options={EVENT_TYPE_OPTIONS}
              className="w-40"
            />

            {/* Date Range */}
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36"
                title="Fecha inicio"
              />
              <span className="text-gray-300">—</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36"
                title="Fecha fin"
              />
            </div>

            {/* Clear button */}
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>

          {/* Mobile: stacked layout */}
          <div className="space-y-3 md:hidden">
            {/* Search - full width */}
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

            {/* Filters row */}
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value as EventType | '')}
                options={EVENT_TYPE_OPTIONS}
              />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="Fecha inicio"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="Fecha fin"
              />
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
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
      ) : !hasEvents ? (
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
        <div className="space-y-8">
          {/* Eventos Proximos */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Proximos Eventos ({upcoming.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Eventos Pasados */}
          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                Eventos Pasados ({past.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-75">
                {past.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            </div>
          )}
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
        size="2xl"
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
