import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFriends,
  getReceivedRequests,
  getSentRequests,
  sendFriendRequest,
  handleFriendRequest,
  cancelFriendRequest,
  deleteFriend,
  searchUsers,
} from "../api/users";
import { useAuthStore } from "../store/auth";
import { queryClient } from "./queryClient";

/* ─── Query Keys ─────────────────────────────────────────────── */

export const friendKeys = {
  all: ["friends"] as const,
  requests: ["friends", "requests"] as const,
  received: ["friends", "requests", "received"] as const,
  sent: ["friends", "requests", "sent"] as const,
  search: (q: string) => ["users", "search", q] as const,
};

/* ─── Queries ────────────────────────────────────────────────── */

export function useFriends() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: friendKeys.all,
    queryFn: () => getFriends(token!),
    enabled: !!token,
  });
}

export function useReceivedRequests() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: friendKeys.received,
    queryFn: () => getReceivedRequests(token!),
    enabled: !!token,
  });
}

export function useSentRequests() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: friendKeys.sent,
    queryFn: () => getSentRequests(token!),
    enabled: !!token,
  });
}

export function useSearchUsers(keyword: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: friendKeys.search(keyword),
    queryFn: () => searchUsers(token!, keyword),
    enabled: !!keyword && !!token,
  });
}

/* ─── Mutations ──────────────────────────────────────────────── */

export function useSendFriendRequest() {
  return useMutation({
    mutationFn: ({
      receiverId,
      message,
    }: {
      receiverId: string;
      message?: string;
    }) => {
      const token = useAuthStore.getState().accessToken;
      return sendFriendRequest(token!, receiverId, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.sent });
    },
  });
}

export function useHandleFriendRequest() {
  return useMutation({
    mutationFn: ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "accept" | "reject";
    }) => {
      const token = useAuthStore.getState().accessToken;
      return handleFriendRequest(token!, requestId, action);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.received });
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
}

export function useCancelFriendRequest() {
  return useMutation({
    mutationFn: (requestId: string) => {
      const token = useAuthStore.getState().accessToken;
      return cancelFriendRequest(token!, requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.sent });
    },
  });
}

export function useRemoveFriend() {
  return useMutation({
    mutationFn: (userId: string) => {
      const token = useAuthStore.getState().accessToken;
      return deleteFriend(token!, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
}
