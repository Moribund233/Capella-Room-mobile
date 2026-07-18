import { useQuery, useMutation } from "@tanstack/react-query";
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
    queryFn: () => getFriends(),
    enabled: !!token,
  });
}

export function useReceivedRequests() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: friendKeys.received,
    queryFn: () => getReceivedRequests(),
    enabled: !!token,
  });
}

export function useSentRequests() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: friendKeys.sent,
    queryFn: () => getSentRequests(),
    enabled: !!token,
  });
}

export function useSearchUsers(keyword: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: friendKeys.search(keyword),
    queryFn: () => searchUsers(keyword),
    enabled: !!keyword && !!token,
  });
}

/* ─── Mutations ──────────────────────────────────────────────── */

export function useSendFriendRequest() {
  return useMutation({
    mutationFn: ({ receiverId, message }: { receiverId: string; message?: string }) =>
      sendFriendRequest(receiverId, message),
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
    }) => handleFriendRequest(requestId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.received });
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
}

export function useCancelFriendRequest() {
  return useMutation({
    mutationFn: (requestId: string) => cancelFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.sent });
    },
  });
}

export function useRemoveFriend() {
  return useMutation({
    mutationFn: (userId: string) => deleteFriend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
}
