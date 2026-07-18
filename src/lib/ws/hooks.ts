import { useEffect, useRef } from "react";
import { InfiniteData } from "@tanstack/react-query";
import { getWsClient } from "./client";
import { useChatStore } from "../store/chat";
import { useRoomStore } from "../store/room";
import { useAuthStore } from "../store/auth";
import { queryClient } from "../hooks/queryClient";
import { messageKeys } from "../hooks/useMessagesQuery";
import { roomKeys } from "../hooks/useRoomsQuery";
import type { MessagesResponse, Message } from "../api/messages";

/* ─── Helpers: update message in infinite query cache ─── */

export function appendMessageToCache(roomId: string, msg: Message) {
  const keys = messageKeys.list(roomId);
  const data = queryClient.getQueryData<InfiniteData<MessagesResponse>>(keys);
  if (!data) return; // cache not loaded yet — WS will catch up on next fetch

  queryClient.setQueryData<InfiniteData<MessagesResponse>>(keys, {
    ...data,
    pages: data.pages.map((page, i) =>
      i === 0 ? { ...page, messages: [...page.messages, msg] } : page,
    ),
  });
}

function updateMessageInCache(
  roomId: string,
  messageId: string,
  updates: Partial<Message>,
) {
  const keys = messageKeys.list(roomId);
  const data = queryClient.getQueryData<InfiniteData<MessagesResponse>>(keys);
  if (!data) return;

  queryClient.setQueryData<InfiniteData<MessagesResponse>>(keys, {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
    })),
  });
}

function removeMessageFromCache(roomId: string, messageId: string) {
  const keys = messageKeys.list(roomId);
  const data = queryClient.getQueryData<InfiniteData<MessagesResponse>>(keys);
  if (!data) return;

  queryClient.setQueryData<InfiniteData<MessagesResponse>>(keys, {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.filter((m) => m.id !== messageId),
    })),
  });
}

/* ─── Auto-connect on login, disconnect on logout ─────── */

export function useWsConnection() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const previousToken = useRef<string | null>(null);

  useEffect(() => {
    if (accessToken && user) {
      if (previousToken.current !== accessToken) {
        previousToken.current = accessToken;
        getWsClient().connect();
      }
    }

    if (!accessToken || !user) {
      previousToken.current = null;
      getWsClient().disconnect();
    }
  }, [accessToken, user]);
}

/* ─── Wire WS events → React Query cache + Zustand UI state ── */

export function useWsEventHandlers() {
  const setTyping = useChatStore((s) => s.setTyping);

  useEffect(() => {
    const ws = getWsClient();
    const unsubscribers: (() => void)[] = [];

    /* ── New message → React Query cache ── */
    unsubscribers.push(
      ws.on("NewMessage", (payload: any) => {
        const msg: Message = {
          id: payload.message_id,
          room_id: payload.room_id,
          sender: {
            id: payload.sender_id,
            username: payload.sender_name,
            avatar_url: null,
          },
          content: payload.content,
          message_type: payload.message_type ?? "text",
          reply_to: payload.reply_to ?? null,
          reply_to_message: payload.reply_to_message ?? null,
          is_deleted: false,
          created_at: payload.created_at,
        };
        appendMessageToCache(payload.room_id, msg);
      }),
    );

    /* ── Message edited → React Query cache ── */
    unsubscribers.push(
      ws.on("MessageEdited", (payload: any) => {
        updateMessageInCache(payload.room_id, payload.message_id, {
          content: payload.new_content,
          edited_at: payload.edited_at,
          is_edited: true,
        } as any);
      }),
    );

    /* ── Message deleted → React Query cache ── */
    unsubscribers.push(
      ws.on("MessageDeleted", (payload: any) => {
        // We need the room_id — infer from cache or mark as deleted
        removeMessageFromCache(payload.room_id ?? "", payload.message_id);
      }),
    );

    /* ── Reaction events → invalidate messages cache ── */
    unsubscribers.push(
      ws.on("ReactionAdded", (payload: any) => {
        queryClient.invalidateQueries({
          queryKey: messageKeys.list(payload.room_id),
        });
      }),
    );
    unsubscribers.push(
      ws.on("ReactionRemoved", (payload: any) => {
        queryClient.invalidateQueries({
          queryKey: messageKeys.list(payload.room_id),
        });
      }),
    );

    /* ── Typing indicators → Zustand UI state ── */
    unsubscribers.push(
      ws.on("UserTyping", (payload: any) => {
        setTyping(payload.room_id, payload.user_id, payload.username, true);
      }),
    );
    unsubscribers.push(
      ws.on("UserStopTyping", (payload: any) => {
        setTyping(payload.room_id, payload.user_id, payload.username, false);
      }),
    );

    /* ── Room summary → invalidate rooms list ── */
    unsubscribers.push(
      ws.on("RoomMessageSummary", (_payload: any) => {
        queryClient.invalidateQueries({ queryKey: roomKeys.all });
      }),
    );

    /* ── Pin / Unpin → invalidate pinned messages ── */
    unsubscribers.push(
      ws.on("MessagePinned", (payload: any) => {
        queryClient.invalidateQueries({
          queryKey: messageKeys.pinned(payload.room_id),
        });
      }),
    );
    unsubscribers.push(
      ws.on("MessageUnpinned", (payload: any) => {
        queryClient.invalidateQueries({
          queryKey: messageKeys.pinned(payload.room_id),
        });
      }),
    );

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, [setTyping]);
}

/* ─── Hook: join a room via WS when entering ──────────── */

export function useWsJoinRoom(roomId: string | null) {
  useEffect(() => {
    if (!roomId) return;

    const ws = getWsClient();
    ws.send("JoinRoom", { room_id: roomId });

    const unsubOnline = ws.on("OnlineUsers", (payload: any) => {
      if (payload.room_id === roomId) {
        useRoomStore.getState().setOnlineUsers(roomId, payload.users);
      }
    });

    return () => {
      unsubOnline();
      ws.send("LeaveRoom", { room_id: roomId });
    };
  }, [roomId]);
}
