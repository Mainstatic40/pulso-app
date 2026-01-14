import { PrismaClient } from '@prisma/client';
import { getWorkdaysInMonth, getWorkdaysElapsed, formatDateToYMD, parseDateStringToUTC } from '../utils/workdays';

const prisma = new PrismaClient();

const DEFAULT_HOURS_PER_DAY = 4;

const configSelect = {
  id: true,
  year: true,
  month: true,
  targetHours: true,
  hoursPerDay: true,
  startDate: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export const monthlyHoursConfigService = {
  async findAll(year?: number) {
    const where = year ? { year } : {};

    const configs = await prisma.monthlyHoursConfig.findMany({
      where,
      select: configSelect,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return configs;
  },

  async findByMonth(year: number, month: number) {
    const config = await prisma.monthlyHoursConfig.findUnique({
      where: {
        year_month: { year, month },
      },
      select: configSelect,
    });

    return config;
  },

  async getTargetHours(year: number, month: number): Promise<number> {
    const config = await prisma.monthlyHoursConfig.findUnique({
      where: {
        year_month: { year, month },
      },
      select: { targetHours: true, hoursPerDay: true, startDate: true },
    });

    if (config) {
      return Number(config.targetHours);
    }

    // Calculate default: workdays * 4 hours
    const workdays = getWorkdaysInMonth(year, month);
    return workdays * DEFAULT_HOURS_PER_DAY;
  },

  /**
   * Get full configuration with workday stats
   */
  async getMonthConfig(year: number, month: number) {
    const config = await prisma.monthlyHoursConfig.findUnique({
      where: {
        year_month: { year, month },
      },
      select: configSelect,
    });

    // Get the start date from config (or null if not set)
    const startDate = config?.startDate || null;
    const startDateStr = startDate ? formatDateToYMD(startDate) : null;

    const totalWorkdays = getWorkdaysInMonth(year, month, startDate);
    const workdaysElapsed = getWorkdaysElapsed(year, month, startDate);
    const hoursPerDay = config ? Number(config.hoursPerDay) : DEFAULT_HOURS_PER_DAY;
    const calculatedTarget = totalWorkdays * hoursPerDay;
    const targetHours = config ? Number(config.targetHours) : calculatedTarget;

    return {
      id: config?.id || null,
      year,
      month,
      targetHours,
      hoursPerDay,
      startDate: startDateStr,
      totalWorkdays,
      workdaysElapsed,
      calculatedTarget,
      isCustomTarget: config ? Number(config.targetHours) !== calculatedTarget : false,
      creator: config?.creator || null,
      createdAt: config?.createdAt || null,
      updatedAt: config?.updatedAt || null,
    };
  },

  async upsert(
    year: number,
    month: number,
    targetHours: number,
    hoursPerDay: number,
    createdBy: string,
    startDate?: string | null
  ) {
    // Parse the start date if provided
    let parsedStartDate: Date | null = null;
    if (startDate) {
      // Parse as UTC noon to avoid timezone issues when storing in PostgreSQL
      parsedStartDate = parseDateStringToUTC(startDate);
    }

    const config = await prisma.monthlyHoursConfig.upsert({
      where: {
        year_month: { year, month },
      },
      create: {
        year,
        month,
        targetHours,
        hoursPerDay,
        startDate: parsedStartDate,
        createdBy,
      },
      update: {
        targetHours,
        hoursPerDay,
        startDate: parsedStartDate,
      },
      select: configSelect,
    });

    // Return with workday stats
    const startDateStr = config.startDate ? formatDateToYMD(config.startDate) : null;
    const totalWorkdays = getWorkdaysInMonth(year, month, config.startDate);
    const workdaysElapsed = getWorkdaysElapsed(year, month, config.startDate);
    const calculatedTarget = totalWorkdays * Number(config.hoursPerDay);

    return {
      ...config,
      targetHours: Number(config.targetHours),
      hoursPerDay: Number(config.hoursPerDay),
      startDate: startDateStr,
      totalWorkdays,
      workdaysElapsed,
      calculatedTarget,
      isCustomTarget: Number(config.targetHours) !== calculatedTarget,
    };
  },
};
