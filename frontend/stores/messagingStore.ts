import { create } from 'zustand';
import { Conversation, Message } from '@/types/api';

interface MessagingState {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Record<number, Message[]>;
  unreadCount: number;

  // Conversation actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: number, updates: Partial<Conversation>) => void;
  removeConversation: (conversationId: number) => void;
  setActiveConversation: (conversationId: number | null) => void;

  // Message actions
  setMessages: (conversationId: number, messages: Message[]) => void;
  addMessage: (conversationId: number, message: Message) => void;
  prependMessages: (conversationId: number, messages: Message[]) => void;
  removeMessage: (conversationId: number, messageId: number) => void;

  // Unread count actions
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount?: number) => void;

  // Mark as read
  markConversationAsRead: (conversationId: number) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  unreadCount: 0,
};

export const useMessagingStore = create<MessagingState>()((set) => ({
  ...initialState,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => {
      // Check if conversation already exists
      const exists = state.conversations.some((c) => c.id === conversation.id);
      if (exists) {
        return {
          conversations: state.conversations.map((c) =>
            c.id === conversation.id ? conversation : c
          ),
        };
      }
      return {
        conversations: [conversation, ...state.conversations],
      };
    }),

  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, ...updates } : c
      ),
    })),

  removeConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([id]) => Number(id) !== conversationId)
      ),
      activeConversationId:
        state.activeConversationId === conversationId ? null : state.activeConversationId,
    })),

  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      // Check if message already exists
      if (existingMessages.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, message],
        },
      };
    }),

  prependMessages: (conversationId, messages) =>
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      const existingIds = new Set(existingMessages.map((m) => m.id));
      const newMessages = messages.filter((m) => !existingIds.has(m.id));
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...newMessages, ...existingMessages],
        },
      };
    }),

  removeMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (m) => m.id !== messageId
        ),
      },
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnreadCount: (amount = 1) =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - amount) })),

  markConversationAsRead: (conversationId) =>
    set((state) => {
      const conversation = state.conversations.find((c) => c.id === conversationId);
      const unreadCount = conversation?.unread_count || 0;

      return {
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        ),
        unreadCount: Math.max(0, state.unreadCount - unreadCount),
      };
    }),

  reset: () => set(initialState),
}));
