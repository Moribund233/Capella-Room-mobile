import { create } from "zustand";
import type { Room, RoomMember } from "../api/rooms";
import type { OnlineUser } from "../ws/types";

/* ─── UI-only state (server data → React Query) ───────── */

interface RoomState {
  currentRoom: Room | null;
  members: RoomMember[];
  onlineUsers: Record<string, OnlineUser[]>;

  setCurrentRoom: (room: Room | null) => void;
  clearCurrentRoom: () => void;
  setOnlineUsers: (roomId: string, users: OnlineUser[]) => void;
  updateRoomSummary: (
    roomId: string,
    summary: { last_message: { id: string; content: string; sender_name: string; created_at: string }; unread_count: number },
  ) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  members: [],
  onlineUsers: {},

  setCurrentRoom: (room) => {
    set({ currentRoom: room });
  },

  clearCurrentRoom: () => {
    set({ currentRoom: null, members: [], onlineUsers: {} });
  },

  setOnlineUsers: (roomId, users) => {
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [roomId]: users },
    }));
  },

  updateRoomSummary: (roomId, summary) => {
    // Updates the React Query cache directly for room list reactivity
    // This is called by WS hooks; the cache update is handled there
    // Here we keep it as a passthrough for component convenience
    set((state) => ({
      onlineUsers: { ...state.onlineUsers },
    }));
  },
}));
