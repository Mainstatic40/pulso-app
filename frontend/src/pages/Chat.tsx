import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { ConversationList, ChatWindow, NewConversationModal } from '../components/chat';
import { conversationService } from '../services/conversation.service';
import type { Conversation } from '../types';

export function Chat() {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);

  // Fetch conversations with polling
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationService.getAll,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Get selected conversation data
  const selectedConversation = conversations.find(
    (c: Conversation) => c.id === selectedConversationId
  );

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: (userId: string) => conversationService.create({ userId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversationId(data.id);
      setIsNewConversationOpen(false);
    },
  });

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleBack = () => {
    setSelectedConversationId(null);
  };

  const handleNewConversation = () => {
    setIsNewConversationOpen(true);
  };

  const handleCreateConversation = (userId: string) => {
    createConversationMutation.mutate(userId);
  };

  return (
    <div className="flex h-[calc(100vh-4rem-3rem)] overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Conversation List - Hidden on mobile when chat is open */}
      <div
        className={`w-full border-r border-gray-200 lg:w-80 lg:flex-shrink-0 ${
          selectedConversationId ? 'hidden lg:block' : 'block'
        }`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isLoading={isLoading}
        />
      </div>

      {/* Chat Window */}
      <div
        className={`flex-1 ${
          selectedConversationId ? 'block' : 'hidden lg:block'
        }`}
      >
        {selectedConversation ? (
          <ChatWindow conversation={selectedConversation} onBack={handleBack} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-gray-50 text-gray-500">
            <MessageSquare className="mb-4 h-16 w-16 text-gray-300" />
            <p className="text-lg font-medium">Selecciona una conversación</p>
            <p className="text-sm">o inicia una nueva para comenzar a chatear</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isNewConversationOpen}
        onClose={() => setIsNewConversationOpen(false)}
        onCreateConversation={handleCreateConversation}
        isCreating={createConversationMutation.isPending}
      />
    </div>
  );
}
