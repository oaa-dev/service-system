'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useMessages, useSendMessage, useMarkAsRead } from '@/hooks/useConversation';
import { getEcho } from '@/lib/echo';
import type { Message } from '@/types/api';

export interface ChatPanelProps {
  type: 'bookings' | 'reservations' | 'orders';
  id: number;
}

export function ChatPanel({ type, id }: ChatPanelProps) {
  const { data, isLoading } = useMessages(type, id);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead(type, id);

  // Local messages state — seeded from query, appended by Echo events.
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Seed local messages whenever the query data updates (polling refresh).
  useEffect(() => {
    if (data?.messages?.data) {
      setLocalMessages(data.messages.data);
    }
  }, [data]);

  // Scroll to the bottom whenever messages change.
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, scrollToBottom]);

  // Mark as read on initial mount once conversation data is available.
  useEffect(() => {
    if (data?.conversation?.id) {
      markAsRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.conversation?.id]);

  // Real-time Echo subscription (active only when laravel-echo + pusher-js are installed).
  useEffect(() => {
    const conversationId = data?.conversation?.id;
    if (!conversationId) return;

    const echo = getEcho();
    if (!echo) {
      // Echo not available — polling via refetchInterval handles updates.
      return;
    }

    // When Echo IS available (after installing laravel-echo + pusher-js):
    // Subscribe to the private conversation channel and append new messages.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const echoAny = echo as any;
    const channel = echoAny
      .private(`conversation.${conversationId}`)
      .listen('ChatMessageSent', (event: Message) => {
        setLocalMessages((prev) => {
          // Avoid duplicates if both polling and Echo deliver the same message.
          const exists = prev.some((m) => m.id === event.id);
          if (exists) return prev;
          return [...prev, event];
        });
        scrollToBottom();
      });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return () => {
      channel.stopListening('ChatMessageSent');
      echoAny.leave(`conversation.${conversationId}`);
    };
  }, [data?.conversation?.id, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const body = inputValue.trim();
    if (!body) return;

    setInputValue('');

    try {
      const newMessage = await sendMessage.mutateAsync({ type, id, body });
      setLocalMessages((prev) => {
        const exists = prev.some((m) => m.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
    } catch {
      // Restore input on failure so the user can retry.
      setInputValue(body);
    }
  }, [inputValue, sendMessage, type, id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex flex-col border rounded-xl overflow-hidden bg-background shadow-xs">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/40">
        <p className="text-sm font-semibold">Chat with Merchant</p>
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-2 overflow-y-auto max-h-[300px] px-4 py-3"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading messages...
          </div>
        ) : localMessages.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          localMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/20">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 h-9 rounded-full"
          disabled={sendMessage.isPending}
        />
        <Button
          size="icon"
          className="rounded-full shrink-0"
          onClick={handleSend}
          disabled={sendMessage.isPending || !inputValue.trim()}
          aria-label="Send message"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isMine = message.is_mine;
  const timestamp = format(new Date(message.created_at), 'HH:mm');

  return (
    <div
      className={cn('flex flex-col gap-0.5 max-w-[75%]', {
        'self-end items-end': isMine,
        'self-start items-start': !isMine,
      })}
    >
      {!isMine && message.sender && (
        <span className="text-xs text-muted-foreground px-1">
          {message.sender.name}
        </span>
      )}
      <div
        className={cn('rounded-2xl px-3 py-2 text-sm leading-relaxed break-words', {
          'bg-primary text-primary-foreground rounded-br-sm': isMine,
          'bg-muted text-foreground rounded-bl-sm': !isMine,
        })}
      >
        {message.body}
      </div>
      <span className="text-[10px] text-muted-foreground px-1">{timestamp}</span>
    </div>
  );
}
