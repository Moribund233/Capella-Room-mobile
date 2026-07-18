import { create } from "zustand";

/* ─── UI-only state (friends data → React Query) ──────── */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface FriendState {
  // Currently empty — all friend data is fetched via React Query hooks.
  // Add UI-only state here in the future (e.g. selected friend filter).
}

export const useFriendStore = create<FriendState>(() => ({}));
