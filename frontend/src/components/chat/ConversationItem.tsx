import { Users } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuthContext } from '../../stores/auth.store.tsx';
import type { Conversation } from '../../types';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const { user } = useAuthContext();

  // Get the other participant for 1:1 conversations
  const otherParticipant = conversation.isGroup
    ? null
    : conversation.participants.find((p) => p.userId !== user?.id)?.user;

  // Get display name
  const displayName = conversation.isGroup
    ? conversation.name || 'Grupo'
    : otherParticipant?.name || 'Usuario';

  // Get avatar info
  const avatarName = displayName;
  const avatarImage = otherParticipant?.profileImage;

  // Get last message preview
  const lastMessage = conversation.lastMessage;
  const lastMessagePreview = lastMessage
    ? lastMessage.senderId === user?.id
      ? `Tú: ${lastMessage.content}`
      : lastMessage.content
    : 'Sin mensajes';

  const hasUnread = (conversation.unreadCount || 0) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
        isSelected
          ? 'bg-red-50 border-l-2 border-red-600'
          : 'hover:bg-gray-50 border-l-2 border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {conversation.isGroup ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
            <Users className="h-5 w-5 text-gray-600" />
          </div>
        ) : (
          <Avatar name={avatarName} profileImage={avatarImage} size="md" />
        )}
        {/* Online indicator could go here */}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className={`truncate text-sm ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
            {displayName}
          </p>
          {lastMessage && (
            <span className="text-xs text-gray-500">
              {formatTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className={`truncate text-sm ${hasUnread ? 'font-medium text-gray-700' : 'text-gray-500'}`}>
            {lastMessagePreview.length > 40 ? `${lastMessagePreview.slice(0, 40)}...` : lastMessagePreview}
          </p>
          {hasUnread && (
            <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-medium text-white">
              {conversation.unreadCount! > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
