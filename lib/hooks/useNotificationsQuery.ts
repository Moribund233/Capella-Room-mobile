import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from "../api/notifications";
import { useAuthStore } from "../store/auth";
import { queryClient } from "./queryClient";

/* ─── Query Keys ─────────────────────────────────────────────── */

export const notifKeys = {
  all: ["notifications"] as const,
  unread: ["notifications", "unread"] as const,
};

/* ─── Queries ────────────────────────────────────────────────── */

export function useNotifications(limit = 50) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: notifKeys.all,
    queryFn: () => getNotifications(token!, limit),
    enabled: !!token,
  });
}

export function useUnreadCount() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: notifKeys.unread,
    queryFn: () => getUnreadCount(token!),
    enabled: !!token,
    refetchInterval: 30_000,
  });
}

/* ─── Mutations ──────────────────────────────────────────────── */

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: (id: string) => {
      const token = useAuthStore.getState().accessToken;
      return markRead(token!, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notifKeys.unread });
    },
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: () => {
      const token = useAuthStore.getState().accessToken;
      return markAllRead(token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notifKeys.all });
      queryClient.invalidateQueries({ queryKey: notifKeys.unread });
    },
  });
}
