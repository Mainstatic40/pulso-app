import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, MessageSquare, Calendar, ClipboardList, X } from 'lucide-react';
import { notificationService } from '../../services/notification.service';
import type { Notification } from '../../types';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'task_assigned':
    case 'task_review':
    case 'task_comment':
      return <ClipboardList className="h-4 w-4" />;
    case 'event_assigned':
      return <Calendar className="h-4 w-4" />;
    case 'message':
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'task_assigned':
      return 'bg-blue-100 text-blue-600';
    case 'task_review':
      return 'bg-yellow-100 text-yellow-600';
    case 'task_comment':
      return 'bg-purple-100 text-purple-600';
    case 'event_assigned':
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function NotificationDropdown() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll({ limit: 10 }),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notificationUnreadCount'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.unreadCount || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: notificationService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to link if exists
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                      !notification.isRead ? 'bg-red-50/50' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <span className="flex-shrink-0 text-xs text-gray-400">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-gray-500">
                        {notification.message}
                      </p>
                    </div>

                    {/* Unread indicator / Actions */}
                    <div className="flex flex-shrink-0 items-center gap-1">
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-red-600" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="hidden rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 group-hover:block"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
