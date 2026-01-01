import { Plus, MessageSquare } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '../../types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  isLoading,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Mensajes</h2>
        <button
          type="button"
          onClick={onNewConversation}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
          title="Nueva conversación"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <MessageSquare className="mb-2 h-12 w-12 text-gray-300" />
            <p className="text-sm">No hay conversaciones</p>
            <button
              type="button"
              onClick={onNewConversation}
              className="mt-2 text-sm text-red-600 hover:text-red-700"
            >
              Iniciar una nueva
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedId}
                onClick={() => onSelect(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
