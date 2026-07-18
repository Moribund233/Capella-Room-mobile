import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import * as usersApi from "../api/users";
import { useAuthStore } from "../store/auth";

/* ─── Query Keys ─────────────────────────────────────────────── */

export const settingsKeys = {
  all: ["settings"] as const,
  roomAll: ["settings", "rooms"] as const,
  room: (roomId: string) => ["settings", "rooms", roomId] as const,
};

/* ─── Queries ────────────────────────────────────────────────── */

export function useSettings() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => usersApi.getSettings(),
    enabled: !!token,
  });
}

export function useAllRoomSettings() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: settingsKeys.roomAll,
    queryFn: () => usersApi.getAllRoomSettings(),
    enabled: !!token,
  });
}

export function useRoomSettings(roomId: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: settingsKeys.room(roomId),
    queryFn: () => usersApi.getRoomSettings(roomId),
    enabled: !!roomId && !!token,
  });
}

/* ─── Mutations ──────────────────────────────────────────────── */

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (settings: Partial<usersApi.UserSettings>) =>
      usersApi.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useUpdateRoomSettings() {
  return useMutation({
    mutationFn: ({
      roomId,
      settings,
    }: {
      roomId: string;
      settings: Partial<
        Omit<usersApi.UserRoomSettings, "room_id" | "created_at" | "updated_at">
      >;
    }) => usersApi.updateRoomSettings(roomId, settings),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.room(roomId) });
      queryClient.invalidateQueries({ queryKey: settingsKeys.roomAll });
    },
  });
}

export function useResetRoomSettings() {
  return useMutation({
    mutationFn: (roomId: string) => usersApi.resetRoomSettings(roomId),
    onSuccess: (_data, roomId) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.room(roomId) });
      queryClient.invalidateQueries({ queryKey: settingsKeys.roomAll });
    },
  });
}
