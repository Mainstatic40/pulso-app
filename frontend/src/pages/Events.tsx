import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, Clock, LayoutGrid, List, ChevronLeft, ChevronRight, CalendarDays, CheckSquare, Square, X, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { EventCard, EventModal, EventForm, EventKanbanBoard } from '../components/events';
import { eventService, type EventWithRelations, type CreateEventRequest } from '../services/event.service';
import { useAuthContext } from '../stores/auth.store.tsx';
import { getImageUrl } from '../lib/utils';
import type { EventType } from '../types';

type ViewMode = 'list' | 'board';

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
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | ''>('');
  const [selectedEvent, setSelectedEvent] = useState<EventWithRelations | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null);

  // Weekend filter
  const [showWeekendOnly, setShowWeekendOnly] = useState(false);

  // Selection mode for export
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const canManageEvents = user?.role === 'admin' || user?.role === 'supervisor';

  // Toggle event selection
  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Exit selection mode
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedEventIds(new Set());
  };

  // Select all visible events
  const selectAllVisible = () => {
    const allIds = new Set([...upcoming.map(e => e.id), ...past.map(e => e.id)]);
    setSelectedEventIds(allIds);
  };

  // Month navigation for board view
  const goToPreviousMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  // Handle ?open=ID parameter from notifications
  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId) {
      setPendingOpenId(openId);
      // Clear the URL parameter
      searchParams.delete('open');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: ['events', { dateFrom, dateTo }],
    queryFn: () =>
      eventService.getAll({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit: 100,
      }),
  });

  // Open event modal when data loads and we have a pending ID
  useEffect(() => {
    if (pendingOpenId && eventsResponse?.data) {
      const event = eventsResponse.data.find((e: EventWithRelations) => e.id === pendingOpenId);
      if (event) {
        setSelectedEvent(event);
      }
      setPendingOpenId(null);
    }
  }, [pendingOpenId, eventsResponse?.data]);

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

      // Filter by weekend (Friday, Saturday, Sunday)
      if (showWeekendOnly) {
        const date = new Date(event.startDatetime);
        const dayOfWeek = date.getDay(); // 0=Sun, 5=Fri, 6=Sat
        if (dayOfWeek !== 0 && dayOfWeek !== 5 && dayOfWeek !== 6) {
          return false;
        }
      }

      return true;
    });
    return groupEventsByStatus(filtered);
  }, [eventsResponse?.data, searchQuery, eventTypeFilter, showWeekendOnly]);

  const hasEvents = upcoming.length > 0 || past.length > 0;

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setEventTypeFilter('');
    setShowWeekendOnly(false);
  };

  const hasFilters = searchQuery || dateFrom || dateTo || eventTypeFilter || showWeekendOnly;

  const handleCreateEvent = (data: CreateEventRequest) => {
    createEventMutation.mutate(data);
  };

  // Export selected events to a single PDF with full details
  const exportSelectedEvents = async () => {
    if (selectedEventIds.size === 0) {
      alert('Selecciona al menos un evento');
      return;
    }

    setIsExporting(true);
    try {
      // Helper to load image as base64
      const loadImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
        try {
          const response = await fetch(imageUrl, { credentials: 'include' });
          if (!response.ok) return null;
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      };

      // Fetch full details for each selected event
      const eventIds = Array.from(selectedEventIds);
      const fullEvents = await Promise.all(
        eventIds.map(id => eventService.getById(id))
      );

      // Collect all unique users with profile images
      const usersWithImages = new Map<string, string>();
      for (const event of fullEvents) {
        for (const day of event.days || []) {
          for (const shift of day.shifts || []) {
            if (shift.user?.profileImage && shift.user?.id) {
              const imageUrl = getImageUrl(shift.user.profileImage);
              if (imageUrl) {
                usersWithImages.set(shift.user.id, imageUrl);
              }
            }
          }
        }
        // Also check comments authors
        for (const comment of event.comments || []) {
          if (comment.user?.profileImage && comment.user?.id) {
            const imageUrl = getImageUrl(comment.user.profileImage);
            if (imageUrl) {
              usersWithImages.set(comment.user.id, imageUrl);
            }
          }
        }
      }

      // Load all images in parallel
      const userImages = new Map<string, string>();
      await Promise.all(
        Array.from(usersWithImages.entries()).map(async ([userId, imageUrl]) => {
          const base64 = await loadImageAsBase64(imageUrl);
          if (base64) {
            userImages.set(userId, base64);
          }
        })
      );

      const pdf = new jsPDF('p', 'mm', 'letter');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = 20;

      // Event type labels
      const eventTypeLabels: Record<EventType, string> = {
        civic: 'Evento Cívico',
        church: 'Iglesia Universitaria',
        yearbook: 'Foto de Anuario',
        congress: 'Congreso',
      };

      // Equipment category labels
      const equipmentCategoryLabels: Record<string, string> = {
        camera: 'Cámara',
        lens: 'Lente',
        adapter: 'Adaptador',
        sd_card: 'SD',
      };

      // Helper to check if we need a new page
      const checkNewPage = (neededHeight: number) => {
        if (yPosition + neededHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Document title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Eventos Seleccionados', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, pageWidth / 2, yPosition, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.text(`Total: ${fullEvents.length} evento(s)`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      fullEvents.forEach((event, eventIndex) => {
        // Start each event on a new page (except the first)
        if (eventIndex > 0) {
          pdf.addPage();
          yPosition = 20;
        }

        // Event header with number badge
        pdf.setFillColor(204, 0, 0);
        pdf.circle(margin + 4, yPosition - 1, 4, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${eventIndex + 1}`, margin + 4, yPosition + 0.5, { align: 'center' });
        pdf.setTextColor(0, 0, 0);

        // Event name
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const nameLines = pdf.splitTextToSize(event.name, contentWidth - 15);
        pdf.text(nameLines, margin + 12, yPosition);
        yPosition += nameLines.length * 6;

        // Event type badge
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Tipo: ${eventTypeLabels[event.eventType]}`, margin, yPosition);
        pdf.setTextColor(0, 0, 0);
        yPosition += 6;

        // Date range
        const startDate = new Date(event.startDatetime);
        const endDate = new Date(event.endDatetime);
        const isSameDay = startDate.toDateString() === endDate.toDateString();

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Fecha: ', margin, yPosition);
        pdf.setFont('helvetica', 'normal');

        if (isSameDay) {
          pdf.text(startDate.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }), margin + 15, yPosition);
        } else {
          const dateRange = `${startDate.toLocaleDateString('es-MX', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          })} - ${endDate.toLocaleDateString('es-MX', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}`;
          pdf.text(dateRange, margin + 15, yPosition);
        }
        yPosition += 8;

        // Description
        if (event.description) {
          checkNewPage(20);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Descripción:', margin, yPosition);
          yPosition += 5;
          pdf.setFont('helvetica', 'normal');
          const descLines = pdf.splitTextToSize(event.description, contentWidth);
          pdf.text(descLines, margin, yPosition);
          yPosition += descLines.length * 4.5 + 3;
        }

        // Client requirements (highlighted box)
        if (event.clientRequirements) {
          const reqLines = pdf.splitTextToSize(event.clientRequirements, contentWidth - 10);
          const reqHeight = reqLines.length * 4.5 + 12;
          checkNewPage(reqHeight + 5);

          pdf.setFillColor(254, 243, 199);
          pdf.roundedRect(margin, yPosition - 2, contentWidth, reqHeight, 2, 2, 'F');

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(146, 64, 14);
          pdf.text('Requisitos del cliente:', margin + 3, yPosition + 3);
          pdf.setFont('helvetica', 'normal');
          pdf.text(reqLines, margin + 3, yPosition + 9);
          pdf.setTextColor(0, 0, 0);
          yPosition += reqHeight + 5;
        }

        // Days and Shifts with Equipment
        if (event.days && event.days.length > 0) {
          const totalShifts = event.days.reduce((acc, d) => acc + (d.shifts?.length || 0), 0);

          if (totalShifts > 0) {
            checkNewPage(25);
            yPosition += 3;

            // Section divider
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`TURNOS ASIGNADOS (${totalShifts})`, margin, yPosition);
            yPosition += 8;

            event.days.forEach((day, dayIndex) => {
              if (!day.shifts || day.shifts.length === 0) return;

              checkNewPage(30);

              // Day header - safely parse date
              let dayLabel = `Dia ${dayIndex + 1}`;
              if (day.date) {
                try {
                  // Handle both "2024-12-30" and "2024-12-30T..." formats
                  const datePart = day.date.split('T')[0];
                  const dayDate = new Date(datePart + 'T12:00:00');
                  if (!isNaN(dayDate.getTime())) {
                    dayLabel = dayDate.toLocaleDateString('es-MX', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    });
                  }
                } catch {
                  // Keep default label
                }
              }

              pdf.setFillColor(240, 240, 240);
              pdf.roundedRect(margin, yPosition - 3, contentWidth, 8, 1, 1, 'F');
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(60, 60, 60);
              pdf.text('DIA ' + (dayIndex + 1) + ' - ' + dayLabel, margin + 3, yPosition + 2);
              pdf.setTextColor(0, 0, 0);
              yPosition += 10;

              // Day note
              if (day.note) {
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'italic');
                pdf.setTextColor(100, 100, 100);
                const noteLines = pdf.splitTextToSize('Nota: ' + day.note, contentWidth - 10);
                pdf.text(noteLines, margin + 5, yPosition);
                pdf.setTextColor(0, 0, 0);
                yPosition += noteLines.length * 4 + 3;
              }

              // Shifts for this day
              day.shifts.forEach((shift, shiftIndex) => {
                checkNewPage(40);

                const userName = shift.user?.name || 'Sin asignar';
                const userImage = shift.user?.id ? userImages.get(shift.user.id) : null;

                // Shift header
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.text('TURNO ' + (shiftIndex + 1) + ': ' + shift.startTime + ' - ' + shift.endTime, margin + 5, yPosition);
                yPosition += 6;

                // User assigned with profile image
                if (userImage) {
                  try {
                    // Add circular profile image (8x8mm)
                    pdf.addImage(userImage, 'JPEG', margin + 7, yPosition - 2, 8, 8);
                    // Text after image
                    pdf.setFontSize(9);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text('Asignado:', margin + 17, yPosition + 2);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(userName, margin + 32, yPosition + 2);
                    pdf.setFont('helvetica', 'normal');
                    yPosition += 10;
                  } catch {
                    // If image fails, show text only
                    pdf.setFontSize(9);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text('  Asignado: ' + userName, margin + 5, yPosition);
                    yPosition += 5;
                  }
                } else {
                  // No image, just text
                  pdf.setFontSize(9);
                  pdf.setFont('helvetica', 'normal');
                  pdf.text('  Asignado: ' + userName, margin + 5, yPosition);
                  yPosition += 5;
                }

                // Shift note
                if (shift.note) {
                  const shiftNoteLines = pdf.splitTextToSize(shift.note, contentWidth - 35);
                  pdf.text('  Nota: ', margin + 5, yPosition);
                  pdf.text(shiftNoteLines, margin + 20, yPosition);
                  yPosition += shiftNoteLines.length * 4 + 1;
                }

                // Equipment assignments for this shift
                if (shift.equipmentAssignments && shift.equipmentAssignments.length > 0) {
                  pdf.text('  Equipo:', margin + 5, yPosition);
                  yPosition += 5;

                  shift.equipmentAssignments.forEach(assignment => {
                    if (assignment.equipment) {
                      const categoryLabel = equipmentCategoryLabels[assignment.equipment.category] || assignment.equipment.category;
                      pdf.text('    - ' + categoryLabel + ': ' + assignment.equipment.name, margin + 5, yPosition);
                      yPosition += 4;
                    }
                  });
                }

                yPosition += 4;
              });

              yPosition += 3;
            });
          }
        }

        // Checklist section
        if (event.checklistItems && event.checklistItems.length > 0) {
          checkNewPage(25);
          yPosition += 3;

          // Section divider
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 8;

          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('CHECKLIST', margin, yPosition);
          yPosition += 7;

          const completedCount = event.checklistItems.filter(item => item.isCompleted).length;
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text(`(${completedCount}/${event.checklistItems.length} completados)`, margin + 25, yPosition - 7);
          pdf.setTextColor(0, 0, 0);

          event.checklistItems.forEach(item => {
            checkNewPage(8);

            pdf.setFontSize(10);
            if (item.isCompleted) {
              // Green checkmark for completed
              pdf.setTextColor(34, 197, 94);
              pdf.text('[X]', margin + 3, yPosition);
              pdf.setTextColor(100, 100, 100); // Gray text for completed items
            } else {
              // Gray empty box for pending
              pdf.setTextColor(150, 150, 150);
              pdf.text('[ ]', margin + 3, yPosition);
              pdf.setTextColor(0, 0, 0); // Black text for pending items
            }

            const itemLines = pdf.splitTextToSize(item.content, contentWidth - 15);
            pdf.text(itemLines, margin + 12, yPosition);
            pdf.setTextColor(0, 0, 0);
            yPosition += itemLines.length * 4.5 + 2;
          });
        }

        // Comments section
        if (event.comments && event.comments.length > 0) {
          checkNewPage(25);
          yPosition += 3;

          // Section divider
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 8;

          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`COMENTARIOS (${event.comments.length})`, margin, yPosition);
          yPosition += 8;

          event.comments.forEach(comment => {
            checkNewPage(25);

            const commentDate = new Date(comment.createdAt).toLocaleDateString('es-MX', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
            const userName = comment.user?.name || 'Usuario';
            const commentUserImage = comment.user?.id ? userImages.get(comment.user.id) : null;

            // Comment header with optional profile image
            if (commentUserImage) {
              try {
                pdf.addImage(commentUserImage, 'JPEG', margin, yPosition - 2, 7, 7);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(70, 70, 70);
                pdf.text(userName + ' - ' + commentDate + ':', margin + 9, yPosition + 2);
                pdf.setTextColor(0, 0, 0);
                yPosition += 8;
              } catch {
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(70, 70, 70);
                pdf.text('[' + userName + ' - ' + commentDate + ']:', margin, yPosition);
                pdf.setTextColor(0, 0, 0);
                yPosition += 5;
              }
            } else {
              pdf.setFontSize(9);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(70, 70, 70);
              pdf.text('[' + userName + ' - ' + commentDate + ']:', margin, yPosition);
              pdf.setTextColor(0, 0, 0);
              yPosition += 5;
            }

            pdf.setFont('helvetica', 'normal');
            const commentLines = pdf.splitTextToSize(comment.content, contentWidth - 5);
            pdf.text(commentLines, margin + 3, yPosition);
            yPosition += commentLines.length * 4.5 + 4;
          });
        }
      });

      // Footer on last page
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('PULSO - Sistema de Gestión de Horas y Tareas', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save PDF
      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`eventos_${dateStr}.pdf`);

      // Exit selection mode after export
      exitSelectionMode();
    } catch (error) {
      console.error('Error exporting events to PDF:', error);
      alert('Error al exportar los eventos. Por favor intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Selection Mode Controls */}
          {selectionMode ? (
            <>
              <span className="text-sm text-gray-600">
                {selectedEventIds.size} seleccionado(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllVisible}
              >
                Seleccionar todos
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={exportSelectedEvents}
                disabled={selectedEventIds.size === 0 || isExporting}
                isLoading={isExporting}
              >
                <FileText className="mr-1 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitSelectionMode}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {/* Selection Mode Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectionMode(true)}
                title="Seleccionar eventos para exportar"
              >
                <CheckSquare className="mr-1 h-4 w-4" />
                Seleccionar
              </Button>

              {/* View Toggle */}
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                  Lista
                </button>
                <button
                  onClick={() => setViewMode('board')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'board'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Tablero
                </button>
              </div>

              {canManageEvents && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Evento
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Desktop: single row */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Search */}
            <div className="relative min-w-[250px] flex-1">
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

            {/* Weekend Filter Toggle */}
            <button
              onClick={() => setShowWeekendOnly(!showWeekendOnly)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                showWeekendOnly
                  ? 'border-purple-300 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Mostrar solo eventos de viernes, sábado y domingo"
            >
              <CalendarDays className="h-4 w-4" />
              Fin de semana
            </button>

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

            {/* Weekend Filter + Type */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowWeekendOnly(!showWeekendOnly)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  showWeekendOnly
                    ? 'border-purple-300 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Fin de semana
              </button>
              <Select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value as EventType | '')}
                options={EVENT_TYPE_OPTIONS}
                className="flex-1"
              />
            </div>

            {/* Date Filters row */}
            <div className="grid grid-cols-2 gap-2">
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
            </div>

            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Month Selector for Board View */}
      {viewMode === 'board' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="min-w-[180px] text-center text-lg font-semibold capitalize text-gray-900">
              {formatMonthYear(selectedMonth)}
            </h2>
            <button
              onClick={goToNextMonth}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
            Hoy
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : viewMode === 'board' ? (
        /* Board View */
        <div className="min-h-[500px]">
          <EventKanbanBoard
            events={eventsResponse?.data || []}
            selectedMonth={selectedMonth}
            onEventClick={(event) => setSelectedEvent(event)}
          />
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
        /* List View */
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
                  <div key={event.id} className="relative">
                    {selectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEventSelection(event.id);
                        }}
                        className="absolute -left-2 -top-2 z-10 rounded-full bg-white p-1 shadow-md border border-gray-200 hover:bg-gray-50"
                      >
                        {selectedEventIds.has(event.id) ? (
                          <CheckSquare className="h-5 w-5 text-red-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    )}
                    <div
                      className={`transition-all ${
                        selectionMode && selectedEventIds.has(event.id)
                          ? 'ring-2 ring-red-500 ring-offset-2 rounded-lg'
                          : ''
                      }`}
                    >
                      <EventCard
                        event={event}
                        onClick={() => selectionMode ? toggleEventSelection(event.id) : setSelectedEvent(event)}
                      />
                    </div>
                  </div>
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
                  <div key={event.id} className="relative">
                    {selectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEventSelection(event.id);
                        }}
                        className="absolute -left-2 -top-2 z-10 rounded-full bg-white p-1 shadow-md border border-gray-200 hover:bg-gray-50"
                      >
                        {selectedEventIds.has(event.id) ? (
                          <CheckSquare className="h-5 w-5 text-red-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    )}
                    <div
                      className={`transition-all ${
                        selectionMode && selectedEventIds.has(event.id)
                          ? 'ring-2 ring-red-500 ring-offset-2 rounded-lg'
                          : ''
                      }`}
                    >
                      <EventCard
                        event={event}
                        onClick={() => selectionMode ? toggleEventSelection(event.id) : setSelectedEvent(event)}
                      />
                    </div>
                  </div>
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
