import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, User, FileText, MessageSquare, Trash2, Edit2, Send, Camera, Clock, Sun, Sunset, Users, ClipboardList, Download, X, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { statusOptions } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskChecklist } from './TaskChecklist';
import { AttachmentsList } from '../shared/AttachmentsList';
import { TaskForm, type EquipmentAssignments, type ExistingEquipmentAssignment } from './TaskForm';
import { TaskExportView } from './TaskExportView';
import { taskService, type UpdateTaskRequest, type CreateTaskRequest } from '../../services/task.service';
import { commentService, type CommentWithUser } from '../../services/comment.service';
import { equipmentAssignmentService } from '../../services/equipment-assignment.service';
import { userService } from '../../services/user.service';
import { exportTaskToImage } from '../../utils/exportTaskToImage';
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

function formatDateShort(dateString: string): string {
  const datePart = dateString.split('T')[0];
  const dateToFormat = new Date(datePart + 'T12:00:00');

  return dateToFormat.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [replacingUserId, setReplacingUserId] = useState<string | null>(null);

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
    refetchInterval: 15000, // Poll every 15 seconds for new comments
  });

  // Query all equipment assignments (no active filter - we filter by task title in notes)
  const { data: assignmentsData } = useQuery({
    queryKey: ['equipment-assignments', 'all'],
    queryFn: () => equipmentAssignmentService.getAll({ limit: 500 }),
    enabled: !!task && isOpen,
    staleTime: 10000, // Consider stale after 10 seconds
  });

  // Query users for replacement dropdown (only when replacing)
  const { data: usersData } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => userService.getAll({ isActive: true, limit: 50 }),
    enabled: !!replacingUserId && isOpen,
  });

  // Filter and group equipment by user and shift for this task
  const equipmentByUserAndShift = useMemo((): EquipmentByUserAndShift[] => {
    if (!task) return [];

    const assignments = assignmentsData?.data || [];
    const taskNotePrefix = `Tarea: ${task.title}`;
    const now = new Date();

    // Filter assignments for this task that are not yet ended
    // This includes: future assignments (not started), active assignments (started but not ended)
    // Excludes: past assignments (already ended)
    const taskAssignments = assignments.filter((a: EquipmentAssignment) => {
      if (!a.notes?.startsWith(taskNotePrefix)) return false;

      const endTime = a.endTime ? new Date(a.endTime) : null;

      // Show if not ended yet (endTime is null or in the future)
      const notEnded = endTime === null || endTime > now;

      return notEnded;
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
    const now = new Date();

    // Filter assignments for this task that are not yet ended (includes future assignments)
    const taskAssignments = assignments.filter((a: EquipmentAssignment) => {
      if (!a.notes?.startsWith(taskNotePrefix)) return false;

      const endTime = a.endTime ? new Date(a.endTime) : null;

      // Show if not ended yet (endTime is null or in the future)
      const notEnded = endTime === null || endTime > now;

      return notEnded;
    });

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
        // Find users who already have active equipment assignments for this task
        const taskNotePrefix = `Tarea: ${task?.title}`;
        const now = new Date();
        const usersWithActiveEquipment = new Set<string>();

        if (assignmentsData?.data) {
          assignmentsData.data.forEach((a: EquipmentAssignment) => {
            if (!a.notes?.startsWith(taskNotePrefix) || !a.user) return;

            const endTime = a.endTime ? new Date(a.endTime) : null;
            const notEnded = endTime === null || endTime > now;

            // Include users with active or future assignments (anything not ended)
            if (notEnded) {
              usersWithActiveEquipment.add(a.user.id);
            }
          });
        }

        // Only release equipment for users who actually have active assignments
        for (const userId of Object.keys(equipmentAssignments)) {
          if (usersWithActiveEquipment.has(userId)) {
            try {
              await taskService.releaseEquipment(taskId!, userId);
            } catch {
              // Ignore error if release fails
            }
          }
        }

        // Small delay to ensure release is processed (only if we released something)
        if (usersWithActiveEquipment.size > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

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
    onMutate: async (newStatus) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId] });

      // Snapshot previous value
      const previousTask = queryClient.getQueryData(['tasks', taskId]);

      // Optimistically update
      queryClient.setQueryData(['tasks', taskId], (old: typeof task) => {
        if (!old) return old;
        return { ...old, status: newStatus };
      });

      return { previousTask };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(['tasks', taskId], context.previousTask);
      }
    },
    onSettled: () => {
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
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId, 'comments'] });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData(['tasks', taskId, 'comments']);

      // Optimistically add comment
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content: newComment,
        createdAt: new Date().toISOString(),
        userId: user?.id,
        user: {
          id: user?.id,
          name: user?.name || '',
          email: user?.email || '',
          profileImage: user?.profileImage,
        },
      };

      queryClient.setQueryData(['tasks', taskId, 'comments'], (old: CommentWithUser[] | undefined) => {
        return old ? [...old, optimisticComment] : [optimisticComment];
      });

      // Clear input immediately for better UX
      setNewComment('');

      return { previousComments };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(['tasks', taskId, 'comments'], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentService.delete(commentId),
    onMutate: async (commentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId, 'comments'] });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData(['tasks', taskId, 'comments']);

      // Optimistically remove comment
      queryClient.setQueryData(['tasks', taskId, 'comments'], (old: CommentWithUser[] | undefined) => {
        return old ? old.filter((c) => c.id !== commentId) : [];
      });

      return { previousComments };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(['tasks', taskId, 'comments'], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] });
    },
  });

  const removeAssigneeMutation = useMutation({
    mutationFn: (userId: string) => taskService.removeAssignee(taskId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
    },
  });

  const replaceAssigneeMutation = useMutation({
    mutationFn: ({ oldUserId, newUserId }: { oldUserId: string; newUserId: string }) =>
      taskService.replaceAssignee(taskId!, oldUserId, newUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      setReplacingUserId(null);
    },
  });

  // Equipment-only mutations (for equipment distribution section)
  const releaseEquipmentMutation = useMutation({
    mutationFn: (userId: string) => taskService.releaseEquipment(taskId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
    },
  });

  const transferEquipmentMutation = useMutation({
    mutationFn: ({ fromUserId, toUserId }: { fromUserId: string; toUserId: string }) =>
      taskService.transferEquipment(taskId!, fromUserId, toUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      setReplacingUserId(null);
    },
  });

  const handleRemoveAssignee = (userId: string, userName: string) => {
    if (window.confirm(`¿Quitar a ${userName} de esta tarea? Se liberará el equipo asignado.`)) {
      removeAssigneeMutation.mutate(userId);
    }
  };

  const handleReplaceAssignee = (oldUserId: string, newUserId: string) => {
    replaceAssigneeMutation.mutate({ oldUserId, newUserId });
  };

  const handleReleaseEquipment = (userId: string, userName: string) => {
    if (window.confirm(`¿Liberar el equipo asignado a ${userName}?`)) {
      releaseEquipmentMutation.mutate(userId);
    }
  };

  const handleTransferEquipment = (fromUserId: string, toUserId: string) => {
    transferEquipmentMutation.mutate({ fromUserId, toUserId });
  };

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
    setIsExportModalOpen(false);
    setReplacingUserId(null);
    onClose();
  };

  const handleExport = async () => {
    if (!exportRef.current || !task) return;

    setIsExporting(true);
    try {
      await exportTaskToImage(exportRef.current, task.title);
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Error exporting task:', error);
      alert('Error al exportar la imagen. Por favor intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
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
      <Modal isOpen={isOpen} onClose={handleClose} title="Editar Tarea" size="2xl">
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
  <>
    <Modal isOpen={isOpen} onClose={handleClose} title="Detalle de Tarea" size="2xl">
      {isLoadingTask ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : task ? (
        <div className="p-6 space-y-4">
          {/* 1. Header */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExportModalOpen(true)}
                title="Exportar como PNG"
              >
                <Download className="h-4 w-4" />
              </Button>
              {isAdminOrSupervisor && (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* 2. Estado y Prioridad */}
          <div className="flex flex-wrap items-center gap-4">
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

          {/* 3. Sección de Fechas */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4" />
              Fechas
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Fecha límite</p>
                <p className="mt-1 font-medium text-gray-900">{formatDateShort(task.dueDate)}</p>
              </div>
              {task.executionDate && (
                <div>
                  <p className="text-xs text-gray-500">Fecha de ejecución</p>
                  <p className="mt-1 font-medium text-gray-900">{formatDateShort(task.executionDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Sección de Horario */}
          {task.shift && (task.morningStartTime || task.afternoonStartTime) && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="h-4 w-4" />
                Horario
              </h3>
              <div className="mt-3 space-y-2">
                {(task.shift === 'morning' || task.shift === 'both') && task.morningStartTime && task.morningEndTime && (
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-gray-700">
                      Mañana: <strong>{task.morningStartTime} - {task.morningEndTime}</strong>
                    </span>
                  </div>
                )}
                {(task.shift === 'afternoon' || task.shift === 'both') && task.afternoonStartTime && task.afternoonEndTime && (
                  <div className="flex items-center gap-2">
                    <Sunset className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-700">
                      Tarde: <strong>{task.afternoonStartTime} - {task.afternoonEndTime}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Sección de Descripción */}
          {task.description && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4" />
                Descripción
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{task.description}</p>
            </div>
          )}

          {/* 6. Sección de Requisitos del Cliente */}
          {task.clientRequirements && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <ClipboardList className="h-4 w-4" />
                Requisitos del Cliente
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-amber-700">
                {task.clientRequirements}
              </p>
            </div>
          )}

          {/* 7. Sección de Checklist */}
          <TaskChecklist
            taskId={task.id}
            items={task.checklistItems || []}
            readOnly={false}
          />

          {/* 8. Sección de Archivos Adjuntos */}
          <AttachmentsList
            attachments={task.attachments || []}
            taskId={task.id}
            queryKey={['tasks', task.id]}
          />

          {/* 9. Sección de Distribución de Equipos */}
          {equipmentByUserAndShift.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Camera className="h-4 w-4" />
                Distribución de Equipos
              </h3>
              <div className="mt-3 space-y-4">
                {equipmentByUserAndShift.map((userEquipment) => (
                  <div
                    key={userEquipment.userId}
                    className="rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <p className="font-medium text-gray-900">{userEquipment.userName}</p>
                      </div>
                      {isAdminOrSupervisor && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setReplacingUserId(
                              replacingUserId === `eq_${userEquipment.userId}` ? null : `eq_${userEquipment.userId}`
                            )}
                            className={`rounded-full p-1.5 transition-colors ${
                              replacingUserId === `eq_${userEquipment.userId}`
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                            title="Transferir equipo a otra persona"
                            disabled={transferEquipmentMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReleaseEquipment(userEquipment.userId, userEquipment.userName)}
                            className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Liberar equipo"
                            disabled={releaseEquipmentMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Dropdown para seleccionar reemplazo de equipo */}
                    {replacingUserId === `eq_${userEquipment.userId}` && usersData?.data && (
                      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs text-blue-700 mb-2">Transferir equipo a:</p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {usersData.data
                            .filter((u) => u.id !== userEquipment.userId)
                            .map((u) => (
                              <button
                                key={u.id}
                                onClick={() => handleTransferEquipment(userEquipment.userId, u.id)}
                                disabled={transferEquipmentMutation.isPending}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-blue-100 transition-colors disabled:opacity-50"
                              >
                                <Avatar name={u.name} profileImage={u.profileImage} size="xs" />
                                <span className="text-gray-700">{u.name}</span>
                              </button>
                            ))}
                        </div>
                        <button
                          onClick={() => setReplacingUserId(null)}
                          className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}

                    {/* Morning Shift Equipment */}
                    {userEquipment.shifts.morning.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Sun className="h-4 w-4 text-amber-500" />
                          <span className="text-gray-600">
                            Mañana {userEquipment.morningTimeRange && `(${userEquipment.morningTimeRange})`}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {userEquipment.shifts.morning.map((eq) => {
                            const config = categoryConfig[eq.category];
                            return (
                              <span
                                key={eq.id}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
                              >
                                {config.label}: {eq.name}
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
                          <span className="text-gray-600">
                            Tarde {userEquipment.afternoonTimeRange && `(${userEquipment.afternoonTimeRange})`}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {userEquipment.shifts.afternoon.map((eq) => {
                            const config = categoryConfig[eq.category];
                            return (
                              <span
                                key={eq.id}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
                              >
                                {config.label}: {eq.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {isAdminOrSupervisor && (
                <p className="mt-3 text-xs text-gray-500">
                  <RefreshCw className="inline h-3 w-3 mr-1" />Transferir mueve el equipo a otro usuario
                </p>
              )}
            </div>
          )}

          {/* 10. Sección de Personas Asignadas */}
          {task.assignees && task.assignees.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users className="h-4 w-4" />
                Asignados
              </h3>
              <div className="mt-3 space-y-2">
                {task.assignees.map((assignee) => (
                  <div key={assignee.user.id}>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 items-center gap-2 rounded-full bg-white border border-gray-200 py-1 pl-1 pr-3">
                        <Avatar name={assignee.user.name} profileImage={assignee.user.profileImage} size="sm" />
                        <span className="text-sm text-gray-700">{assignee.user.name}</span>
                      </div>
                      {isAdminOrSupervisor && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setReplacingUserId(
                              replacingUserId === assignee.user.id ? null : assignee.user.id
                            )}
                            className={`rounded-full p-1.5 transition-colors ${
                              replacingUserId === assignee.user.id
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                            title="Reemplazar (conserva equipo)"
                            disabled={replaceAssigneeMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveAssignee(assignee.user.id, assignee.user.name)}
                            className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Quitar (libera equipo)"
                            disabled={removeAssigneeMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Dropdown para seleccionar reemplazo */}
                    {replacingUserId === assignee.user.id && usersData?.data && (
                      <div className="mt-2 ml-8 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs text-blue-700 mb-2">Selecciona el reemplazo:</p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {usersData.data
                            .filter((u) => !task.assignees?.some((a) => a.user.id === u.id))
                            .map((u) => (
                              <button
                                key={u.id}
                                onClick={() => handleReplaceAssignee(assignee.user.id, u.id)}
                                disabled={replaceAssigneeMutation.isPending}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-blue-100 transition-colors disabled:opacity-50"
                              >
                                <Avatar name={u.name} profileImage={u.profileImage} size="xs" />
                                <span className="text-gray-700">{u.name}</span>
                              </button>
                            ))}
                        </div>
                        <button
                          onClick={() => setReplacingUserId(null)}
                          className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {isAdminOrSupervisor && (
                <p className="mt-3 text-xs text-gray-500">
                  <RefreshCw className="inline h-3 w-3 mr-1" />Reemplazar transfiere el equipo asignado
                </p>
              )}
            </div>
          )}

          {/* 11. Comments Section */}
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
                    <Avatar name={comment.user.name} profileImage={comment.user.profileImage} size="sm" />
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

    {/* Export Preview Modal */}
    <Modal
      isOpen={isExportModalOpen}
      onClose={() => setIsExportModalOpen(false)}
      title="Exportar Tarea como Imagen"
      size="lg"
    >
      <div className="p-4">
        <p className="mb-4 text-sm text-gray-600">
          Vista previa de la imagen que se generará:
        </p>

        {/* Preview container with scroll */}
        <div className="mb-4 max-h-[60vh] overflow-auto rounded-lg border border-gray-200 bg-gray-100 p-4">
          {task && (
            <TaskExportView
              ref={exportRef}
              task={task}
              equipmentByUser={equipmentByUserAndShift}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsExportModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            isLoading={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar PNG
          </Button>
        </div>
      </div>
    </Modal>
  </>
  );
}
