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
  return useQuery({
    queryKey: roomKeys.all,
    queryFn: () => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return roomsApi.getRooms(token);
    },
    enabled: () => !!useAuthStore.getState().accessToken,
  });
}

export function useRoom(roomId: string) {
  return useQuery({
    queryKey: roomKeys.detail(roomId),
    queryFn: () => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return roomsApi.getRoom(token, roomId);
    },
    enabled: () => !!roomId && !!useAuthStore.getState().accessToken,
  });
}

export function useDirectRooms() {
  return useQuery({
    queryKey: roomKeys.direct,
    queryFn: () => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return roomsApi.getDirectRooms(token);
    },
    enabled: () => !!useAuthStore.getState().accessToken,
  });
}

export function useRoomMembers(roomId: string) {
  return useQuery({
    queryKey: roomKeys.members(roomId),
    queryFn: () => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return roomsApi.getMembers(token, roomId);
    },
    enabled: () => !!roomId && !!useAuthStore.getState().accessToken,
  });
}

// ── Mutations ──

export function useCreateRoom() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof roomsApi.createRoom>[1]) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return roomsApi.createRoom(token, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
  });
}

export function useJoinRoom() {
  return useMutation({
    mutationFn: (roomId: string) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return roomsApi.joinRoom(token, roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
  });
}

export function useLeaveRoom() {
  return useMutation({
    mutationFn: (roomId: string) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return roomsApi.leaveRoom(token, roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
  });
}
