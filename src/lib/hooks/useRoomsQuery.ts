import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import * as roomsApi from "../api/rooms";
import { useAuthStore } from "../store/auth";

// ── Keys ──

export const roomKeys = {
  all: ["rooms"] as const,
  detail: (id: string) => ["rooms", id] as const,
  members: (id: string) => ["rooms", id, "members"] as const,
  direct: ["rooms", "direct"] as const,
};

// ── Queries ──

export function useRooms() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: roomKeys.all,
    queryFn: () => roomsApi.getRooms(),
    enabled: !!token,
  });
}

export function useRoom(roomId: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: roomKeys.detail(roomId),
    queryFn: () => roomsApi.getRoom(roomId),
    enabled: !!roomId && !!token,
  });
}

export function useDirectRooms() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: roomKeys.direct,
    queryFn: () => roomsApi.getDirectRooms(),
    enabled: !!token,
  });
}

export function useRoomMembers(roomId: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: roomKeys.members(roomId),
    queryFn: () => roomsApi.getMembers(roomId),
    enabled: !!roomId && !!token,
  });
}

// ── Mutations ──

export function useCreateRoom() {
  return useMutation({
    mutationFn: (payload: roomsApi.CreateRoomPayload) => roomsApi.createRoom(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
      queryClient.invalidateQueries({ queryKey: roomKeys.direct });
    },
  });
}

export function useJoinRoom() {
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.joinRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
  });
}

export function useLeaveRoom() {
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.leaveRoom(roomId),
    onSuccess: (_data, roomId) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
    },
  });
}
