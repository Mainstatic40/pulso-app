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

export function Tasks() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
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

  // Filter tasks by search query
  const tasks = (tasksResponse?.data || []).filter((task: TaskWithRelations) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'board'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Tablero
            </button>
          </div>

          {isAdminOrSupervisor && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Tarea
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
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
            <div className="flex gap-4">
              <div className="w-44">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={allStatusOptions}
                />
              </div>
              <div className="w-44">
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  options={allPriorityOptions}
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
        <div className="min-h-[500px]">
          <KanbanBoard
            tasks={tasks}
            onTaskClick={(taskId) => setSelectedTaskId(taskId)}
          />
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay tareas</h3>
            <p className="mt-2 text-gray-500">
              {searchQuery || statusFilter || priorityFilter
                ? 'No se encontraron tareas con los filtros seleccionados.'
                : 'Aún no hay tareas creadas.'}
            </p>
            {isAdminOrSupervisor && !searchQuery && !statusFilter && !priorityFilter && (
              <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primera tarea
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
