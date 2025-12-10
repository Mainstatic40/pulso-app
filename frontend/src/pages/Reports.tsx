import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar, ListTodo, TrendingUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import {
  ReportFilters,
  HoursByUserReport,
  HoursByEventReport,
  TasksSummaryReport,
  ProductivityReport,
} from '../components/reports';
import { reportService } from '../services/report.service';
import { userService } from '../services/user.service';

// Get default date range (current month)
function getDefaultDateRange() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    from: firstDay.toISOString().split('T')[0],
    to: lastDay.toISOString().split('T')[0],
  };
}

export function Reports() {
  const defaultRange = getDefaultDateRange();

  // Filter state
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [userId, setUserId] = useState('');

  // Export loading states
  const [exportingHours, setExportingHours] = useState(false);
  const [exportingTasks, setExportingTasks] = useState(false);
  const [exportingProductivity, setExportingProductivity] = useState(false);

  const filters = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    userId: userId || undefined,
  };

  // Fetch users for filter
  const { data: usersData } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => userService.getAll({ limit: 100 }),
  });
  const users = usersData?.data || [];

  // Fetch reports data
  const { data: hoursByUser, isLoading: loadingHoursByUser } = useQuery({
    queryKey: ['reports', 'hours-by-user', filters],
    queryFn: () => reportService.getHoursByUser(filters),
  });

  const { data: hoursByEvent, isLoading: loadingHoursByEvent } = useQuery({
    queryKey: ['reports', 'hours-by-event', filters],
    queryFn: () => reportService.getHoursByEvent(filters),
  });

  const { data: tasksSummary, isLoading: loadingTasksSummary } = useQuery({
    queryKey: ['reports', 'tasks-summary', filters],
    queryFn: () => reportService.getTasksSummary(filters),
  });

  const { data: productivity, isLoading: loadingProductivity } = useQuery({
    queryKey: ['reports', 'productivity', filters],
    queryFn: () => reportService.getProductivity(filters),
  });

  // Export handlers
  const handleExportHours = async () => {
    setExportingHours(true);
    try {
      await reportService.exportToExcel('hours', filters);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportingHours(false);
    }
  };

  const handleExportTasks = async () => {
    setExportingTasks(true);
    try {
      await reportService.exportToExcel('tasks', filters);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportingTasks(false);
    }
  };

  const handleExportProductivity = async () => {
    setExportingProductivity(true);
    try {
      await reportService.exportToExcel('productivity', filters);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportingProductivity(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Genera y exporta reportes del equipo
        </p>
      </div>

      {/* Global Filters */}
      <ReportFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        userId={userId}
        users={users}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onUserChange={setUserId}
      />

      {/* Reports Tabs */}
      <Tabs defaultValue="hours-user">
        <TabsList>
          <TabsTrigger value="hours-user">
            <Clock className="mr-2 h-4 w-4" />
            Horas por Usuario
          </TabsTrigger>
          <TabsTrigger value="hours-event">
            <Calendar className="mr-2 h-4 w-4" />
            Horas por Evento
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListTodo className="mr-2 h-4 w-4" />
            Resumen de Tareas
          </TabsTrigger>
          <TabsTrigger value="productivity">
            <TrendingUp className="mr-2 h-4 w-4" />
            Productividad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hours-user" className="mt-6">
          <HoursByUserReport
            data={hoursByUser || []}
            isLoading={loadingHoursByUser}
            onExport={handleExportHours}
            isExporting={exportingHours}
          />
        </TabsContent>

        <TabsContent value="hours-event" className="mt-6">
          <HoursByEventReport
            data={hoursByEvent || []}
            isLoading={loadingHoursByEvent}
            onExport={handleExportHours}
            isExporting={exportingHours}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TasksSummaryReport
            data={tasksSummary || null}
            isLoading={loadingTasksSummary}
            onExport={handleExportTasks}
            isExporting={exportingTasks}
          />
        </TabsContent>

        <TabsContent value="productivity" className="mt-6">
          <ProductivityReport
            data={productivity || []}
            isLoading={loadingProductivity}
            onExport={handleExportProductivity}
            isExporting={exportingProductivity}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
