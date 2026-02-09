'use client';

import { useState } from 'react';
import { Search, Plus, MessageSquare } from 'lucide-react';
import { useMessagingStore } from '@/stores/messagingStore';
import { useConversations } from '@/hooks/useMessaging';
import { ConversationItem } from './conversation-item';
import { NewConversationDialog } from './new-conversation-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export function ConversationList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { isLoading } = useConversations();
  const { conversations, activeConversationId, setActiveConversation } = useMessagingStore();

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button size="icon" variant="ghost" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1"
                  onClick={() => setShowNewDialog(true)}
                >
                  Start a new conversation
                </Button>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversationId === conversation.id}
                onClick={() => setActiveConversation(conversation.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <NewConversationDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  );
}
