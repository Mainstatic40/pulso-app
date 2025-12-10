import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

interface DateRangeQuery {
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
}

function getDateRange(query: DateRangeQuery): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {};
  if (query.dateFrom) range.gte = query.dateFrom;
  if (query.dateTo) {
    const endOfDay = new Date(query.dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    range.lte = endOfDay;
  }
  return range;
}

export const reportService = {
  async getHoursByUser(query: DateRangeQuery) {
    const dateRange = getDateRange(query);

    const whereClause: Record<string, unknown> = {
      clockOut: { not: null },
    };

    if (Object.keys(dateRange).length > 0) {
      whereClause.clockIn = dateRange;
    }

    if (query.userId) {
      whereClause.userId = query.userId;
    }

    const entries = await prisma.timeEntry.groupBy({
      by: ['userId'],
      where: whereClause,
      _sum: { totalHours: true },
      _count: { id: true },
    });

    // Get user names
    const userIds = entries.map((e) => e.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = entries.map((entry) => {
      const user = userMap.get(entry.userId);
      return {
        userId: entry.userId,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || '',
        totalHours: Number(entry._sum.totalHours) || 0,
        totalSessions: entry._count.id,
      };
    });

    // Sort by total hours descending
    data.sort((a, b) => b.totalHours - a.totalHours);

    const totals = {
      totalHours: data.reduce((sum, d) => sum + d.totalHours, 0),
      totalSessions: data.reduce((sum, d) => sum + d.totalSessions, 0),
    };

    return { data, totals };
  },

  async getHoursByEvent(query: DateRangeQuery) {
    const dateRange = getDateRange(query);

    const whereClause: Record<string, unknown> = {
      clockOut: { not: null },
      eventId: { not: null },
    };

    if (Object.keys(dateRange).length > 0) {
      whereClause.clockIn = dateRange;
    }

    const entries = await prisma.timeEntry.groupBy({
      by: ['eventId'],
      where: whereClause,
      _sum: { totalHours: true },
      _count: { id: true },
    });

    // Get event details
    const eventIds = entries.map((e) => e.eventId).filter((id): id is string => id !== null);
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: {
        id: true,
        name: true,
        _count: { select: { assignees: true } },
      },
    });

    const eventMap = new Map(events.map((e) => [e.id, e]));

    const data = entries
      .filter((entry) => entry.eventId !== null)
      .map((entry) => {
        const event = eventMap.get(entry.eventId!);
        return {
          eventId: entry.eventId,
          eventName: event?.name || 'Unknown',
          totalHours: Number(entry._sum.totalHours) || 0,
          totalSessions: entry._count.id,
          assigneesCount: event?._count.assignees || 0,
        };
      });

    // Sort by total hours descending
    data.sort((a, b) => b.totalHours - a.totalHours);

    return { data };
  },

  async getTasksSummary(query: DateRangeQuery) {
    const dateRange = getDateRange(query);

    const whereClause: Record<string, unknown> = {};

    if (Object.keys(dateRange).length > 0) {
      whereClause.createdAt = dateRange;
    }

    if (query.userId) {
      whereClause.assignees = { some: { userId: query.userId } };
    }

    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true },
    });

    const priorityCounts = await prisma.task.groupBy({
      by: ['priority'],
      where: whereClause,
      _count: { id: true },
    });

    const statusMap: Record<TaskStatus, number> = {
      [TaskStatus.pending]: 0,
      [TaskStatus.in_progress]: 0,
      [TaskStatus.review]: 0,
      [TaskStatus.completed]: 0,
    };

    for (const item of statusCounts) {
      statusMap[item.status] = item._count.id;
    }

    const priorityMap: Record<TaskPriority, number> = {
      [TaskPriority.high]: 0,
      [TaskPriority.medium]: 0,
      [TaskPriority.low]: 0,
    };

    for (const item of priorityCounts) {
      priorityMap[item.priority] = item._count.id;
    }

    const total = Object.values(statusMap).reduce((sum, count) => sum + count, 0);
    const completionRate = total > 0 ? Math.round((statusMap.completed / total) * 100 * 10) / 10 : 0;

    return {
      data: {
        pending: statusMap.pending,
        inProgress: statusMap.in_progress,
        review: statusMap.review,
        completed: statusMap.completed,
        total,
        completionRate,
      },
      byPriority: {
        high: priorityMap.high,
        medium: priorityMap.medium,
        low: priorityMap.low,
      },
    };
  },

  async getProductivity(query: DateRangeQuery) {
    const dateRange = getDateRange(query);

    // Get users
    const usersWhere: Record<string, unknown> = { isActive: true };
    if (query.userId) {
      usersWhere.id = query.userId;
    }

    const users = await prisma.user.findMany({
      where: usersWhere,
      select: { id: true, name: true, email: true },
    });

    const data = await Promise.all(
      users.map(async (user) => {
        // Get hours worked
        const hoursWhereClause: Record<string, unknown> = {
          userId: user.id,
          clockOut: { not: null },
        };
        if (Object.keys(dateRange).length > 0) {
          hoursWhereClause.clockIn = dateRange;
        }

        const hoursResult = await prisma.timeEntry.aggregate({
          where: hoursWhereClause,
          _sum: { totalHours: true },
        });

        const hoursWorked = Number(hoursResult._sum.totalHours) || 0;

        // Get tasks completed
        const tasksWhereClause: Record<string, unknown> = {
          assignees: { some: { userId: user.id } },
          status: TaskStatus.completed,
        };
        if (Object.keys(dateRange).length > 0) {
          tasksWhereClause.updatedAt = dateRange;
        }

        const tasksCompleted = await prisma.task.count({
          where: tasksWhereClause,
        });

        // Get tasks in progress
        const tasksInProgress = await prisma.task.count({
          where: {
            assignees: { some: { userId: user.id } },
            status: TaskStatus.in_progress,
          },
        });

        const avgHoursPerTask = tasksCompleted > 0
          ? Math.round((hoursWorked / tasksCompleted) * 10) / 10
          : 0;

        return {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          hoursWorked: Math.round(hoursWorked * 10) / 10,
          tasksCompleted,
          tasksInProgress,
          avgHoursPerTask,
        };
      })
    );

    // Sort by hours worked descending
    data.sort((a, b) => b.hoursWorked - a.hoursWorked);

    return { data };
  },

  async getWeeklyLogsReport(query: DateRangeQuery) {
    const dateRange = getDateRange(query);

    const whereClause: Record<string, unknown> = {};

    if (Object.keys(dateRange).length > 0) {
      whereClause.weekStart = dateRange;
    }

    if (query.userId) {
      whereClause.userId = query.userId;
    }

    const logs = await prisma.weeklyLog.findMany({
      where: whereClause,
      select: {
        id: true,
        weekStart: true,
        weekEnd: true,
        activities: true,
        achievements: true,
        challenges: true,
        totalHours: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { weekStart: 'desc' },
    });

    return { data: logs };
  },

  async exportToExcel(type: string, query: DateRangeQuery): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PULSO';
    workbook.created = new Date();

    switch (type) {
      case 'hours': {
        const { data, totals } = await this.getHoursByUser(query);
        const sheet = workbook.addWorksheet('Horas por Usuario');

        sheet.columns = [
          { header: 'Usuario', key: 'userName', width: 30 },
          { header: 'Email', key: 'userEmail', width: 35 },
          { header: 'Horas Totales', key: 'totalHours', width: 15 },
          { header: 'Sesiones', key: 'totalSessions', width: 12 },
        ];

        // Style header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCC0000' },
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        data.forEach((row) => {
          sheet.addRow(row);
        });

        // Add totals row
        const totalsRow = sheet.addRow({
          userName: 'TOTAL',
          userEmail: '',
          totalHours: totals.totalHours,
          totalSessions: totals.totalSessions,
        });
        totalsRow.font = { bold: true };
        break;
      }

      case 'tasks': {
        const result = await this.getTasksSummary(query);
        const sheet = workbook.addWorksheet('Resumen de Tareas');

        sheet.columns = [
          { header: 'Estado', key: 'status', width: 20 },
          { header: 'Cantidad', key: 'count', width: 15 },
        ];

        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCC0000' },
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        sheet.addRow({ status: 'Pendiente', count: result.data.pending });
        sheet.addRow({ status: 'En Progreso', count: result.data.inProgress });
        sheet.addRow({ status: 'En Revisión', count: result.data.review });
        sheet.addRow({ status: 'Completadas', count: result.data.completed });
        sheet.addRow({ status: 'TOTAL', count: result.data.total });
        sheet.getRow(6).font = { bold: true };

        // Add priority sheet
        const prioritySheet = workbook.addWorksheet('Por Prioridad');
        prioritySheet.columns = [
          { header: 'Prioridad', key: 'priority', width: 20 },
          { header: 'Cantidad', key: 'count', width: 15 },
        ];

        prioritySheet.getRow(1).font = { bold: true };
        prioritySheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCC0000' },
        };
        prioritySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        prioritySheet.addRow({ priority: 'Alta', count: result.byPriority.high });
        prioritySheet.addRow({ priority: 'Media', count: result.byPriority.medium });
        prioritySheet.addRow({ priority: 'Baja', count: result.byPriority.low });
        break;
      }

      case 'logs': {
        const { data } = await this.getWeeklyLogsReport(query);
        const sheet = workbook.addWorksheet('Bitácoras Semanales');

        sheet.columns = [
          { header: 'Usuario', key: 'userName', width: 25 },
          { header: 'Email', key: 'userEmail', width: 30 },
          { header: 'Semana Inicio', key: 'weekStart', width: 15 },
          { header: 'Semana Fin', key: 'weekEnd', width: 15 },
          { header: 'Horas', key: 'totalHours', width: 10 },
          { header: 'Actividades', key: 'activities', width: 50 },
          { header: 'Logros', key: 'achievements', width: 40 },
          { header: 'Desafíos', key: 'challenges', width: 40 },
        ];

        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCC0000' },
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        data.forEach((log) => {
          sheet.addRow({
            userName: log.user.name,
            userEmail: log.user.email,
            weekStart: log.weekStart.toISOString().split('T')[0],
            weekEnd: log.weekEnd.toISOString().split('T')[0],
            totalHours: Number(log.totalHours),
            activities: log.activities,
            achievements: log.achievements || '',
            challenges: log.challenges || '',
          });
        });
        break;
      }

      case 'productivity': {
        const { data } = await this.getProductivity(query);
        const sheet = workbook.addWorksheet('Productividad');

        sheet.columns = [
          { header: 'Usuario', key: 'userName', width: 30 },
          { header: 'Email', key: 'userEmail', width: 35 },
          { header: 'Horas Trabajadas', key: 'hoursWorked', width: 18 },
          { header: 'Tareas Completadas', key: 'tasksCompleted', width: 20 },
          { header: 'Tareas En Progreso', key: 'tasksInProgress', width: 20 },
          { header: 'Prom. Horas/Tarea', key: 'avgHoursPerTask', width: 18 },
        ];

        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCC0000' },
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        data.forEach((row) => {
          sheet.addRow(row);
        });

        // Add totals row
        const totalsRow = sheet.addRow({
          userName: 'TOTAL',
          userEmail: '',
          hoursWorked: data.reduce((sum, d) => sum + d.hoursWorked, 0),
          tasksCompleted: data.reduce((sum, d) => sum + d.tasksCompleted, 0),
          tasksInProgress: data.reduce((sum, d) => sum + d.tasksInProgress, 0),
          avgHoursPerTask: '',
        });
        totalsRow.font = { bold: true };
        break;
      }

      default:
        throw new Error(`Invalid export type: ${type}`);
    }

    return workbook;
  },
};
