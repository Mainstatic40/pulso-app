import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, User, FileText, MessageSquare, Trash2, Edit2, Send, Camera, Clock, Sun, Sunset } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { statusOptions } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskForm, type EquipmentAssignments, type ExistingEquipmentAssignment } from './TaskForm';
import { taskService, type UpdateTaskRequest, type CreateTaskRequest } from '../../services/task.service';
import { commentService, type CommentWithUser } from '../../services/comment.service';
import { equipmentAssignmentService } from '../../services/equipment-assignment.service';
import { useAuthContext } from '../../stores/auth.store.tsx';
import type { TaskStatus, EquipmentCategory, EquipmentAssignment } from '../../types';

const categoryConfig: Record<EquipmentCategory, { label: string; color: string }> = {
  camera: { label: 'Cámara', color: 'bg-blue-100 text-blue-800' },
  lens: { label: 'Lente', color: 'bg-purple-100 text-purple-800' },
  adapter: { label: 'Adaptador', color: 'bg-orange-100 text-orange-800' },
  sd_card: { label: 'SD', color: 'bg-green-100 text-green-800' },
};

interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
}

interface ShiftEquipment {
  morning: EquipmentItem[];
  afternoon: EquipmentItem[];
}

interface EquipmentByUserAndShift {
  userId: string;
  userName: string;
  shifts: ShiftEquipment;
  morningTimeRange?: string;
  afternoonTimeRange?: string;
}

interface TaskModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(dateString: string): string {
  // Fix timezone issue: extract just the date part (YYYY-MM-DD) and use noon to avoid UTC shift
  // This handles both "2025-12-29" and "2025-12-29T00:00:00.000Z" formats
  const datePart = dateString.split('T')[0]; // Extract YYYY-MM-DD
  const dateToFormat = new Date(datePart + 'T12:00:00'); // Use noon local time

  return dateToFormat.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function canChangeStatus(
  currentStatus: TaskStatus,
  newStatus: TaskStatus,
  role: string
): boolean {
  if (role === 'admin' || role === 'supervisor') {
    return true;
  }

  // Becarios can only go: pending -> in_progress -> review
  const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
    pending: ['in_progress'],
    in_progress: ['review'],
    review: [],
    completed: [],
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
}

function getAvailableStatuses(currentStatus: TaskStatus, role: string): typeof statusOptions {
  if (role === 'admin' || role === 'supervisor') {
    return statusOptions;
  }

  return statusOptions.filter(
    (opt) =>
      opt.value === currentStatus ||
      canChangeStatus(currentStatus, opt.value as TaskStatus, role)
  );
}

export function TaskModal({ taskId, isOpen, onClose }: TaskModalProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState('');

  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => taskService.getById(taskId!),
    enabled: !!taskId && isOpen,
  });

  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['tasks', taskId, 'comments'],
    queryFn: () => commentService.getByTaskId(taskId!),
    enabled: !!taskId && isOpen,
  });

  // Query all equipment assignments (no active filter - we filter by task title in notes)
  const { data: assignmentsData } = useQuery({
    queryKey: ['equipment-assignments', 'all'],
    queryFn: () => equipmentAssignmentService.getAll({ limit: 500 }),
    enabled: !!task && isOpen,
  });

  // Filter and group equipment by user and shift for this task
  const equipmentByUserAndShift = useMemo((): EquipmentByUserAndShift[] => {
    if (!task) return [];

    const assignments = assignmentsData?.data || [];
    const taskNotePrefix = `Tarea: ${task.title}`;

    // Debug: Log all assignments and what we're searching for
    console.log('[TaskModal] Equipment assignments debug:', {
      taskTitle: task.title,
      searchingFor: taskNotePrefix,
      totalAssignments: assignments.length,
      allAssignmentNotes: assignments.map((a: EquipmentAssignment) => ({
        id: a.id,
        notes: a.notes,
        equipmentName: a.equipment?.name,
        userName: a.user?.name,
      })),
    });

    // Filter assignments where notes starts with "Tarea: {title}"
    const taskAssignments = assignments.filter(
      (a: EquipmentAssignment) => a.notes?.startsWith(taskNotePrefix)
    );

    // Debug: Log filtered assignments
    console.log('[TaskModal] Filtered assignments for this task:', {
      count: taskAssignments.length,
      assignments: taskAssignments.map((a: EquipmentAssignment) => ({
        id: a.id,
        notes: a.notes,
        equipmentName: a.equipment?.name,
        userName: a.user?.name,
      })),
    });

    const userMap = new Map<string, EquipmentByUserAndShift>();

    const formatTime = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    };

    taskAssignments.forEach((assignment: EquipmentAssignment) => {
      if (!assignment.user || !assignment.equipment) return;

      const userId = assignment.user.id;
      const isMorning = assignment.notes?.includes('(Mañana)') ?? false;
      const shiftType: 'morning' | 'afternoon' = isMorning ? 'morning' : 'afternoon';

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName: assignment.user.name,
          shifts: { morning: [], afternoon: [] },
        });
      }

      const userEntry = userMap.get(userId)!;

      userEntry.shifts[shiftType].push({
        id: assignment.equipment.id,
        name: assignment.equipment.name,
        category: assignment.equipment.category,
      });

      // Extract time range from assignment
      if (assignment.startTime && assignment.endTime) {
        const timeRange = `${formatTime(assignment.startTime)} - ${formatTime(assignment.endTime)}`;
        if (shiftType === 'morning') {
          userEntry.morningTimeRange = timeRange;
        } else {
          userEntry.afternoonTimeRange = timeRange;
        }
      }
    });

    return Array.from(userMap.values());
  }, [assignmentsData, task]);

  // Transform assignments for TaskForm (for editing)
  const existingAssignmentsForForm = useMemo((): ExistingEquipmentAssignment[] => {
    if (!task) return [];

    const assignments = assignmentsData?.data || [];
    const taskNotePrefix = `Tarea: ${task.title}`;

    const taskAssignments = assignments.filter(
      (a: EquipmentAssignment) => a.notes?.startsWith(taskNotePrefix)
    );

    return taskAssignments
      .filter((a: EquipmentAssignment) => a.user && a.equipment)
      .map((a: EquipmentAssignment) => {
        const isMorning = a.notes?.includes('(Mañana)') ?? false;
        return {
          id: a.id,
          equipmentId: a.equipment!.id,
          equipmentName: a.equipment!.name,
          equipmentCategory: a.equipment!.category,
          userId: a.user!.id,
          userName: a.user!.name,
          shift: (isMorning ? 'morning' : 'afternoon') as 'morning' | 'afternoon',
          startTime: a.startTime,
          endTime: a.endTime ?? null,
        };
      });
  }, [assignmentsData, task]);

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskData,
      equipmentAssignments,
    }: {
      taskData: UpdateTaskRequest;
      equipmentAssignments?: EquipmentAssignments;
    }) => {
      const updatedTask = await taskService.update(taskId!, taskData);

      // Create equipment assignments if any (now with shift support)
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
              await equipmentAssignmentService.create({
                equipmentIds: morningEquipmentIds,
                userId,
                startTime: `${executionDate}T${taskData.morningStartTime}:00`,
                endTime: `${executionDate}T${taskData.morningEndTime}:00`,
                notes: `Tarea: ${task?.title || 'Sin título'} (Mañana)`,
              });
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
              await equipmentAssignmentService.create({
                equipmentIds: afternoonEquipmentIds,
                userId,
                startTime: `${executionDate}T${taskData.afternoonStartTime}:00`,
                endTime: `${executionDate}T${taskData.afternoonEndTime}:00`,
                notes: `Tarea: ${task?.title || 'Sin título'} (Tarde)`,
              });
            }
          }
        }
      }

      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      setIsEditing(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: TaskStatus) => taskService.updateStatus(taskId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => taskService.delete(taskId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: () => commentService.create(taskId!, { content: newComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] });
      setNewComment('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentService.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] });
    },
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    if (task && canChangeStatus(task.status, newStatus, user?.role || '')) {
      updateStatusMutation.mutate(newStatus);
    }
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      deleteTaskMutation.mutate();
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setNewComment('');
    onClose();
  };

  if (!isOpen) return null;

  const handleUpdateTask = (
    data: CreateTaskRequest | UpdateTaskRequest,
    equipmentAssignments?: EquipmentAssignments
  ) => {
    updateTaskMutation.mutate({ taskData: data as UpdateTaskRequest, equipmentAssignments });
  };

  if (isEditing && task) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Editar Tarea" size="lg">
        <TaskForm
          task={task}
          existingAssignments={existingAssignmentsForForm}
          onSubmit={handleUpdateTask}
          onCancel={() => setIsEditing(false)}
          isLoading={updateTaskMutation.isPending}
        />
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Detalle de Tarea" size="lg">
      {isLoadingTask ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : task ? (
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
            {isAdminOrSupervisor && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={deleteTaskMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Status and Priority */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Estado:</span>
              {user && (
                <Select
                  value={task.status}
                  onChange={handleStatusChange}
                  options={getAvailableStatuses(task.status, user.role)}
                  className="w-40"
                  disabled={updateStatusMutation.isPending}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Prioridad:</span>
              <TaskPriorityBadge priority={task.priority} />
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="mt-6">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4" />
                Descripción
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-gray-600">{task.description}</p>
            </div>
          )}

          {/* Assignees */}
          {task.assignees && task.assignees.length > 0 && (
            <div className="mt-6">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4" />
                Asignados
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {task.assignees.map((assignee) => (
                  <div
                    key={assignee.user.id}
                    className="flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-1 pr-3"
                  >
                    <Avatar name={assignee.user.name} size="sm" />
                    <span className="text-sm text-gray-700">{assignee.user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Date and Execution Date together */}
          <div className="mt-6 flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              Fecha límite: <strong>{formatDate(task.dueDate)}</strong>
            </span>
          </div>
          {task.executionDate && (
            <div className="mt-2 flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Fecha de ejecución: <strong>{formatDate(task.executionDate)}</strong>
              </span>
            </div>
          )}

          {/* Client Requirements */}
          {task.clientRequirements && (
            <div className="mt-6 rounded-lg bg-yellow-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-yellow-800">
                <FileText className="h-4 w-4" />
                Requisitos del Cliente
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-yellow-700">
                {task.clientRequirements}
              </p>
            </div>
          )}

          {/* Shift Information - only times */}
          {task.shift && (task.morningStartTime || task.afternoonStartTime) && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-blue-800">
                <Clock className="h-4 w-4" />
                Horario
              </h3>
              <div className="mt-3 flex flex-wrap gap-4">
                {(task.shift === 'morning' || task.shift === 'both') && task.morningStartTime && task.morningEndTime && (
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-blue-700">
                      <strong>Mañana:</strong> {task.morningStartTime} - {task.morningEndTime}
                    </span>
                  </div>
                )}
                {(task.shift === 'afternoon' || task.shift === 'both') && task.afternoonStartTime && task.afternoonEndTime && (
                  <div className="flex items-center gap-2">
                    <Sunset className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-blue-700">
                      <strong>Tarde:</strong> {task.afternoonStartTime} - {task.afternoonEndTime}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Equipment Assignments by User and Shift */}
          {equipmentByUserAndShift.length > 0 && (
            <div className="mt-6">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Camera className="h-4 w-4" />
                Distribución de Equipos
              </h3>
              <div className="mt-3 space-y-3">
                {equipmentByUserAndShift.map((userEquipment) => (
                  <div
                    key={userEquipment.userId}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <p className="font-medium text-gray-900">{userEquipment.userName}</p>
                    </div>

                    {/* Morning Shift Equipment */}
                    {userEquipment.shifts.morning.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Sun className="h-4 w-4 text-amber-500" />
                          <span className="font-medium text-gray-700">Mañana</span>
                          {userEquipment.morningTimeRange && (
                            <span className="text-xs text-gray-500">
                              ({userEquipment.morningTimeRange})
                            </span>
                          )}
                        </div>
                        <div className="mt-2 ml-6 flex flex-wrap gap-2">
                          {userEquipment.shifts.morning.map((eq) => {
                            const config = categoryConfig[eq.category];
                            return (
                              <span
                                key={eq.id}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.color}`}
                              >
                                <span className="text-[10px]">{config.label}:</span>
                                {eq.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Shift Equipment */}
                    {userEquipment.shifts.afternoon.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Sunset className="h-4 w-4 text-orange-500" />
                          <span className="font-medium text-gray-700">Tarde</span>
                          {userEquipment.afternoonTimeRange && (
                            <span className="text-xs text-gray-500">
                              ({userEquipment.afternoonTimeRange})
                            </span>
                          )}
                        </div>
                        <div className="mt-2 ml-6 flex flex-wrap gap-2">
                          {userEquipment.shifts.afternoon.map((eq) => {
                            const config = categoryConfig[eq.category];
                            return (
                              <span
                                key={eq.id}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.color}`}
                              >
                                <span className="text-[10px]">{config.label}:</span>
                                {eq.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MessageSquare className="h-4 w-4" />
              Comentarios ({comments?.length || 0})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="mt-4">
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  isLoading={addCommentMutation.isPending}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Comments List */}
            <div className="mt-4 space-y-4">
              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : comments && comments.length > 0 ? (
                comments.map((comment: CommentWithUser) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar name={comment.user.name} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(comment.createdAt)}
                        </span>
                        {(user?.id === comment.userId || isAdminOrSupervisor) && (
                          <button
                            onClick={() => {
                              if (window.confirm('¿Eliminar este comentario?')) {
                                deleteCommentMutation.mutate(comment.id);
                              }
                            }}
                            className="ml-auto text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-gray-500">
                  No hay comentarios aún
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500">Tarea no encontrada</div>
      )}
    </Modal>
  );
}
