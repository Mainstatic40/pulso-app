import { PrismaClient } from '@prisma/client';
import { monthlyHoursConfigService } from './monthly-hours-config.service';

const prisma = new PrismaClient();

/**
 * Calcula las horas trabajadas por un usuario en un mes específico.
 * Incluye tanto horas L-V como S-D.
 */
async function getWorkedHoursForMonth(
  userId: string,
  year: number,
  month: number, // 1-12
  startDate?: string | null
): Promise<number> {
  // Build date range for the month
  const monthStart = startDate
    ? new Date(startDate + 'T00:00:00')
    : new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      clockOut: { not: null },
      clockIn: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    select: { totalHours: true },
  });

  return entries.reduce((sum, e) => sum + Number(e.totalHours || 0), 0);
}

/**
 * Obtiene el mes anterior dado un mes y año.
 */
function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

export const hoursCarryOverService = {
  /**
   * Calcula el arrastre de horas del mes anterior para un usuario.
   * Arrastre = max(0, horasTrabajadasMesAnterior - metaMesAnterior)
   * Solo las horas realmente trabajadas generan arrastre (no el arrastre previo).
   */
  async calculateCarryOver(
    userId: string,
    month: number, // 1-12, mes que RECIBE el arrastre
    year: number
  ): Promise<number> {
    const prev = getPreviousMonth(year, month);

    // Get previous month's config (target hours and optional start date)
    const prevConfig = await monthlyHoursConfigService.getMonthConfig(prev.year, prev.month);
    const prevTarget = prevConfig.targetHours;
    const prevStartDate = prevConfig.startDate || null;

    // Get hours actually worked in the previous month
    const workedHours = await getWorkedHoursForMonth(userId, prev.year, prev.month, prevStartDate);

    // Carry over = excess hours (never negative)
    const carryOver = Math.max(0, workedHours - prevTarget);

    return Math.round(carryOver * 100) / 100;
  },

  /**
   * Calcula y almacena el arrastre para un usuario y mes específico.
   */
  async calculateAndStore(
    userId: string,
    month: number, // 1-12
    year: number
  ): Promise<number> {
    const hours = await this.calculateCarryOver(userId, month, year);

    if (hours > 0) {
      await prisma.hoursCarryOver.upsert({
        where: {
          userId_month_year: { userId, month, year },
        },
        create: { userId, month, year, hours },
        update: { hours },
      });
    } else {
      // If no carry-over, delete any existing record
      await prisma.hoursCarryOver.deleteMany({
        where: { userId, month, year },
      });
    }

    return hours;
  },

  /**
   * Obtiene el arrastre almacenado para un usuario y mes.
   * Si no existe, lo calcula y almacena.
   */
  async getCarryOver(
    userId: string,
    month: number, // 1-12
    year: number
  ): Promise<number> {
    // Always recalculate to ensure accuracy
    return this.calculateAndStore(userId, month, year);
  },

  /**
   * Calcula y almacena arrastre para TODOS los usuarios que trackean horas.
   * Útil para ejecución mensual o bajo demanda.
   */
  async calculateAllCarryOvers(
    month: number, // 1-12
    year: number
  ): Promise<Array<{ userId: string; userName: string; hours: number }>> {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { tracksHours: true },
          { role: 'supervisor' },
        ],
      },
      select: { id: true, name: true },
    });

    const results = await Promise.all(
      users.map(async (user) => {
        const hours = await this.calculateAndStore(user.id, month, year);
        return { userId: user.id, userName: user.name, hours };
      })
    );

    return results;
  },

  /**
   * Obtiene los arrastres almacenados para un mes/año.
   */
  async getCarryOversForMonth(
    month: number,
    year: number
  ): Promise<Array<{ userId: string; hours: number }>> {
    const records = await prisma.hoursCarryOver.findMany({
      where: { month, year },
      select: { userId: true, hours: true },
    });

    return records.map((r) => ({
      userId: r.userId,
      hours: Number(r.hours),
    }));
  },
};
