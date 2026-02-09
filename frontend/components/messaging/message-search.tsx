'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchMessages } from '@/hooks/useMessaging';
import { useMessagingStore } from '@/stores/messagingStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime, truncate } from '@/lib/utils';

interface MessageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessageSearch({ open, onOpenChange }: MessageSearchProps) {
  const [query, setQuery] = useState('');
  const { setActiveConversation } = useMessagingStore();

  const { data, isLoading, isFetching } = useSearchMessages(
    query.length >= 2 ? { q: query } : null
  );

  const messages = data?.data || [];

  const handleSelectMessage = (conversationId: number) => {
    setActiveConversation(conversationId);
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="h-[400px]">
            {query.length < 2 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">Type at least 2 characters to search</p>
              </div>
            ) : isLoading || isFetching ? (
              <div className="space-y-3 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 border rounded-lg space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">No messages found</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {messages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleSelectMessage(message.conversation_id)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {message.sender?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {highlightMatch(message.body, query)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function highlightMatch(text: string, query: string) {
  const truncatedText = truncate(text, 100);
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = truncatedText.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
