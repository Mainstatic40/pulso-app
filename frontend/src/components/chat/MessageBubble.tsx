import { Avatar } from '../ui/Avatar';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0">
          <Avatar
            name={message.sender?.name || 'Usuario'}
            profileImage={message.sender?.profileImage}
            size="sm"
          />
        </div>
      )}
      {!showAvatar && !isOwn && <div className="w-8" />}

      {/* Message Content */}
      <div className={`flex max-w-[70%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name for group chats */}
        {showAvatar && !isOwn && message.sender && (
          <span className="mb-1 text-xs font-medium text-gray-600">
            {message.sender.name}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'rounded-tr-sm bg-red-600 text-white'
              : 'rounded-tl-sm bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
        </div>

        {/* Attachment if present */}
        {message.attachment && (
          <a
            href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/attachments/${message.attachment.storedName}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 text-xs ${isOwn ? 'text-red-200' : 'text-red-600'} hover:underline`}
          >
            📎 {message.attachment.filename}
          </a>
        )}

        {/* Time */}
        <span className={`mt-1 text-xs ${isOwn ? 'text-gray-400' : 'text-gray-400'}`}>
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
