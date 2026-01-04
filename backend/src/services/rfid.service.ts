import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/app-error';
import { timeEntryService } from './time-entry.service';

const prisma = new PrismaClient();

export const rfidService = {
  // Toggle clock in/out basado en RFID
  async toggleClock(rfidTag: string) {
    // Buscar usuario con este RFID
    const user = await prisma.user.findUnique({
      where: { rfidTag },
      select: { id: true, name: true, email: true, isActive: true },
    });

    if (!user) {
      // En lugar de error, registrar como pendiente
      const existingPending = await prisma.pendingRfid.findUnique({
        where: { rfidTag },
      });

      if (!existingPending) {
        // Crear nuevo pendiente
        await prisma.pendingRfid.create({
          data: { rfidTag },
        });
      } else {
        // Actualizar fecha de escaneo
        await prisma.pendingRfid.update({
          where: { rfidTag },
          data: { scannedAt: new Date() },
        });
      }

      return {
        action: 'pending' as const,
        user: null,
        timeEntry: null,
        message: 'Credencial registrada - Pendiente de asignar',
        rfidTag: rfidTag,
      };
    }

    if (!user.isActive) {
      throw new ValidationError('Usuario inactivo');
    }

    // Verificar si tiene sesión activa
    const activeSession = await prisma.timeEntry.findFirst({
      where: {
        userId: user.id,
        clockOut: null,
      },
    });

    if (activeSession) {
      // Clock out
      const entry = await timeEntryService.clockOut(user.id);
      return {
        action: 'clock_out' as const,
        user: { id: user.id, name: user.name, email: user.email },
        timeEntry: entry,
        message: `Salida registrada para ${user.name}`,
      };
    } else {
      // Clock in
      const entry = await timeEntryService.clockIn(user.id, {});
      return {
        action: 'clock_in' as const,
        user: { id: user.id, name: user.name, email: user.email },
        timeEntry: entry,
        message: `Entrada registrada para ${user.name}`,
      };
    }
  },

  // Obtener usuarios con estado de RFID
  async getUsersWithRfidStatus() {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        rfidTag: true,
        profileImage: true,
      },
      orderBy: { name: 'asc' },
    });

    return users.map((user) => ({
      ...user,
      hasRfid: !!user.rfidTag,
    }));
  },

  // Vincular RFID a usuario
  async linkRfidToUser(userId: string, rfidTag: string) {
    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Verificar que el RFID no esté en uso
    const userWithRfid = await prisma.user.findUnique({
      where: { rfidTag },
    });

    if (userWithRfid && userWithRfid.id !== userId) {
      throw new ValidationError(`Este RFID ya está asignado a ${userWithRfid.name}`);
    }

    // Eliminar de pendientes si existe
    await prisma.pendingRfid.deleteMany({
      where: { rfidTag },
    });

    // Actualizar usuario
    const user = await prisma.user.update({
      where: { id: userId },
      data: { rfidTag },
      select: {
        id: true,
        name: true,
        email: true,
        rfidTag: true,
      },
    });

    return user;
  },

  // Desvincular RFID de usuario
  async unlinkRfidFromUser(userId: string) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { rfidTag: null },
      select: {
        id: true,
        name: true,
        email: true,
        rfidTag: true,
      },
    });

    return user;
  },

  // Verificar si un RFID está asignado
  async checkRfidTag(rfidTag: string) {
    const user = await prisma.user.findUnique({
      where: { rfidTag },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return {
      isAssigned: !!user,
      user: user || null,
    };
  },

  // Obtener credenciales pendientes
  async getPendingRfids() {
    return prisma.pendingRfid.findMany({
      orderBy: { scannedAt: 'desc' },
    });
  },

  // Eliminar credencial pendiente (cuando se descarta)
  async deletePendingRfid(rfidTag: string) {
    const pending = await prisma.pendingRfid.findUnique({
      where: { rfidTag },
    });

    if (!pending) {
      throw new NotFoundError('Credencial pendiente no encontrada');
    }

    return prisma.pendingRfid.delete({
      where: { rfidTag },
    });
  },
};
