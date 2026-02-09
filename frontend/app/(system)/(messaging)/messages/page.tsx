'use client';

import { useState } from 'react';
import { Search, MoreVertical, Trash2, MessageSquare } from 'lucide-react';
import { useMessagingStore } from '@/stores/messagingStore';
import { useConversations, useDeleteConversation, useRealtimeMessaging } from '@/hooks/useMessaging';
import { ConversationList } from '@/components/messaging/conversation-list';
import { MessageList } from '@/components/messaging/message-list';
import { MessageInput } from '@/components/messaging/message-input';
import { MessageSearch } from '@/components/messaging/message-search';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getInitials } from '@/lib/utils';

export default function MessagesPage() {
  const [showSearch, setShowSearch] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { conversations, activeConversationId, setActiveConversation } = useMessagingStore();
  const deleteConversation = useDeleteConversation();

  // Setup real-time messaging
  useRealtimeMessaging();

  // Fetch conversations
  useConversations();

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleDeleteConversation = () => {
    if (activeConversationId) {
      deleteConversation.mutate(activeConversationId, {
        onSuccess: () => {
          setShowDeleteDialog(false);
        },
      });
    }
  };

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
                  <AvatarImage
                    src={activeConversation.other_user.avatar?.thumb}
                    alt={activeConversation.other_user.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(activeConversation.other_user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{activeConversation.other_user.name}</h2>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
                  <Search className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

      {/* Search Dialog */}
      <MessageSearch open={showSearch} onOpenChange={setShowSearch} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the conversation from your list. The other person will still be able
              to see the conversation history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
