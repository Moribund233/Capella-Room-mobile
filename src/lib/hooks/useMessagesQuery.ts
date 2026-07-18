import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as messagesApi from "../api/messages";
import { useAuthStore } from "../store/auth";

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
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      messagesApi.getMessages(roomId, limit, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more || lastPage.messages.length === 0) return undefined;
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
    queryFn: () => messagesApi.getPinnedMessages(roomId),
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
    }) => messagesApi.searchMessages(query, roomId, limit),
  });
}

// ── Mutations ──

export function useEditMessage(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      messagesApi.editMessage(messageId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(roomId) });
    },
  });
}

export function useDeleteMessage(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => messagesApi.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(roomId) });
    },
  });
}

export function useAddReaction(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      messagesApi.addReaction(messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(roomId) });
    },
  });
}

export function useRemoveReaction(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      messagesApi.removeReaction(messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(roomId) });
    },
  });
}

export function usePinMessage(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => messagesApi.pinMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.pinned(roomId) });
    },
  });
}

export function useUnpinMessage(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => messagesApi.unpinMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.pinned(roomId) });
    },
  });
}
