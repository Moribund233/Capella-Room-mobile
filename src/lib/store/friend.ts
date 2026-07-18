import { create } from "zustand";

/* ─── UI-only state for the friends feature ───────────────── */

interface FriendState {
  selectedUserId: string | null;
  activeRequestTab: "received" | "sent";

  setSelectedUserId: (id: string | null) => void;
  setActiveRequestTab: (tab: "received" | "sent") => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  selectedUserId: null,
  activeRequestTab: "received",

  setSelectedUserId: (id) => {
    set({ selectedUserId: id });
  },

  setActiveRequestTab: (tab) => {
    set({ activeRequestTab: tab });
  },
}));
