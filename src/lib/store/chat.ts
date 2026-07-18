import { create } from "zustand";
import type { Message } from "../api/messages";

/* ─── UI-only state (messages → React Query infinite query) */

interface ChatState {
  composingMessage: string;
  replyTo: Message | null;
  editingMessage: Message | null;
  typingUsers: Record<string, { username: string; timestamp: number }>;

  setComposingMessage: (text: string) => void;
  setReplyTo: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
  setTyping: (
    roomId: string,
    userId: string,
    username: string,
    isTyping: boolean,
  ) => void;
  clearComposer: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  composingMessage: "",
  replyTo: null,
  editingMessage: null,
  typingUsers: {},

  setComposingMessage: (text) => {
    set({ composingMessage: text });
  },

  setReplyTo: (message) => {
    set({ replyTo: message });
  },

  setEditingMessage: (message) => {
    set({ editingMessage: message, composingMessage: message?.content ?? "" });
  },

  setTyping: (roomId, userId, username, isTyping) => {
    set((state) => {
      const key = `${roomId}:${userId}`;
      const typing = { ...state.typingUsers };

      if (isTyping) {
        typing[key] = { username, timestamp: Date.now() };
      } else {
        delete typing[key];
      }

      // Auto-clean entries older than 5s
      const now = Date.now();
      for (const k of Object.keys(typing)) {
        if (now - typing[k].timestamp > 5000) {
          delete typing[k];
        }
      }

      return { typingUsers: typing };
    });
  },

  clearComposer: () => {
    set({ composingMessage: "", replyTo: null, editingMessage: null });
  },
}));
