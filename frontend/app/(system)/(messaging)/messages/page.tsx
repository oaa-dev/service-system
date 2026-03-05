'use client';

import { MessageSquare } from 'lucide-react';
import { useMessagingStore } from '@/stores/messagingStore';
import { useConversations, useRealtimeMessaging } from '@/hooks/useMessaging';
import { ConversationList } from '@/components/messaging/conversation-list';
import { MessageList } from '@/components/messaging/message-list';
import { MessageInput } from '@/components/messaging/message-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export default function MessagesPage() {
  const { conversations, activeConversationId } = useMessagingStore();

  // Setup real-time messaging for the active conversation
  useRealtimeMessaging(activeConversationId);

  // Fetch conversations
  useConversations();

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const displayName = activeConversation?.other_user?.name ?? 'Unknown';
  const avatarSrc = activeConversation?.other_user?.avatar?.thumb;

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversation List - Fixed width on desktop */}
      <div className="w-full md:w-80 lg:w-96 shrink-0">
        <ConversationList />
      </div>

      {/* Message Area */}
      <div className="hidden md:flex flex-col flex-1 bg-background">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{displayName}</h2>
                  {activeConversation.conversable_label && (
                    <p className="text-xs text-muted-foreground">
                      {activeConversation.conversable_label}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <MessageList conversationId={activeConversationId!} />

            {/* Message Input */}
            <MessageInput conversationId={activeConversationId!} />
          </>
        ) : (
          // No conversation selected
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm mt-1">Choose a conversation from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
