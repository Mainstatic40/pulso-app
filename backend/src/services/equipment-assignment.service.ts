import { PrismaClient, Prisma, EquipmentStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/app-error';
import type {
  ListAssignmentsQuery,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  ReturnEquipmentInput,
} from '../schemas/equipment-assignment.schema';
import type { PaginatedResult } from './user.service';

const prisma = new PrismaClient();

/**
 * Verifica si dos rangos de tiempo se solapan
 * Solapamiento: start1 < end2 AND start2 < end1
 * @param start1 Inicio del primer rango
 * @param end1 Fin del primer rango (null = indefinido/infinito)
 * @param start2 Inicio del segundo rango
 * @param end2 Fin del segundo rango (null = indefinido/infinito)
 * @returns true si hay solapamiento
 */
function isTimeOverlapping(
  start1: Date,
  end1: Date | null,
  start2: Date,
  end2: Date | null
): boolean {
  // Si end es null, asumir que sigue activo (usar fecha muy futura)
  const effectiveEnd1 = end1 || new Date('9999-12-31T23:59:59');
  const effectiveEnd2 = end2 || new Date('9999-12-31T23:59:59');

  // Solapamiento: start1 < end2 AND start2 < end1
  return start1 < effectiveEnd2 && start2 < effectiveEnd1;
}

/**
 * Formatea una fecha a formato legible HH:MM del día DD/MM
 */
function formatTimeRange(start: Date, end: Date | null): string {
  const formatTime = (d: Date) => d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: Date) => d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });

  if (end) {
    // Si es el mismo día
    if (start.toDateString() === end.toDateString()) {
      return `${formatDate(start)} de ${formatTime(start)} a ${formatTime(end)}`;
    }
    return `${formatDate(start)} ${formatTime(start)} a ${formatDate(end)} ${formatTime(end)}`;
  }
  return `desde ${formatDate(start)} ${formatTime(start)} (sin hora fin)`;
}

/**
 * Verifica si un turno está activo en el momento actual
 */
function isShiftActiveNow(startTime: Date, endTime: Date | null): boolean {
  const now = new Date();
  return startTime <= now && (endTime === null || endTime > now);
}

/**
 * Verifica si un equipo tiene alguna asignación activa en este momento
 */
async function hasActiveAssignmentNow(
  tx: Prisma.TransactionClient,
  equipmentId: string
): Promise<boolean> {
  const now = new Date();
  const activeAssignment = await tx.equipmentAssignment.findFirst({
    where: {
      equipmentId,
      startTime: { lte: now },
      OR: [{ endTime: null }, { endTime: { gt: now } }],
    },
  });
  return activeAssignment !== null;
}

const assignmentSelect = {
  id: true,
  equipmentId: true,
  userId: true,
  eventId: true,
  startTime: true,
  endTime: true,
  notes: true,
  createdBy: true,
  createdAt: true,
  equipment: {
    select: {
      id: true,
      name: true,
      category: true,
      status: true,
      serialNumber: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  event: {
    select: {
      id: true,
      name: true,
      startDatetime: true,
      endDatetime: true,
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

type AssignmentWithRelations = Prisma.EquipmentAssignmentGetPayload<{
  select: typeof assignmentSelect;
}>;

export const equipmentAssignmentService = {
  async findAll(
    query: ListAssignmentsQuery
  ): Promise<PaginatedResult<AssignmentWithRelations>> {
    const { page = 1, limit = 10, equipmentId, userId, eventId, active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EquipmentAssignmentWhereInput = {};

    if (equipmentId) where.equipmentId = equipmentId;
    if (userId) where.userId = userId;
    if (eventId) where.eventId = eventId;
    if (active === true) where.endTime = null;
    if (active === false) where.endTime = { not: null };

    const [assignments, total] = await Promise.all([
      prisma.equipmentAssignment.findMany({
        where,
        select: assignmentSelect,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
      }),
      prisma.equipmentAssignment.count({ where }),
    ]);

    return {
      data: assignments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    const assignment = await prisma.equipmentAssignment.findUnique({
      where: { id },
      select: assignmentSelect,
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    return assignment;
  },

  async create(input: CreateAssignmentInput, creatorId: string) {
    const { equipmentIds, userId, eventId, startTime, endTime, notes } = input;

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new ValidationError('User not found or inactive');
    }

    // Validate event exists if provided
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });

      if (!event) {
        throw new ValidationError('Event not found');
      }
    }

    // Get all equipment with ALL their assignments (to check for overlaps)
    // We need to check against any assignment that could potentially overlap
    const equipmentList = await prisma.equipment.findMany({
      where: { id: { in: equipmentIds } },
      include: {
        assignments: {
          // Get assignments that could overlap with the new time range
          // An assignment overlaps if: existing.start < new.end AND existing.end > new.start
          where: {
            OR: [
              { endTime: null }, // Open-ended assignments
              { endTime: { gt: startTime } }, // Assignments ending after new start
            ],
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    if (equipmentList.length !== equipmentIds.length) {
      throw new ValidationError('One or more equipment items not found');
    }

    // Validate each equipment - check for overlaps using assignments directly (not status)
    const conflicts: string[] = [];
    const inactiveEquipment: string[] = [];

    for (const equipment of equipmentList) {
      if (!equipment.isActive) {
        inactiveEquipment.push(equipment.name);
        continue;
      }

      // Check for time conflicts with existing assignments
      for (const assignment of equipment.assignments) {
        const hasOverlap = isTimeOverlapping(
          assignment.startTime,
          assignment.endTime,
          startTime,
          endTime || null
        );

        if (hasOverlap) {
          const timeRange = formatTimeRange(assignment.startTime, assignment.endTime);
          conflicts.push(
            `"${equipment.name}" está asignado a ${assignment.user.name} el ${timeRange}`
          );
          break; // Only report first conflict per equipment
        }
      }
    }

    if (inactiveEquipment.length > 0) {
      throw new ValidationError(
        `Los siguientes equipos están inactivos: ${inactiveEquipment.join(', ')}`
      );
    }

    if (conflicts.length > 0) {
      throw new ValidationError(
        `Conflicto de horarios:\n${conflicts.join('\n')}`
      );
    }

    // Create assignments and update equipment status in a transaction
    const assignments = await prisma.$transaction(async (tx) => {
      // Create all assignments
      const createdAssignments = await Promise.all(
        equipmentIds.map((equipmentId) =>
          tx.equipmentAssignment.create({
            data: {
              equipmentId,
              userId,
              eventId: eventId || null,
              startTime,
              endTime: endTime || null,
              notes: notes || null,
              createdBy: creatorId,
            },
            select: assignmentSelect,
          })
        )
      );

      // Only update to in_use if the shift is active NOW
      if (isShiftActiveNow(startTime, endTime || null)) {
        await tx.equipment.updateMany({
          where: { id: { in: equipmentIds } },
          data: { status: EquipmentStatus.in_use },
        });
      }

      return createdAssignments;
    });

    return assignments;
  },

  async update(id: string, input: UpdateAssignmentInput) {
    const existingAssignment = await prisma.equipmentAssignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Validate user if changing
    if (input.userId) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new ValidationError('User not found or inactive');
      }
    }

    // Validate event if changing
    if (input.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: input.eventId },
        select: { id: true },
      });

      if (!event) {
        throw new ValidationError('Event not found');
      }
    }

    const assignment = await prisma.equipmentAssignment.update({
      where: { id },
      data: input,
      select: assignmentSelect,
    });

    return assignment;
  },

  async returnEquipment(id: string, input?: ReturnEquipmentInput) {
    const existingAssignment = await prisma.equipmentAssignment.findUnique({
      where: { id },
      include: { equipment: true },
    });

    if (!existingAssignment) {
      throw new NotFoundError('Assignment not found');
    }

    if (existingAssignment.endTime) {
      throw new ValidationError('Equipment has already been returned');
    }

    // Update assignment and equipment in a transaction
    const assignment = await prisma.$transaction(async (tx) => {
      // Mark assignment as returned
      const updatedAssignment = await tx.equipmentAssignment.update({
        where: { id },
        data: {
          endTime: new Date(),
          notes: input?.notes ?? existingAssignment.notes,
        },
        select: assignmentSelect,
      });

      // Check if equipment has other active assignments NOW
      const hasOtherActive = await hasActiveAssignmentNow(
        tx,
        existingAssignment.equipmentId
      );

      // Only set to available if no other active assignments
      if (!hasOtherActive) {
        await tx.equipment.update({
          where: { id: existingAssignment.equipmentId },
          data: { status: EquipmentStatus.available },
        });
      }

      return updatedAssignment;
    });

    return assignment;
  },

  async delete(id: string) {
    const existingAssignment = await prisma.equipmentAssignment.findUnique({
      where: { id },
      include: { equipment: true },
    });

    if (!existingAssignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Check if this assignment is currently active
    const wasActive = isShiftActiveNow(
      existingAssignment.startTime,
      existingAssignment.endTime
    );

    await prisma.$transaction(async (tx) => {
      // Delete the assignment first
      await tx.equipmentAssignment.delete({
        where: { id },
      });

      // If the deleted assignment was active, check if there are other active ones
      if (wasActive) {
        const hasOtherActive = await hasActiveAssignmentNow(
          tx,
          existingAssignment.equipmentId
        );

        // Only set to available if no other active assignments
        if (!hasOtherActive) {
          await tx.equipment.update({
            where: { id: existingAssignment.equipmentId },
            data: { status: EquipmentStatus.available },
          });
        }
      }
    });

    return { message: 'Assignment deleted successfully' };
  },
};
