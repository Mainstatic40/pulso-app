import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Avatar } from '../ui/Avatar';
import { conversationService } from '../../services/conversation.service';
import { useAuthContext } from '../../stores/auth.store.tsx';
import type { Conversation } from '../../types';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the other participant for 1:1 conversations
  const otherParticipant = conversation.isGroup
    ? null
    : conversation.participants.find((p) => p.userId !== user?.id)?.user;

  const displayName = conversation.isGroup
    ? conversation.name || 'Grupo'
    : otherParticipant?.name || 'Usuario';

  const avatarImage = otherParticipant?.profileImage;

  // Fetch messages with polling
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => conversationService.getMessages(conversation.id),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => conversationService.sendMessage(conversation.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Mark as read when opening conversation
  useEffect(() => {
    conversationService.markAsRead(conversation.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    });
  }, [conversation.id, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  // Group messages by sender for avatar display optimization
  const shouldShowAvatar = (index: number) => {
    if (index === 0) return true;
    const currentMessage = messages[index];
    const previousMessage = messages[index - 1];
    return currentMessage.senderId !== previousMessage.senderId;
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-200 p-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {conversation.isGroup ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
            <Users className="h-5 w-5 text-gray-600" />
          </div>
        ) : (
          <Avatar name={displayName} profileImage={avatarImage} size="md" />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900">{displayName}</h3>
          {conversation.isGroup && (
            <p className="text-xs text-gray-500">
              {conversation.participants.length} participantes
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <p className="text-sm">No hay mensajes aún</p>
            <p className="text-xs">Sé el primero en enviar un mensaje</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
                showAvatar={shouldShowAvatar(index)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        disabled={sendMessageMutation.isPending}
      />
    </div>
  );
}
