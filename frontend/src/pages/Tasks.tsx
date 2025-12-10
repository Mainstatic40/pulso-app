import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { TaskCard, TaskModal, TaskForm, statusOptions, priorityOptions } from '../components/tasks';
import { taskService, type TaskWithRelations, type CreateTaskRequest } from '../services/task.service';
import { useAuthContext } from '../stores/auth.store.tsx';
import type { TaskStatus, TaskPriority } from '../types';

const allStatusOptions = [{ value: '', label: 'Todos los estados' }, ...statusOptions];
const allPriorityOptions = [{ value: '', label: 'Todas las prioridades' }, ...priorityOptions];

export function Tasks() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

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
    mutationFn: (data: CreateTaskRequest) => taskService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateModalOpen(false);
    },
  });

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
        {isAdminOrSupervisor && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        )}
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

      {/* Task List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
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
        size="lg"
      >
        <TaskForm
          onSubmit={(data) => createTaskMutation.mutate(data as CreateTaskRequest)}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createTaskMutation.isPending}
        />
      </Modal>
    </div>
  );
}
