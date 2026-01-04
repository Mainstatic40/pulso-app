import { PrismaClient, Prisma, EquipmentStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/app-error';
import type {
  ListEquipmentQuery,
  AvailableEquipmentQuery,
  CreateEquipmentInput,
  UpdateEquipmentInput,
  UpdateEquipmentStatusInput,
} from '../schemas/equipment.schema';
import type { PaginatedResult } from './user.service';

const prisma = new PrismaClient();

/**
 * Sincroniza los estados de todos los equipos basándose en sus asignaciones activas.
 * - Si tiene un turno activo AHORA → in_use
 * - Si no tiene turnos activos AHORA y estado es in_use → available
 * Solo afecta equipos con status 'available' o 'in_use' (no maintenance/retired)
 */
async function syncEquipmentStatuses(): Promise<void> {
  const now = new Date();

  // Obtener equipos que podrían necesitar actualización (available o in_use)
  const equipmentsToCheck = await prisma.equipment.findMany({
    where: {
      isActive: true,
      status: { in: [EquipmentStatus.available, EquipmentStatus.in_use] },
    },
    include: {
      assignments: {
        where: {
          startTime: { lte: now },
          OR: [{ endTime: null }, { endTime: { gt: now } }],
        },
        take: 1,
      },
    },
  });

  const toMarkInUse: string[] = [];
  const toMarkAvailable: string[] = [];

  for (const equipment of equipmentsToCheck) {
    const hasActiveAssignment = equipment.assignments.length > 0;

    if (hasActiveAssignment && equipment.status !== EquipmentStatus.in_use) {
      toMarkInUse.push(equipment.id);
    } else if (!hasActiveAssignment && equipment.status === EquipmentStatus.in_use) {
      toMarkAvailable.push(equipment.id);
    }
  }

  // Actualizar en lote
  if (toMarkInUse.length > 0) {
    await prisma.equipment.updateMany({
      where: { id: { in: toMarkInUse } },
      data: { status: EquipmentStatus.in_use },
    });
  }

  if (toMarkAvailable.length > 0) {
    await prisma.equipment.updateMany({
      where: { id: { in: toMarkAvailable } },
      data: { status: EquipmentStatus.available },
    });
  }
}

const equipmentSelect = {
  id: true,
  name: true,
  category: true,
  status: true,
  description: true,
  serialNumber: true,
  rfidTag: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const equipmentWithAssignmentsSelect = {
  ...equipmentSelect,
  assignments: {
    where: {
      endTime: null,
    },
    select: {
      id: true,
      startTime: true,
      notes: true,
      createdAt: true,
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
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { startTime: 'desc' as const },
    take: 1,
  },
} as const;

type EquipmentWithRelations = Prisma.EquipmentGetPayload<{ select: typeof equipmentSelect }>;

export const equipmentService = {
  async findAll(query: ListEquipmentQuery): Promise<PaginatedResult<EquipmentWithRelations>> {
    // Sincronizar estados antes de devolver la lista
    await syncEquipmentStatuses();

    const { page = 1, limit = 10, category, status, isActive, withoutRfid } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EquipmentWhereInput = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive;
    if (withoutRfid) where.rfidTag = null;

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        select: equipmentWithAssignmentsSelect,
        skip,
        take: limit,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      prisma.equipment.count({ where }),
    ]);

    return {
      data: equipment,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    // Sincronizar estados antes de devolver el equipo
    await syncEquipmentStatuses();

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      select: equipmentWithAssignmentsSelect,
    });

    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    return equipment;
  },

  async create(input: CreateEquipmentInput) {
    const equipment = await prisma.equipment.create({
      data: input,
      select: equipmentSelect,
    });

    return equipment;
  },

  async update(id: string, input: UpdateEquipmentInput) {
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      throw new NotFoundError('Equipment not found');
    }

    const equipment = await prisma.equipment.update({
      where: { id },
      data: input,
      select: equipmentSelect,
    });

    return equipment;
  },

  async updateStatus(id: string, input: UpdateEquipmentStatusInput) {
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { endTime: null },
          take: 1,
        },
      },
    });

    if (!existingEquipment) {
      throw new NotFoundError('Equipment not found');
    }

    const { status: newStatus } = input;

    // Validate status transitions
    if (newStatus === EquipmentStatus.available && existingEquipment.assignments.length > 0) {
      throw new ValidationError(
        'Cannot set status to available while equipment has active assignments'
      );
    }

    const equipment = await prisma.equipment.update({
      where: { id },
      data: { status: newStatus },
      select: equipmentSelect,
    });

    return equipment;
  },

  async delete(id: string) {
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignments: true,
      },
    });

    if (!existingEquipment) {
      throw new NotFoundError('Equipment not found');
    }

    // Check for active assignments (endTime = null)
    const activeAssignments = existingEquipment.assignments.filter(
      (assignment) => assignment.endTime === null
    );

    if (activeAssignments.length > 0) {
      throw new ValidationError(
        'No se puede eliminar el equipo porque tiene asignaciones activas. Primero debe devolver el equipo.'
      );
    }

    // Delete past assignments first, then delete the equipment
    await prisma.$transaction(async (tx) => {
      // Delete all past assignments for this equipment
      await tx.equipmentAssignment.deleteMany({
        where: { equipmentId: id },
      });

      // Permanently delete the equipment
      await tx.equipment.delete({
        where: { id },
      });
    });

    return { message: 'Equipment deleted successfully' };
  },

  async checkAvailability(id: string): Promise<boolean> {
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { endTime: null },
          take: 1,
        },
      },
    });

    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    return (
      equipment.isActive &&
      equipment.status === EquipmentStatus.available &&
      equipment.assignments.length === 0
    );
  },

  // Vincular RFID a equipo
  async linkRfidToEquipment(equipmentId: string, rfidTag: string) {
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!existingEquipment) {
      throw new NotFoundError('Equipo no encontrado');
    }

    // Verificar que el RFID no esté en uso por otro equipo
    const equipmentWithRfid = await prisma.equipment.findUnique({
      where: { rfidTag },
    });

    if (equipmentWithRfid && equipmentWithRfid.id !== equipmentId) {
      throw new ValidationError(`Este RFID ya está asignado al equipo: ${equipmentWithRfid.name}`);
    }

    // Verificar que el RFID no esté asignado a un usuario
    const userWithRfid = await prisma.user.findUnique({
      where: { rfidTag },
    });

    if (userWithRfid) {
      throw new ValidationError(`Este RFID ya está asignado al usuario: ${userWithRfid.name}`);
    }

    // Eliminar de pendientes si existe
    await prisma.pendingRfid.deleteMany({
      where: { rfidTag },
    });

    // Actualizar equipo
    const equipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: { rfidTag },
      select: equipmentSelect,
    });

    return equipment;
  },

  // Desvincular RFID de equipo
  async unlinkRfidFromEquipment(equipmentId: string) {
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!existingEquipment) {
      throw new NotFoundError('Equipo no encontrado');
    }

    const equipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: { rfidTag: null },
      select: equipmentSelect,
    });

    return equipment;
  },

  /**
   * Encuentra equipos disponibles para un rango de tiempo específico.
   * Un equipo está disponible si:
   * - Está activo (isActive = true)
   * - No está en mantenimiento (status != maintenance)
   * - No tiene asignaciones que se solapen con el rango dado
   *
   * @param excludeTasks - Si es true, solo considera asignaciones de eventos (ignora tareas)
   *                       Esto permite que eventos solo bloqueen otros eventos
   */
  async findAvailableForTimeRange(query: AvailableEquipmentQuery) {
    const { startTime, endTime, category, excludeTasks } = query;

    // Build where clause for equipment
    const whereEquipment: Prisma.EquipmentWhereInput = {
      isActive: true,
      status: { not: EquipmentStatus.maintenance },
    };

    if (category) {
      whereEquipment.category = category;
    }

    // Build where clause for assignments
    const assignmentWhereConditions: Prisma.EquipmentAssignmentWhereInput = {
      // Only get assignments that could potentially overlap with the requested range
      // An assignment could overlap if it ends after our start OR has no end time
      OR: [
        { endTime: null },
        { endTime: { gt: startTime } },
      ],
    };

    // When excludeTasks is true, only consider event assignments (those with eventId)
    // Task assignments have no eventId or have notes containing "Tarea:"
    if (excludeTasks) {
      assignmentWhereConditions.eventId = { not: null };
    }

    // Get all active equipment with their assignments that could potentially overlap
    const equipment = await prisma.equipment.findMany({
      where: whereEquipment,
      select: {
        ...equipmentSelect,
        assignments: {
          where: assignmentWhereConditions,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            eventId: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Filter out equipment with overlapping assignments
    const availableEquipment = equipment.filter((eq) => {
      // Check each assignment for overlap
      for (const assignment of eq.assignments) {
        const hasOverlap = isTimeOverlapping(
          assignment.startTime,
          assignment.endTime,
          startTime,
          endTime
        );
        if (hasOverlap) {
          return false; // Equipment has conflicting assignment
        }
      }
      return true; // No conflicts found
    });

    // Remove assignments from response (not needed by frontend)
    return availableEquipment.map(({ assignments, ...rest }) => rest);
  },
};

/**
 * Verifica si dos rangos de tiempo se solapan
 */
function isTimeOverlapping(
  start1: Date,
  end1: Date | null,
  start2: Date,
  end2: Date
): boolean {
  const effectiveEnd1 = end1 || new Date('9999-12-31T23:59:59');
  return start1 < end2 && start2 < effectiveEnd1;
}
