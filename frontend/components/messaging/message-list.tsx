'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useMessagingStore } from '@/stores/messagingStore';
import { useMessages, useMarkConversationAsRead } from '@/hooks/useMessaging';
import { MessageItem } from './message-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface MessageListProps {
  conversationId: number;
}

export function MessageList({ conversationId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
  const { messages } = useMessagingStore();
  const markAsRead = useMarkConversationAsRead();

  const conversationMessages = messages[conversationId] || [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages.length]);

  // Mark conversation as read when viewing
  useEffect(() => {
    if (conversationId && conversationMessages.length > 0) {
      markAsRead.mutate(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversationMessages.length]);

  // Group messages by date
  const groupedMessages = conversationMessages.reduce((groups, message) => {
    const date = new Date(message.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof conversationMessages>);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex gap-2 ${i % 2 === 0 ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
            {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-64'} rounded-2xl`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="p-4 space-y-4">
        {/* Load more button */}
        {hasNextPage && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load older messages'
              )}
            </Button>
          </div>
        )}

        {/* Messages grouped by date */}
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center justify-center my-4">
              <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border">
                {date}
              </span>
            </div>
            <div className="space-y-2">
              {msgs.map((message, index) => {
                // Show avatar only for first message in a sequence from same sender
                const prevMessage = msgs[index - 1];
                const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;

                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    showAvatar={showAvatar}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {conversationMessages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
