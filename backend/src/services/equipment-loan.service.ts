import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error';

const prisma = new PrismaClient();

// Sesión activa en memoria
interface ActiveSession {
  sessionId: string;
  userId: string;
  userName: string;
  equipmentIds: string[];
  equipmentNames: string[];
  startedAt: Date;
}

// Solo una sesión activa a la vez
let activeSession: ActiveSession | null = null;
const SESSION_TIMEOUT = 180000; // 3 minutos

export const equipmentLoanService = {
  // Procesar escaneo RFID
  async processRfidScan(rfidTag: string) {
    // Verificar timeout de sesión
    if (activeSession && (Date.now() - activeSession.startedAt.getTime() > SESSION_TIMEOUT)) {
      console.log('Sesión expirada por timeout');
      activeSession = null;
    }

    // 1. Verificar si es un usuario
    const user = await prisma.user.findUnique({
      where: { rfidTag },
      select: { id: true, name: true, isActive: true },
    });

    if (user) {
      if (!user.isActive) {
        throw new AppError('Usuario inactivo', 403);
      }
      return this.handleUserScan(user.id, user.name);
    }

    // 2. Verificar si es un equipo
    const equipment = await prisma.equipment.findUnique({
      where: { rfidTag },
      select: { id: true, name: true, category: true, isActive: true },
    });

    if (equipment) {
      if (!equipment.isActive) {
        throw new AppError('Equipo inactivo', 403);
      }
      return this.handleEquipmentScan(equipment.id, equipment.name, equipment.category);
    }

    // 3. RFID no reconocido - guardar como pendiente
    const existingPending = await prisma.pendingRfid.findUnique({
      where: { rfidTag },
    });

    if (!existingPending) {
      await prisma.pendingRfid.create({
        data: { rfidTag, note: 'Escaneado en lector de equipos' },
      });
    } else {
      await prisma.pendingRfid.update({
        where: { rfidTag },
        data: { scannedAt: new Date() },
      });
    }

    return {
      action: 'pending',
      message: 'RFID no registrado - Pendiente de asignar',
      rfidTag,
    };
  },

  // Manejar escaneo de usuario
  handleUserScan(userId: string, userName: string) {
    // Si hay sesión activa de OTRO usuario
    if (activeSession && activeSession.userId !== userId) {
      return {
        action: 'session_busy',
        message: `Sesión ocupada por ${activeSession.userName}`,
        currentUser: activeSession.userName,
      };
    }

    // Si este usuario ya tiene sesión abierta -> cerrar
    if (activeSession && activeSession.userId === userId) {
      return this.closeSession();
    }

    // Abrir nueva sesión
    activeSession = {
      sessionId: `session-${Date.now()}`,
      userId,
      userName,
      equipmentIds: [],
      equipmentNames: [],
      startedAt: new Date(),
    };

    return {
      action: 'session_opened',
      userName,
      message: `Sesión abierta para ${userName}`,
      equipmentCount: 0,
    };
  },

  // Manejar escaneo de equipo
  handleEquipmentScan(equipmentId: string, equipmentName: string, category: string) {
    if (!activeSession) {
      return {
        action: 'no_session',
        message: 'Primero escanea tu credencial',
        equipmentName,
      };
    }

    // Resetear timeout
    activeSession.startedAt = new Date();

    // Verificar si el equipo ya está en la lista
    const index = activeSession.equipmentIds.indexOf(equipmentId);

    if (index !== -1) {
      // Quitar de la lista
      activeSession.equipmentIds.splice(index, 1);
      activeSession.equipmentNames.splice(index, 1);

      return {
        action: 'equipment_removed',
        equipmentName,
        category,
        message: `${equipmentName} removido de la lista`,
        equipmentCount: activeSession.equipmentIds.length,
        equipmentList: activeSession.equipmentNames,
      };
    }

    // Agregar a la lista
    activeSession.equipmentIds.push(equipmentId);
    activeSession.equipmentNames.push(equipmentName);

    return {
      action: 'equipment_added',
      equipmentName,
      category,
      message: `${equipmentName} agregado`,
      equipmentCount: activeSession.equipmentIds.length,
      equipmentList: activeSession.equipmentNames,
    };
  },

  // Cerrar sesión y guardar en historial
  async closeSession() {
    if (!activeSession) {
      return {
        action: 'no_session',
        message: 'No hay sesión activa',
      };
    }

    const { userId, userName, equipmentIds, equipmentNames } = activeSession;
    activeSession = null;

    if (equipmentIds.length === 0) {
      return {
        action: 'session_closed',
        userName,
        message: 'Sesión cerrada sin registrar equipos',
        equipmentCount: 0,
      };
    }

    // Guardar en historial
    const log = await prisma.equipmentUsageLog.create({
      data: {
        userId,
        items: {
          create: equipmentIds.map((equipmentId) => ({ equipmentId })),
        },
      },
      include: {
        items: {
          include: {
            equipment: { select: { name: true, category: true } },
          },
        },
      },
    });

    return {
      action: 'log_created',
      userName,
      message: `Registrado: ${equipmentIds.length} equipo(s)`,
      equipmentCount: equipmentIds.length,
      equipmentNames,
      logId: log.id,
    };
  },

  // Obtener historial
  async getHistory(params?: {
    userId?: string;
    equipmentId?: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.EquipmentUsageLogWhereInput = {};

    if (params?.userId) {
      where.userId = params.userId;
    }

    if (params?.equipmentId) {
      where.items = {
        some: { equipmentId: params.equipmentId },
      };
    }

    if (params?.startDate || params?.endDate) {
      where.loggedAt = {};
      if (params?.startDate) (where.loggedAt as Prisma.DateTimeFilter).gte = params.startDate;
      if (params?.endDate) (where.loggedAt as Prisma.DateTimeFilter).lte = params.endDate;
    }

    return prisma.equipmentUsageLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
        items: {
          include: {
            equipment: { select: { id: true, name: true, category: true } },
          },
        },
      },
      orderBy: { loggedAt: 'desc' },
      take: params?.limit || 50,
    });
  },

  // Obtener historial de un equipo específico
  async getEquipmentHistory(equipmentId: string, limit: number = 20) {
    const items = await prisma.equipmentUsageLogItem.findMany({
      where: { equipmentId },
      include: {
        log: {
          include: {
            user: { select: { id: true, name: true, profileImage: true } },
          },
        },
      },
      orderBy: { log: { loggedAt: 'desc' } },
      take: limit,
    });

    return items.map((item) => ({
      id: item.id,
      loggedAt: item.log.loggedAt,
      user: item.log.user,
    }));
  },

  // Ver sesión activa (para debug)
  getActiveSession() {
    return activeSession;
  },
};
