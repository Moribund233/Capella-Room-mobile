import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as messagesApi from "../api/messages";
import { useAuthStore } from "../store/auth";
import { queryClient } from "./queryClient";

// ── Keys ──

export const messageKeys = {
  list: (roomId: string) => ["rooms", roomId, "messages"] as const,
  search: (query: string) => ["messages", "search", query] as const,
  pinned: (roomId: string) => ["rooms", roomId, "pinned"] as const,
};

// ── Queries ──

export function useMessages(roomId: string, limit = 50) {
  return useInfiniteQuery({
    queryKey: messageKeys.list(roomId),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return messagesApi.getMessages(token, roomId, limit, pageParam);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more || lastPage.messages.length === 0)
        return undefined;
      const messages = lastPage.messages;
      return messages[messages.length - 1].id;
    },
    enabled: !!roomId && !!useAuthStore.getState().accessToken,
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        messages: [...page.messages].reverse(),
      })),
    }),
  });
}

export function usePinnedMessages(roomId: string) {
  return useQuery({
    queryKey: messageKeys.pinned(roomId),
    queryFn: () => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return messagesApi.getPinnedMessages(token, roomId);
    },
    enabled: !!roomId && !!useAuthStore.getState().accessToken,
  });
}

export function useSearchMessages() {
  return useMutation({
    mutationFn: ({
      query,
      roomId,
      limit,
    }: {
      query: string;
      roomId?: string;
      limit?: number;
    }) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return messagesApi.searchMessages(token, query, roomId, limit);
    },
  });
}

// ── Mutations ──

export function useEditMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return messagesApi.editMessage(token, messageId, content);
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return messagesApi.deleteMessage(token, messageId);
    },
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return messagesApi.addReaction(token, messageId, emoji);
    },
  });
}

export function useRemoveReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return messagesApi.removeReaction(token, messageId, emoji);
    },
  });
}

export function usePinMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return messagesApi.pinMessage(token, messageId);
    },
    onSuccess: (_data, messageId) => {
      // Invalidate pinned messages for the room (though we don't know which room from here)
      // The caller should handle invalidation
    },
  });
}

export function useUnpinMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      return messagesApi.unpinMessage(token, messageId);
    },
  });
}
