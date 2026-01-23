import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { timeEntryService } from './time-entry.service';
import { ValidationError } from '../utils/app-error';

const prisma = new PrismaClient();

// Store last action timestamp per user to prevent rapid requests
const lastActionMap = new Map<string, number>();
const RATE_LIMIT_MS = 60000; // 60 seconds

export const kioskService = {
  validatePin(pin: string): boolean {
    return pin === config.kiosk.pin;
  },

  async getUsersWithStatus() {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { tracksHours: true },
          { role: 'supervisor' }
        ]
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get active sessions for all users in one query
    const activeSessions = await prisma.timeEntry.findMany({
      where: {
        userId: { in: users.map((u) => u.id) },
        clockOut: null,
      },
      select: {
        id: true,
        userId: true,
        clockIn: true,
      },
    });

    // Create a map of userId -> activeSession
    const sessionMap = new Map<string, { id: string; clockIn: Date }>();
    for (const session of activeSessions) {
      sessionMap.set(session.userId, {
        id: session.id,
        clockIn: session.clockIn,
      });
    }

    // Combine users with their session status
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      profileImage: user.profileImage,
      activeSession: sessionMap.get(user.id) || null,
    }));
  },

  async clockIn(userId: string) {
    // Rate limiting check
    const lastAction = lastActionMap.get(userId);
    const now = Date.now();
    if (lastAction && now - lastAction < RATE_LIMIT_MS) {
      const secondsRemaining = Math.ceil((RATE_LIMIT_MS - (now - lastAction)) / 1000);
      throw new ValidationError(`Debes esperar ${secondsRemaining} segundos antes de registrar otra accion`);
    }

    // Use timeEntryService.clockIn
    const entry = await timeEntryService.clockIn(userId, {});

    // Update last action timestamp
    lastActionMap.set(userId, Date.now());

    return entry;
  },

  async clockOut(userId: string) {
    // Rate limiting check
    const lastAction = lastActionMap.get(userId);
    const now = Date.now();
    if (lastAction && now - lastAction < RATE_LIMIT_MS) {
      const secondsRemaining = Math.ceil((RATE_LIMIT_MS - (now - lastAction)) / 1000);
      throw new ValidationError(`Debes esperar ${secondsRemaining} segundos antes de registrar otra accion`);
    }

    // Use timeEntryService.clockOut
    const entry = await timeEntryService.clockOut(userId);

    // Update last action timestamp
    lastActionMap.set(userId, Date.now());

    return entry;
  },
};
