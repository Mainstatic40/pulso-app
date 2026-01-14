import { PrismaClient, Prisma } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/app-error';
import type { ListEventsQuery, CreateEventInput, UpdateEventInput } from '../schemas/event.schema';
import type { PaginatedResult } from './user.service';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

// Basic event select for lists
const eventListSelect = {
  id: true,
  name: true,
  description: true,
  clientRequirements: true,
  eventType: true,
  startDatetime: true,
  endDatetime: true,
  morningStartTime: true,
  morningEndTime: true,
  afternoonStartTime: true,
  afternoonEndTime: true,
  usePresetEquipment: true,
  createdBy: true,
  createdAt: true,
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
    },
  },
  assignees: {
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
    },
  },
  // Include days with shifts for time display in Kanban view
  days: {
    select: {
      id: true,
      date: true,
      shifts: {
        select: {
          id: true,
          userId: true,
          startTime: true,
          endTime: true,
          shiftType: true,
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc' as const,
        },
      },
    },
    orderBy: {
      date: 'asc' as const,
    },
  },
  _count: {
    select: {
      days: true,
    },
  },
} as const;

// Full event select with days and shifts
const eventDetailSelect = {
  id: true,
  name: true,
  description: true,
  clientRequirements: true,
  eventType: true,
  startDatetime: true,
  endDatetime: true,
  morningStartTime: true,
  morningEndTime: true,
  afternoonStartTime: true,
  afternoonEndTime: true,
  usePresetEquipment: true,
  createdBy: true,
  createdAt: true,
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
    },
  },
  assignees: {
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
    },
  },
  days: {
    select: {
      id: true,
      date: true,
      note: true,
      createdAt: true,
      shifts: {
        select: {
          id: true,
          userId: true,
          startTime: true,
          endTime: true,
          shiftType: true,
          note: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
          equipmentAssignments: {
            select: {
              id: true,
              equipmentId: true,
              startTime: true,
              endTime: true,
              notes: true,
              equipment: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  serialNumber: true,
                },
              },
            },
          },
        },
        orderBy: {
          startTime: 'asc' as const,
        },
      },
    },
    orderBy: {
      date: 'asc' as const,
    },
  },
  attachments: {
    select: {
      id: true,
      filename: true,
      storedName: true,
      mimeType: true,
      size: true,
      uploadedBy: true,
      createdAt: true,
      uploader: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

type EventListItem = Prisma.EventGetPayload<{ select: typeof eventListSelect }>;
type EventWithDetails = Prisma.EventGetPayload<{ select: typeof eventDetailSelect }>;

export type { EventListItem, EventWithDetails };

export const eventService = {
  async findAll(query: ListEventsQuery): Promise<PaginatedResult<EventListItem>> {
    const { page = 1, limit = 10, dateFrom, dateTo, assigneeId, eventType } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {};

    if (dateFrom || dateTo) {
      where.startDatetime = {};
      if (dateFrom) where.startDatetime.gte = dateFrom;
      if (dateTo) where.startDatetime.lte = dateTo;
    }

    if (assigneeId) {
      where.assignees = {
        some: {
          userId: assigneeId,
        },
      };
    }

    if (eventType) {
      where.eventType = eventType;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        select: eventListSelect,
        orderBy: { startDatetime: 'asc' },
      }),
      prisma.event.count({ where }),
    ]);

    // Separar en proximos y pasados
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = events.filter(e => new Date(e.startDatetime) >= today);
    const past = events.filter(e => new Date(e.startDatetime) < today);

    // Proximos ordenados ascendente (el mas cercano primero)
    // Pasados ordenados descendente (el mas reciente primero)
    const sortedEvents = [
      ...upcoming.sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()),
      ...past.sort((a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime())
    ];

    // Aplicar paginacion despues del ordenamiento
    const paginatedEvents = sortedEvents.slice(skip, skip + limit);

    return {
      data: paginatedEvents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string): Promise<EventWithDetails> {
    const event = await prisma.event.findUnique({
      where: { id },
      select: eventDetailSelect,
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  },

  async findUpcoming() {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const events = await prisma.event.findMany({
      where: {
        startDatetime: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      select: eventListSelect,
      orderBy: { startDatetime: 'asc' },
    });

    return events;
  },

  async create(input: CreateEventInput, creatorId: string): Promise<EventWithDetails> {
    const { assigneeIds, days, additionalEquipmentIds, ...eventData } = input;

    // Validate assignees exist
    if (assigneeIds && assigneeIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true },
      });

      if (users.length !== assigneeIds.length) {
        throw new ValidationError('One or more assignees not found');
      }
    }

    // Validate users in shifts exist
    if (days && days.length > 0) {
      const shiftUserIds = new Set<string>();
      days.forEach((day) => {
        day.shifts.forEach((shift) => {
          shiftUserIds.add(shift.userId);
        });
      });

      if (shiftUserIds.size > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: Array.from(shiftUserIds) } },
          select: { id: true },
        });

        if (users.length !== shiftUserIds.size) {
          throw new ValidationError('One or more shift users not found');
        }
      }
    }

    // Validate additional equipment (only for yearbook events)
    if (additionalEquipmentIds && additionalEquipmentIds.length > 0) {
      if (eventData.eventType !== 'yearbook') {
        throw new ValidationError('Additional equipment is only available for yearbook events');
      }

      const equipment = await prisma.equipment.findMany({
        where: { id: { in: additionalEquipmentIds }, isActive: true },
        select: { id: true },
      });

      if (equipment.length !== additionalEquipmentIds.length) {
        throw new ValidationError('One or more equipment items not found or inactive');
      }
    }

    // Use transaction to create event with all related data
    const event = await prisma.$transaction(async (tx) => {
      // Create the main event
      const createdEvent = await tx.event.create({
        data: {
          name: eventData.name,
          description: eventData.description,
          clientRequirements: eventData.clientRequirements,
          eventType: eventData.eventType,
          startDatetime: eventData.startDatetime,
          endDatetime: eventData.endDatetime,
          morningStartTime: eventData.morningStartTime,
          morningEndTime: eventData.morningEndTime,
          afternoonStartTime: eventData.afternoonStartTime,
          afternoonEndTime: eventData.afternoonEndTime,
          usePresetEquipment: eventData.usePresetEquipment,
          createdBy: creatorId,
          // Create legacy assignees if provided
          assignees: assigneeIds && assigneeIds.length > 0
            ? { create: assigneeIds.map((userId) => ({ userId })) }
            : undefined,
        },
      });

      // Create days and shifts if provided
      if (days && days.length > 0) {
        for (const day of days) {
          const createdDay = await tx.eventDay.create({
            data: {
              eventId: createdEvent.id,
              date: day.date,
              note: day.note,
            },
          });

          // Create shifts for this day
          for (const shift of day.shifts) {
            const createdShift = await tx.eventShift.create({
              data: {
                eventDayId: createdDay.id,
                userId: shift.userId,
                startTime: shift.startTime,
                endTime: shift.endTime,
                shiftType: shift.shiftType,
                note: shift.note,
              },
            });

            // Create equipment assignments if provided
            if (shift.equipment) {
              const equipmentIds = [
                shift.equipment.cameraId,
                shift.equipment.lensId,
                shift.equipment.adapterId,
                shift.equipment.sdCardId,
              ].filter((id): id is string => !!id);

              if (equipmentIds.length > 0) {
                // Calculate datetime from day date and shift times
                const dayDateStr = day.date.toISOString().split('T')[0];
                const startDateTime = new Date(`${dayDateStr}T${shift.startTime}:00`);
                const endDateTime = new Date(`${dayDateStr}T${shift.endTime}:00`);

                await tx.equipmentAssignment.createMany({
                  data: equipmentIds.map((equipmentId) => ({
                    equipmentId,
                    userId: shift.userId,
                    eventId: createdEvent.id,
                    eventShiftId: createdShift.id,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    notes: `Evento: ${eventData.name} (${shift.shiftType || 'Turno'})`,
                    createdBy: creatorId,
                  })),
                });
              }
            }
          }
        }
      }

      // Create additional equipment assignments (yearbook only, no specific shift)
      if (additionalEquipmentIds && additionalEquipmentIds.length > 0 && eventData.eventType === 'yearbook') {
        await tx.equipmentAssignment.createMany({
          data: additionalEquipmentIds.map((equipmentId) => ({
            equipmentId,
            userId: creatorId,
            eventId: createdEvent.id,
            eventShiftId: null, // No specific shift
            startTime: eventData.startDatetime,
            endTime: eventData.endDatetime,
            notes: `Evento: ${eventData.name} (Equipo adicional)`,
            createdBy: creatorId,
          })),
        });
      }

      // Fetch and return the complete event
      return tx.event.findUnique({
        where: { id: createdEvent.id },
        select: eventDetailSelect,
      });
    });

    if (!event) {
      throw new Error('Failed to create event');
    }

    // Collect all users to notify (from shifts)
    const usersToNotify = new Set<string>();
    if (days && days.length > 0) {
      days.forEach((day) => {
        day.shifts.forEach((shift) => {
          if (shift.userId !== creatorId) {
            usersToNotify.add(shift.userId);
          }
        });
      });
    }

    // Also add legacy assignees
    if (assigneeIds && assigneeIds.length > 0) {
      assigneeIds.forEach((id) => {
        if (id !== creatorId) {
          usersToNotify.add(id);
        }
      });
    }

    // Send notifications
    if (usersToNotify.size > 0) {
      await notificationService.createForMany(Array.from(usersToNotify), {
        type: 'event_assigned',
        title: 'Asignado a evento',
        message: `Fuiste asignado al evento "${event.name}"`,
        link: `/events?open=${event.id}`,
        metadata: { eventId: event.id },
      });
    }

    return event;
  },

  async update(id: string, input: UpdateEventInput): Promise<EventWithDetails> {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new NotFoundError('Event not found');
    }

    const { assigneeIds, days, additionalEquipmentIds, ...eventData } = input;

    // Validate date range if both dates provided or one is being updated
    if (eventData.startDatetime || eventData.endDatetime) {
      const startDatetime = eventData.startDatetime || existingEvent.startDatetime;
      const endDatetime = eventData.endDatetime || existingEvent.endDatetime;

      if (endDatetime < startDatetime) {
        throw new ValidationError('End datetime must be after or equal to start datetime');
      }
    }

    // Validate assignees if provided
    if (assigneeIds && assigneeIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true },
      });

      if (users.length !== assigneeIds.length) {
        throw new ValidationError('One or more assignees not found');
      }
    }

    // Validate users in shifts exist
    if (days && days.length > 0) {
      const shiftUserIds = new Set<string>();
      days.forEach((day) => {
        day.shifts.forEach((shift) => {
          shiftUserIds.add(shift.userId);
        });
      });

      if (shiftUserIds.size > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: Array.from(shiftUserIds) } },
          select: { id: true },
        });

        if (users.length !== shiftUserIds.size) {
          throw new ValidationError('One or more shift users not found');
        }
      }
    }

    // Validate additional equipment (only for yearbook events)
    const effectiveEventType = eventData.eventType || existingEvent.eventType;
    if (additionalEquipmentIds && additionalEquipmentIds.length > 0) {
      if (effectiveEventType !== 'yearbook') {
        throw new ValidationError('Additional equipment is only available for yearbook events');
      }

      const equipment = await prisma.equipment.findMany({
        where: { id: { in: additionalEquipmentIds }, isActive: true },
        select: { id: true },
      });

      if (equipment.length !== additionalEquipmentIds.length) {
        throw new ValidationError('One or more equipment items not found or inactive');
      }
    }

    // Use transaction to update all data
    const event = await prisma.$transaction(async (tx) => {
      // Handle assignees update
      if (assigneeIds !== undefined) {
        await tx.eventAssignee.deleteMany({
          where: { eventId: id },
        });

        if (assigneeIds.length > 0) {
          await tx.eventAssignee.createMany({
            data: assigneeIds.map((userId) => ({ eventId: id, userId })),
          });
        }
      }

      // Handle days update - delete existing and recreate
      if (days !== undefined) {
        // Get all shift IDs for this event to delete their equipment assignments
        const existingDays = await tx.eventDay.findMany({
          where: { eventId: id },
          select: {
            id: true,
            shifts: {
              select: { id: true },
            },
          },
        });

        const shiftIds = existingDays.flatMap((d) => d.shifts.map((s) => s.id));

        // Delete equipment assignments linked to these shifts
        if (shiftIds.length > 0) {
          await tx.equipmentAssignment.deleteMany({
            where: { eventShiftId: { in: shiftIds } },
          });
        }

        // Delete all shifts (cascade from days won't work here, delete explicitly)
        await tx.eventShift.deleteMany({
          where: { eventDayId: { in: existingDays.map((d) => d.id) } },
        });

        // Delete all days
        await tx.eventDay.deleteMany({
          where: { eventId: id },
        });

        // Create new days and shifts
        for (const day of days) {
          const createdDay = await tx.eventDay.create({
            data: {
              eventId: id,
              date: day.date,
              note: day.note,
            },
          });

          for (const shift of day.shifts) {
            const createdShift = await tx.eventShift.create({
              data: {
                eventDayId: createdDay.id,
                userId: shift.userId,
                startTime: shift.startTime,
                endTime: shift.endTime,
                shiftType: shift.shiftType,
                note: shift.note,
              },
            });

            // Create equipment assignments if provided
            if (shift.equipment) {
              const equipmentIds = [
                shift.equipment.cameraId,
                shift.equipment.lensId,
                shift.equipment.adapterId,
                shift.equipment.sdCardId,
              ].filter((eqId): eqId is string => !!eqId);

              if (equipmentIds.length > 0) {
                const dayDateStr = day.date.toISOString().split('T')[0];
                const startDateTime = new Date(`${dayDateStr}T${shift.startTime}:00`);
                const endDateTime = new Date(`${dayDateStr}T${shift.endTime}:00`);

                // Get creator from existing event
                await tx.equipmentAssignment.createMany({
                  data: equipmentIds.map((equipmentId) => ({
                    equipmentId,
                    userId: shift.userId,
                    eventId: id,
                    eventShiftId: createdShift.id,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    notes: `Evento: ${eventData.name || existingEvent.name} (${shift.shiftType || 'Turno'})`,
                    createdBy: existingEvent.createdBy,
                  })),
                });
              }
            }
          }
        }
      }

      // Update the main event data
      await tx.event.update({
        where: { id },
        data: {
          ...(eventData.name !== undefined && { name: eventData.name }),
          ...(eventData.description !== undefined && { description: eventData.description }),
          ...(eventData.clientRequirements !== undefined && { clientRequirements: eventData.clientRequirements }),
          ...(eventData.eventType !== undefined && { eventType: eventData.eventType }),
          ...(eventData.startDatetime !== undefined && { startDatetime: eventData.startDatetime }),
          ...(eventData.endDatetime !== undefined && { endDatetime: eventData.endDatetime }),
          ...(eventData.morningStartTime !== undefined && { morningStartTime: eventData.morningStartTime }),
          ...(eventData.morningEndTime !== undefined && { morningEndTime: eventData.morningEndTime }),
          ...(eventData.afternoonStartTime !== undefined && { afternoonStartTime: eventData.afternoonStartTime }),
          ...(eventData.afternoonEndTime !== undefined && { afternoonEndTime: eventData.afternoonEndTime }),
          ...(eventData.usePresetEquipment !== undefined && { usePresetEquipment: eventData.usePresetEquipment }),
        },
      });

      // Handle additional equipment update (yearbook only)
      if (additionalEquipmentIds !== undefined) {
        // Delete existing additional equipment (those without eventShiftId)
        await tx.equipmentAssignment.deleteMany({
          where: {
            eventId: id,
            eventShiftId: null,
          },
        });

        // Create new additional equipment assignments
        if (additionalEquipmentIds.length > 0 && effectiveEventType === 'yearbook') {
          const effectiveStartDatetime = eventData.startDatetime || existingEvent.startDatetime;
          const effectiveEndDatetime = eventData.endDatetime || existingEvent.endDatetime;
          const effectiveName = eventData.name || existingEvent.name;

          await tx.equipmentAssignment.createMany({
            data: additionalEquipmentIds.map((equipmentId) => ({
              equipmentId,
              userId: existingEvent.createdBy,
              eventId: id,
              eventShiftId: null,
              startTime: effectiveStartDatetime,
              endTime: effectiveEndDatetime,
              notes: `Evento: ${effectiveName} (Equipo adicional)`,
              createdBy: existingEvent.createdBy,
            })),
          });
        }
      }

      // Fetch and return the complete event
      return tx.event.findUnique({
        where: { id },
        select: eventDetailSelect,
      });
    });

    if (!event) {
      throw new Error('Failed to update event');
    }

    return event;
  },

  async delete(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        days: {
          select: {
            id: true,
            shifts: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Use transaction to delete in correct order
    await prisma.$transaction(async (tx) => {
      // Get all shift IDs
      const shiftIds = event.days.flatMap((d) => d.shifts.map((s) => s.id));
      const dayIds = event.days.map((d) => d.id);

      // 1. Delete equipment assignments linked to shifts
      if (shiftIds.length > 0) {
        await tx.equipmentAssignment.deleteMany({
          where: { eventShiftId: { in: shiftIds } },
        });
      }

      // 2. Delete equipment assignments linked directly to event (legacy)
      await tx.equipmentAssignment.deleteMany({
        where: { eventId: id, eventShiftId: null },
      });

      // 3. Delete shifts
      if (shiftIds.length > 0) {
        await tx.eventShift.deleteMany({
          where: { id: { in: shiftIds } },
        });
      }

      // 4. Delete days
      if (dayIds.length > 0) {
        await tx.eventDay.deleteMany({
          where: { id: { in: dayIds } },
        });
      }

      // 5. Delete event assignees (handled by cascade, but explicit for clarity)
      await tx.eventAssignee.deleteMany({
        where: { eventId: id },
      });

      // 6. Delete the event
      await tx.event.delete({
        where: { id },
      });
    });

    return { message: 'Event deleted successfully' };
  },

  async releaseEquipment(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const eventNotePrefix = `Evento: ${event.name}`;
    const now = new Date();

    // Find all equipment assignments for this user and event that are not yet ended
    // This includes active assignments AND future assignments
    const assignments = await prisma.equipmentAssignment.findMany({
      where: {
        userId,
        notes: { startsWith: eventNotePrefix },
        OR: [
          { endTime: null },
          { endTime: { gt: now } },
        ],
      },
    });

    if (assignments.length === 0) {
      throw new ValidationError('El usuario no tiene equipo asignado para este evento');
    }

    // Release equipment - set endTime to 1 second ago to avoid overlap conflicts
    const releaseTime = new Date(now.getTime() - 1000);
    await prisma.$transaction(async (tx) => {
      await tx.equipmentAssignment.updateMany({
        where: { id: { in: assignments.map((a) => a.id) } },
        data: { endTime: releaseTime },
      });

      await tx.equipment.updateMany({
        where: { id: { in: assignments.map((a) => a.equipmentId) } },
        data: { status: 'available' },
      });
    });

    return prisma.event.findUnique({
      where: { id: eventId },
      select: eventDetailSelect,
    });
  },

  async transferEquipment(eventId: string, fromUserId: string, toUserId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify target user exists
    const toUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, name: true },
    });

    if (!toUser) {
      throw new NotFoundError('Target user not found');
    }

    const eventNotePrefix = `Evento: ${event.name}`;
    const now = new Date();

    // Find all equipment assignments for source user and event that are not yet ended
    // This includes active assignments AND future assignments
    const assignments = await prisma.equipmentAssignment.findMany({
      where: {
        userId: fromUserId,
        notes: { startsWith: eventNotePrefix },
        OR: [
          { endTime: null },
          { endTime: { gt: now } },
        ],
      },
    });

    if (assignments.length === 0) {
      throw new ValidationError('El usuario origen no tiene equipo asignado para este evento');
    }

    // Transfer equipment to new user
    await prisma.equipmentAssignment.updateMany({
      where: { id: { in: assignments.map((a) => a.id) } },
      data: { userId: toUserId },
    });

    // Notify new user
    await notificationService.create(toUserId, {
      type: 'event_assigned',
      title: 'Equipo transferido',
      message: `Se te transfirió equipo del evento "${event.name}"`,
      link: `/events?open=${event.id}`,
      metadata: { eventId: event.id },
    });

    return prisma.event.findUnique({
      where: { id: eventId },
      select: eventDetailSelect,
    });
  },
};
