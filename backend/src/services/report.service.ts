import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';
import ExcelJS from 'exceljs';
import { isWeekend } from '../utils/workdays';

const prisma = new PrismaClient();

interface DateRangeQuery {
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
}

// Interface for hours breakdown by day of week
interface HoursByDay {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

// Get day of week key from date (0=Sun, 1=Mon, ..., 6=Sat)
function getDayOfWeek(date: Date): keyof HoursByDay {
  const day = date.getDay();
  const days: (keyof HoursByDay)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[day];
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

    // First, get all active users who track hours OR are supervisors (or specific user if filtered)
    const usersWhere: Record<string, unknown> = {
      isActive: true,
      OR: [
        { tracksHours: true },
        { role: 'supervisor' }
      ]
    };

    if (query.userId) {
      usersWhere.id = query.userId;
    }

    const usersWhoTrackHours = await prisma.user.findMany({
      where: usersWhere,
      select: { id: true, name: true, email: true, profileImage: true, role: true },
    });

    // Get all time entries to separate weekday vs weekend hours
    const entriesWhereClause: Record<string, unknown> = {
      clockOut: { not: null },
    };

    if (Object.keys(dateRange).length > 0) {
      entriesWhereClause.clockIn = dateRange;
    }

    if (query.userId) {
      entriesWhereClause.userId = query.userId;
    } else {
      entriesWhereClause.userId = { in: usersWhoTrackHours.map((u) => u.id) };
    }

    const allEntries = await prisma.timeEntry.findMany({
      where: entriesWhereClause,
      select: {
        userId: true,
        clockIn: true,
        totalHours: true,
      },
    });

    // Calculate hours by user, by day of week, and weekday vs weekend
    const userHoursMap = new Map<string, {
      hoursByDay: HoursByDay;
      weekdayHours: number;
      weekendHours: number;
      weekdaySessions: number;
      weekendSessions: number;
    }>();

    // Initialize map for all users
    usersWhoTrackHours.forEach((user) => {
      userHoursMap.set(user.id, {
        hoursByDay: {
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0,
          sunday: 0,
        },
        weekdayHours: 0,
        weekendHours: 0,
        weekdaySessions: 0,
        weekendSessions: 0,
      });
    });

    // Process entries
    for (const entry of allEntries) {
      const userData = userHoursMap.get(entry.userId);
      if (!userData) continue;

      const hours = Number(entry.totalHours) || 0;
      const entryDate = new Date(entry.clockIn);
      const dayOfWeek = getDayOfWeek(entryDate);

      // Add hours to specific day
      userData.hoursByDay[dayOfWeek] += hours;

      // Also track weekday vs weekend
      if (isWeekend(entryDate)) {
        userData.weekendHours += hours;
        userData.weekendSessions += 1;
      } else {
        userData.weekdayHours += hours;
        userData.weekdaySessions += 1;
      }
    }

    // Combine all users who track hours with their hours (including those with 0 hours)
    const data = usersWhoTrackHours.map((user) => {
      const userData = userHoursMap.get(user.id)!;

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        userProfileImage: user.profileImage || null,
        // Hours by day of week (rounded to 1 decimal)
        hoursByDay: {
          monday: Math.round(userData.hoursByDay.monday * 10) / 10,
          tuesday: Math.round(userData.hoursByDay.tuesday * 10) / 10,
          wednesday: Math.round(userData.hoursByDay.wednesday * 10) / 10,
          thursday: Math.round(userData.hoursByDay.thursday * 10) / 10,
          friday: Math.round(userData.hoursByDay.friday * 10) / 10,
          saturday: Math.round(userData.hoursByDay.saturday * 10) / 10,
          sunday: Math.round(userData.hoursByDay.sunday * 10) / 10,
        },
        // Total hours (for backwards compatibility)
        totalHours: Math.round((userData.weekdayHours + userData.weekendHours) * 10) / 10,
        totalSessions: userData.weekdaySessions + userData.weekendSessions,
        // Separated hours
        weekdayHours: Math.round(userData.weekdayHours * 10) / 10,
        weekendHours: Math.round(userData.weekendHours * 10) / 10,
        weekdaySessions: userData.weekdaySessions,
        weekendSessions: userData.weekendSessions,
      };
    });

    // Sort by weekday hours descending (primary metric for progress)
    data.sort((a, b) => b.weekdayHours - a.weekdayHours);

    const totals = {
      hoursByDay: {
        monday: Math.round(data.reduce((sum, d) => sum + d.hoursByDay.monday, 0) * 10) / 10,
        tuesday: Math.round(data.reduce((sum, d) => sum + d.hoursByDay.tuesday, 0) * 10) / 10,
        wednesday: Math.round(data.reduce((sum, d) => sum + d.hoursByDay.wednesday, 0) * 10) / 10,
        thursday: Math.round(data.reduce((sum, d) => sum + d.hoursByDay.thursday, 0) * 10) / 10,
        friday: Math.round(data.reduce((sum, d) => sum + d.hoursByDay.friday, 0) * 10) / 10,
        saturday: Math.round(data.reduce((sum, d) => sum + d.hoursByDay.saturday, 0) * 10) / 10,
        sunday: Math.round(data.reduce((sum, d) => sum + d.hoursByDay.sunday, 0) * 10) / 10,
      },
      totalHours: Math.round(data.reduce((sum, d) => sum + d.totalHours, 0) * 10) / 10,
      totalSessions: data.reduce((sum, d) => sum + d.totalSessions, 0),
      weekdayHours: Math.round(data.reduce((sum, d) => sum + d.weekdayHours, 0) * 10) / 10,
      weekendHours: Math.round(data.reduce((sum, d) => sum + d.weekendHours, 0) * 10) / 10,
      weekdaySessions: data.reduce((sum, d) => sum + d.weekdaySessions, 0),
      weekendSessions: data.reduce((sum, d) => sum + d.weekendSessions, 0),
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

        // Define columns with day breakdown
        sheet.columns = [
          { header: 'Usuario', key: 'userName', width: 25 },
          { header: 'Email', key: 'userEmail', width: 30 },
          { header: 'Rol', key: 'userRole', width: 12 },
          { header: 'Lun', key: 'monday', width: 8 },
          { header: 'Mar', key: 'tuesday', width: 8 },
          { header: 'Mie', key: 'wednesday', width: 8 },
          { header: 'Jue', key: 'thursday', width: 8 },
          { header: 'Vie', key: 'friday', width: 8 },
          { header: 'Sab', key: 'saturday', width: 8 },
          { header: 'Dom', key: 'sunday', width: 8 },
          { header: 'Total L-V', key: 'weekdayHours', width: 10 },
          { header: 'Total S-D', key: 'weekendHours', width: 10 },
          { header: 'Total', key: 'totalHours', width: 10 },
          { header: 'Sesiones', key: 'totalSessions', width: 10 },
        ];

        // Style header
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCC0000' },
        };
        headerRow.alignment = { horizontal: 'center' };

        // Role labels mapping
        const roleLabels: Record<string, string> = {
          admin: 'Admin',
          supervisor: 'Supervisor',
          becario: 'Becario',
        };

        // Add data rows
        data.forEach((row) => {
          const dataRow = sheet.addRow({
            userName: row.userName,
            userEmail: row.userEmail,
            userRole: roleLabels[row.userRole] || row.userRole,
            monday: row.hoursByDay.monday || 0,
            tuesday: row.hoursByDay.tuesday || 0,
            wednesday: row.hoursByDay.wednesday || 0,
            thursday: row.hoursByDay.thursday || 0,
            friday: row.hoursByDay.friday || 0,
            saturday: row.hoursByDay.saturday || 0,
            sunday: row.hoursByDay.sunday || 0,
            weekdayHours: row.weekdayHours,
            weekendHours: row.weekendHours,
            totalHours: row.totalHours,
            totalSessions: row.totalSessions,
          });

          // Center day and total columns (4-14)
          for (let col = 4; col <= 14; col++) {
            dataRow.getCell(col).alignment = { horizontal: 'center' };
          }
        });

        // Add totals row
        const totalsRow = sheet.addRow({
          userName: 'TOTAL',
          userEmail: '',
          userRole: '',
          monday: totals.hoursByDay.monday,
          tuesday: totals.hoursByDay.tuesday,
          wednesday: totals.hoursByDay.wednesday,
          thursday: totals.hoursByDay.thursday,
          friday: totals.hoursByDay.friday,
          saturday: totals.hoursByDay.saturday,
          sunday: totals.hoursByDay.sunday,
          weekdayHours: totals.weekdayHours,
          weekendHours: totals.weekendHours,
          totalHours: totals.totalHours,
          totalSessions: totals.totalSessions,
        });

        // Style totals row
        totalsRow.font = { bold: true };
        totalsRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' },
        };
        for (let col = 4; col <= 14; col++) {
          totalsRow.getCell(col).alignment = { horizontal: 'center' };
        }

        // Apply borders to all cells
        sheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });
        });

        // Highlight weekend columns (Sab=9, Dom=10) with soft yellow background
        const weekendColumns = [9, 10];
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            weekendColumns.forEach((colIndex) => {
              const cell = row.getCell(colIndex);
              // Don't override totals row fill
              if (rowNumber < sheet.rowCount) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFFF3CD' },
                };
              }
            });
          }
        });

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
