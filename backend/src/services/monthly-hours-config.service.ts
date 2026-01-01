import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_TARGET_HOURS = 80;

const configSelect = {
  id: true,
  year: true,
  month: true,
  targetHours: true,
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
      select: { targetHours: true },
    });

    return config ? Number(config.targetHours) : DEFAULT_TARGET_HOURS;
  },

  async upsert(year: number, month: number, targetHours: number, createdBy: string) {
    const config = await prisma.monthlyHoursConfig.upsert({
      where: {
        year_month: { year, month },
      },
      create: {
        year,
        month,
        targetHours,
        createdBy,
      },
      update: {
        targetHours,
      },
      select: configSelect,
    });

    return config;
  },
};
