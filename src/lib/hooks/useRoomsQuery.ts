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
  recent: ["rooms", "recent"] as const,
  invitations: (id: string) => ["rooms", id, "invitations"] as const,
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

export function useRecentRooms(limit = 50) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: roomKeys.recent,
    queryFn: () => roomsApi.getRecentRooms(limit),
    enabled: !!token,
  });
}

export function useRoomInvitations(roomId: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: roomKeys.invitations(roomId),
    queryFn: () => roomsApi.getInvitations(roomId),
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
      queryClient.invalidateQueries({ queryKey: roomKeys.recent });
    },
  });
}

export function useUpdateRoom() {
  return useMutation({
    mutationFn: ({
      roomId,
      payload,
    }: {
      roomId: string;
      payload: Partial<roomsApi.CreateRoomPayload>;
    }) => roomsApi.updateRoom(roomId, payload),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
      queryClient.invalidateQueries({ queryKey: roomKeys.recent });
    },
  });
}

export function useDeleteRoom() {
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
      queryClient.invalidateQueries({ queryKey: roomKeys.recent });
    },
  });
}

export function useJoinRoom() {
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.joinRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
      queryClient.invalidateQueries({ queryKey: roomKeys.recent });
    },
  });
}

export function useLeaveRoom() {
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.leaveRoom(roomId),
    onSuccess: (_data, roomId) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
      queryClient.invalidateQueries({ queryKey: roomKeys.recent });
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
    },
  });
}

export function useKickMember() {
  return useMutation({
    mutationFn: ({ roomId, userId }: { roomId: string; userId: string }) =>
      roomsApi.kickMember(roomId, userId),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.members(roomId) });
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
    },
  });
}

export function useSetMemberRole() {
  return useMutation({
    mutationFn: ({
      roomId,
      userId,
      role,
    }: {
      roomId: string;
      userId: string;
      role: "owner" | "admin" | "member";
    }) => roomsApi.setMemberRole(roomId, userId, role),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.members(roomId) });
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
    },
  });
}

export function useCreateInvitation() {
  return useMutation({
    mutationFn: ({
      roomId,
      expiresInHours,
      maxUses,
    }: {
      roomId: string;
      expiresInHours?: number;
      maxUses?: number;
    }) => roomsApi.createInvitation(roomId, expiresInHours, maxUses),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.invitations(roomId) });
    },
  });
}

export function useDeleteInvitation() {
  return useMutation({
    mutationFn: ({ roomId, invitationId }: { roomId: string; invitationId: string }) =>
      roomsApi.deleteInvitation(roomId, invitationId),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.invitations(roomId) });
    },
  });
}

export function useJoinByInvite() {
  return useMutation({
    mutationFn: (inviteCode: string) => roomsApi.joinByInvite(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
      queryClient.invalidateQueries({ queryKey: roomKeys.recent });
    },
  });
}

export function useGetOrCreateDirectRoom() {
  return useMutation({
    mutationFn: (targetUserId: string) => roomsApi.getDirectRoom(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.direct });
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
      queryClient.invalidateQueries({ queryKey: roomKeys.recent });
    },
  });
}
