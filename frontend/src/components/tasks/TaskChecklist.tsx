import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Square, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { taskService } from '../../services/task.service';
import type { TaskChecklistItem } from '../../types';

interface TaskChecklistProps {
  taskId: string;
  items: TaskChecklistItem[];
  readOnly?: boolean;
}

export function TaskChecklist({ taskId, items, readOnly = false }: TaskChecklistProps) {
  const queryClient = useQueryClient();
  const [newItemContent, setNewItemContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const addItemMutation = useMutation({
    mutationFn: (content: string) => taskService.addChecklistItem(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      setNewItemContent('');
      inputRef.current?.focus();
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: { content?: string; isCompleted?: boolean } }) =>
      taskService.updateChecklistItem(taskId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      setEditingId(null);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => taskService.deleteChecklistItem(taskId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (itemIds: string[]) => taskService.reorderChecklistItems(taskId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemContent.trim()) {
      addItemMutation.mutate(newItemContent.trim());
    }
  };

  const handleToggleComplete = (item: TaskChecklistItem) => {
    updateItemMutation.mutate({
      itemId: item.id,
      data: { isCompleted: !item.isCompleted },
    });
  };

  const handleStartEdit = (item: TaskChecklistItem) => {
    setEditingId(item.id);
    setEditingContent(item.content);
  };

  const handleSaveEdit = (itemId: string) => {
    if (editingContent.trim() && editingContent !== items.find(i => i.id === itemId)?.content) {
      updateItemMutation.mutate({
        itemId,
        data: { content: editingContent.trim() },
      });
    } else {
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(itemId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDelete = (itemId: string) => {
    deleteItemMutation.mutate(itemId);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedId(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (draggedId !== itemId) {
      setDragOverId(itemId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const currentOrder = items.map(item => item.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged item and insert at target position
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    reorderMutation.mutate(newOrder);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const completedCount = items.filter(item => item.isCompleted).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <CheckSquare className="h-4 w-4" />
          Checklist
        </h3>
        {totalCount > 0 && (
          <span className="text-xs text-gray-500">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Items list */}
      <div className="mt-3 space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            draggable={!readOnly && !editingId}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={handleDragEnd}
            className={`group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
              draggedId === item.id ? 'opacity-50' : ''
            } ${dragOverId === item.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-white'}`}
          >
            {/* Drag handle */}
            {!readOnly && !editingId && (
              <GripVertical className="h-4 w-4 cursor-grab text-gray-300 opacity-0 group-hover:opacity-100" />
            )}

            {/* Checkbox */}
            <button
              type="button"
              onClick={() => !readOnly && handleToggleComplete(item)}
              disabled={readOnly || updateItemMutation.isPending}
              className="flex-shrink-0"
            >
              {item.isCompleted ? (
                <CheckSquare className="h-5 w-5 text-green-600" />
              ) : (
                <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>

            {/* Content */}
            {editingId === item.id ? (
              <input
                ref={editInputRef}
                type="text"
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                onBlur={() => handleSaveEdit(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                className="flex-1 rounded border border-gray-300 px-2 py-0.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            ) : (
              <span
                onClick={() => !readOnly && handleStartEdit(item)}
                className={`flex-1 text-sm cursor-pointer ${
                  item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'
                }`}
              >
                {item.content}
              </span>
            )}

            {/* Delete button */}
            {!readOnly && !editingId && (
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deleteItemMutation.isPending}
                className="flex-shrink-0 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new item form */}
      {!readOnly && (
        <form onSubmit={handleAddItem} className="mt-3 flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            placeholder="Agregar elemento..."
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newItemContent.trim() || addItemMutation.isPending}
            isLoading={addItemMutation.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Empty state */}
      {items.length === 0 && readOnly && (
        <p className="mt-3 text-center text-sm text-gray-400">Sin elementos</p>
      )}
    </div>
  );
}
