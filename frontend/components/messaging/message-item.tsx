'use client';

import { Message } from '@/types/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  showAvatar?: boolean;
}

export function MessageItem({ message, showAvatar = true }: MessageItemProps) {
  const { sender, body, is_mine, read_at, created_at } = message;

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'flex gap-2 max-w-[80%]',
        is_mine ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {showAvatar && !is_mine && sender && (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarImage src={sender.avatar?.thumb} alt={sender.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(sender.name)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'rounded-2xl px-4 py-2',
          is_mine
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{body}</p>
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            is_mine ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-xs',
              is_mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {formatTime(created_at)}
          </span>
          {is_mine && (
            read_at ? (
              <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/70" />
            ) : (
              <Check className="h-3.5 w-3.5 text-primary-foreground/70" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
