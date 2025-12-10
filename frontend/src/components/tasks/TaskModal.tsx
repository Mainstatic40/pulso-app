import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, User, FileText, MessageSquare, Trash2, Edit2, Send } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { statusOptions } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskForm } from './TaskForm';
import { taskService, type UpdateTaskRequest } from '../../services/task.service';
import { commentService, type CommentWithUser } from '../../services/comment.service';
import { useAuthContext } from '../../stores/auth.store.tsx';
import type { TaskStatus } from '../../types';

interface TaskModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-MX', {
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

  const updateTaskMutation = useMutation({
    mutationFn: (data: UpdateTaskRequest) => taskService.update(taskId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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

  if (isEditing && task) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Editar Tarea" size="lg">
        <TaskForm
          task={task}
          onSubmit={(data) => updateTaskMutation.mutate(data)}
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

          {/* Due Date */}
          <div className="mt-6 flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              Fecha límite: <strong>{formatDate(task.dueDate)}</strong>
            </span>
          </div>

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
