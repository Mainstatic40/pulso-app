import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SearchResult {
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: Date;
  }>;
  events: Array<{
    id: string;
    name: string;
    description: string;
    eventType: string;
    startDatetime: Date;
    endDatetime: Date;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage: string | null;
  }>;
}

export const searchService = {
  async search(
    query: string,
    userId: string,
    userRole: string
  ): Promise<SearchResult> {
    const searchTerm = query.trim().toLowerCase();
    const limit = 5;

    if (!searchTerm || searchTerm.length < 2) {
      return { tasks: [], events: [], users: [] };
    }

    const isAdminOrSupervisor = userRole === 'admin' || userRole === 'supervisor';

    // Build tasks query based on role
    const tasksWhere = isAdminOrSupervisor
      ? {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' as const } },
            { description: { contains: searchTerm, mode: 'insensitive' as const } },
          ],
        }
      : {
          AND: [
            {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' as const } },
                { description: { contains: searchTerm, mode: 'insensitive' as const } },
              ],
            },
            {
              assignees: {
                some: { userId },
              },
            },
          ],
        };

    // Execute searches in parallel
    const [tasks, events, users] = await Promise.all([
      // Search tasks
      prisma.task.findMany({
        where: tasksWhere,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),

      // Search events
      prisma.event.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          eventType: true,
          startDatetime: true,
          endDatetime: true,
        },
        orderBy: { startDatetime: 'desc' },
        take: limit,
      }),

      // Search users (only for admin/supervisor)
      isAdminOrSupervisor
        ? prisma.user.findMany({
            where: {
              isActive: true,
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profileImage: true,
            },
            orderBy: { name: 'asc' },
            take: limit,
          })
        : [],
    ]);

    return { tasks, events, users };
  },
};
