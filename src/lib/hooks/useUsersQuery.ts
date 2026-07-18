import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import * as usersApi from "../api/users";
import { useAuthStore } from "../store/auth";

/* ─── Query Keys ─────────────────────────────────────────────── */

export const userKeys = {
  me: ["users", "me"] as const,
  user: (id: string) => ["users", id] as const,
  all: ["users"] as const,
  search: (q: string) => ["users", "search", q] as const,
  recommended: ["users", "recommended"] as const,
  stats: ["users", "me", "stats"] as const,
};

/* ─── Queries ────────────────────────────────────────────────── */

export function useMe() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: userKeys.me,
    queryFn: () => usersApi.getMe(),
    enabled: !!token,
  });
}

export function useUser(userId: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: userKeys.user(userId),
    queryFn: () => usersApi.getUser(userId),
    enabled: !!userId && !!token,
  });
}

export function useUsers(search?: string, limit?: number, offset?: number) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: [...userKeys.all, { search, limit, offset }],
    queryFn: () => usersApi.getUsers(search, limit, offset),
    enabled: !!token,
  });
}

export function useSearchUsers(keyword: string, limit?: number, offset?: number) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: userKeys.search(keyword),
    queryFn: () => usersApi.searchUsers(keyword, limit, offset),
    enabled: !!keyword && !!token,
  });
}

export function useRecommendedUsers() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: userKeys.recommended,
    queryFn: () => usersApi.getRecommendedUsers(),
    enabled: !!token,
  });
}

export function useUserStats() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: userKeys.stats,
    queryFn: () => usersApi.getUserStats(),
    enabled: !!token,
  });
}

/* ─── Mutations ──────────────────────────────────────────────── */

export function useUpdateMe() {
  return useMutation({
    mutationFn: (data: { username?: string; avatar_url?: string }) =>
      usersApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      oldPassword,
      newPassword,
    }: {
      oldPassword: string;
      newPassword: string;
    }) => usersApi.changePassword(oldPassword, newPassword),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => usersApi.deleteAccount(),
  });
}
