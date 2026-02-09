'use client';

import { Conversation } from '@/types/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeTime, getInitials, truncate } from '@/lib/utils';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const { other_user, latest_message, unread_count, last_message_at } = conversation;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted',
        unread_count > 0 && !isActive && 'bg-muted/50'
      )}
    >
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={other_user.avatar?.thumb} alt={other_user.name} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {getInitials(other_user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('font-medium truncate', unread_count > 0 && 'font-semibold')}>
            {other_user.name}
          </span>
          {last_message_at && (
            <span className="text-xs text-muted-foreground shrink-0">
              {formatRelativeTime(last_message_at)}
            </span>
          )}
        </div>
        {latest_message && (
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p
              className={cn(
                'text-sm truncate',
                unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              {latest_message.is_mine && 'You: '}
              {truncate(latest_message.body, 40)}
            </p>
            {unread_count > 0 && (
              <Badge variant="destructive" className="shrink-0 h-5 min-w-5 px-1.5">
                {unread_count > 99 ? '99+' : unread_count}
              </Badge>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
