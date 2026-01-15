import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { TaskCard, TaskModal, TaskForm, KanbanBoard, statusOptions, priorityOptions } from '../components/tasks';
import { taskService, type TaskWithRelations, type CreateTaskRequest, type UpdateTaskRequest } from '../services/task.service';
import { equipmentAssignmentService } from '../services/equipment-assignment.service';
import { useAuthContext } from '../stores/auth.store.tsx';
import type { TaskStatus, TaskPriority } from '../types';
import type { EquipmentAssignments } from '../components/tasks/TaskForm';

type ViewMode = 'list' | 'board';

const allStatusOptions = [{ value: '', label: 'Todos los estados' }, ...statusOptions];
const allPriorityOptions = [{ value: '', label: 'Todas las prioridades' }, ...priorityOptions];
const shiftOptions = [
  { value: '', label: 'Todos los turnos' },
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'both', label: 'Ambos turnos' },
];

export function Tasks() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [shiftFilter, setShiftFilter] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  // Handle ?open=ID parameter from notifications
  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId) {
      setSelectedTaskId(openId);
      // Clear the URL parameter
      searchParams.delete('open');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Query
  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: [
      'tasks',
      {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      },
    ],
    queryFn: () =>
      taskService.getAll({
        status: (statusFilter as TaskStatus) || undefined,
        priority: (priorityFilter as TaskPriority) || undefined,
        limit: 100,
      }),
  });

  // Create mutation
  const createTaskMutation = useMutation({
    mutationFn: async ({
      taskData,
      equipmentAssignments,
    }: {
      taskData: CreateTaskRequest;
      equipmentAssignments?: EquipmentAssignments;
    }) => {

      const task = await taskService.create(taskData);

      // Create equipment assignments if any (with shift support)
      if (equipmentAssignments && Object.keys(equipmentAssignments).length > 0) {
        for (const [userId, userShiftAssignments] of Object.entries(equipmentAssignments)) {

          // Process morning shift assignments
          if (userShiftAssignments.morning) {
            const morningAssignment = userShiftAssignments.morning;
            const morningEquipmentIds = [
              morningAssignment.cameraId,
              morningAssignment.lensId,
              morningAssignment.adapterId,
              morningAssignment.sdCardId,
            ].filter((id): id is string => !!id);


            if (morningEquipmentIds.length > 0 && taskData.morningStartTime && taskData.morningEndTime) {
              const executionDate = taskData.executionDate || new Date().toISOString().split('T')[0];
              const assignmentData = {
                equipmentIds: morningEquipmentIds,
                userId,
                startTime: `${executionDate}T${taskData.morningStartTime}:00`,
                endTime: `${executionDate}T${taskData.morningEndTime}:00`,
                notes: `Tarea: ${taskData.title} (Mañana)`,
              };
              try {
                await equipmentAssignmentService.create(assignmentData);
              } catch (err) {
                console.error('[Tasks] Error creating morning assignment:', err);
                throw err;
              }
            }
          }

          // Process afternoon shift assignments
          if (userShiftAssignments.afternoon) {
            const afternoonAssignment = userShiftAssignments.afternoon;
            const afternoonEquipmentIds = [
              afternoonAssignment.cameraId,
              afternoonAssignment.lensId,
              afternoonAssignment.adapterId,
              afternoonAssignment.sdCardId,
            ].filter((id): id is string => !!id);


            if (afternoonEquipmentIds.length > 0 && taskData.afternoonStartTime && taskData.afternoonEndTime) {
              const executionDate = taskData.executionDate || new Date().toISOString().split('T')[0];
              const assignmentData = {
                equipmentIds: afternoonEquipmentIds,
                userId,
                startTime: `${executionDate}T${taskData.afternoonStartTime}:00`,
                endTime: `${executionDate}T${taskData.afternoonEndTime}:00`,
                notes: `Tarea: ${taskData.title} (Tarde)`,
              };
              try {
                await equipmentAssignmentService.create(assignmentData);
              } catch (err) {
                console.error('[Tasks] Error creating afternoon assignment:', err);
                throw err;
              }
            }
          }
        }
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      setIsCreateModalOpen(false);
    },
  });

  const handleCreateTask = (
    data: CreateTaskRequest | UpdateTaskRequest,
    equipmentAssignments?: EquipmentAssignments
  ) => {
    createTaskMutation.mutate({ taskData: data as CreateTaskRequest, equipmentAssignments });
  };

  // Filter tasks by search query and shift
  const tasks = (tasksResponse?.data || []).filter((task: TaskWithRelations) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Shift filter
    if (shiftFilter) {
      if (task.shift !== shiftFilter) return false;
    }

    return true;
  });

  return (
    <div className="w-full max-w-full space-y-4 overflow-hidden sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Tareas</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:gap-1.5 sm:px-3 sm:text-sm ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:gap-1.5 sm:px-3 sm:text-sm ${
                viewMode === 'board'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Tablero</span>
            </button>
          </div>

          {isAdminOrSupervisor && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="flex-shrink-0">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nueva Tarea</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar tareas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="w-full min-w-[120px] flex-1 sm:w-40 sm:flex-none">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={allStatusOptions}
                />
              </div>
              <div className="w-full min-w-[120px] flex-1 sm:w-40 sm:flex-none">
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  options={allPriorityOptions}
                />
              </div>
              <div className="w-full min-w-[120px] flex-1 sm:w-40 sm:flex-none">
                <Select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  options={shiftOptions}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Views */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : viewMode === 'board' ? (
        /* Kanban Board View */
        <div className="-mx-4 min-h-[400px] px-4 sm:-mx-0 sm:min-h-[500px] sm:px-0">
          <KanbanBoard
            tasks={tasks}
            onTaskClick={(taskId) => setSelectedTaskId(taskId)}
          />
        </div>
      ) : tasks.length === 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="py-8 text-center sm:py-12">
            <Filter className="mx-auto h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
            <h3 className="mt-3 text-base font-medium text-gray-900 sm:mt-4 sm:text-lg">No hay tareas</h3>
            <p className="mt-1 text-sm text-gray-500 sm:mt-2">
              {searchQuery || statusFilter || priorityFilter || shiftFilter
                ? 'No se encontraron tareas con los filtros seleccionados.'
                : 'Aún no hay tareas creadas.'}
            </p>
            {isAdminOrSupervisor && !searchQuery && !statusFilter && !priorityFilter && !shiftFilter && (
              <Button className="mt-4 w-full sm:w-auto" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primera tarea
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {tasks.map((task: TaskWithRelations) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => setSelectedTaskId(task.id)}
            />
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nueva Tarea"
        size="2xl"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createTaskMutation.isPending}
        />
      </Modal>
    </div>
  );
}
