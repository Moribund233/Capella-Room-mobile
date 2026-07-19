import { useEffect, useRef } from "react";
import { InfiniteData } from "@tanstack/react-query";
import { getWsClient } from "./client";
import { useChatStore } from "../store/chat";
import { useRoomStore } from "../store/room";
import { useAuthStore } from "../store/auth";
import { queryClient } from "../hooks/queryClient";
import { messageKeys } from "../hooks/useMessagesQuery";
import { roomKeys } from "../hooks/useRoomsQuery";
import { userKeys } from "../hooks/useUsersQuery";
import { notifKeys } from "../hooks/useNotificationsQuery";
import {
  syncMessages,
  updateLocalMessage,
  markLocalMessageDeleted,
  updateLocalRoom,
  upsertUsers,
} from "../db/sync";
import type { MessagesResponse, Message } from "../api/messages";
import type { ReconnectResultPayload } from "./types";

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

/* ─── Helper: request missed messages for a room ──────── */

function requestMissedMessages(roomId: string) {
  const keys = messageKeys.list(roomId);
  const data = queryClient.getQueryData<InfiniteData<MessagesResponse>>(keys);
  const lastMessageId =
    data && data.pages.length > 0
      ? (data.pages[0].messages[data.pages[0].messages.length - 1]?.id ?? null)
      : null;
  getWsClient().send("GetMissedMessages", {
    room_id: roomId,
    last_message_id: lastMessageId,
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

    /* ── New message → React Query cache + local DB ── */
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
          file_url: payload.file_url ?? null,
          is_deleted: false,
          created_at: payload.created_at,
        };
        appendMessageToCache(payload.room_id, msg);
        syncMessages(payload.room_id, [msg]).catch((err) => {
          console.warn("[WS] Failed to sync new message to local DB:", err);
        });
        upsertUsers([
          {
            id: payload.sender_id,
            username: payload.sender_name,
            avatar_url: null,
          },
        ]).catch((err) => {
          console.warn("[WS] Failed to sync sender to local DB:", err);
        });
      }),
    );

    /* ── Message edited → React Query cache + local DB ── */
    unsubscribers.push(
      ws.on("MessageEdited", (payload: any) => {
        updateMessageInCache(payload.room_id, payload.message_id, {
          content: payload.new_content,
          edited_at: payload.edited_at,
          is_edited: true,
        } as any);
        updateLocalMessage(payload.room_id, payload.message_id, {
          content: payload.new_content,
          edited_at: payload.edited_at,
          is_edited: true,
        }).catch((err) => {
          console.warn("[WS] Failed to update local message:", err);
        });
      }),
    );

    /* ── Message deleted → React Query cache + local DB ── */
    unsubscribers.push(
      ws.on("MessageDeleted", (payload: any) => {
        // We need the room_id — infer from cache or mark as deleted
        removeMessageFromCache(payload.room_id ?? "", payload.message_id);
        if (payload.room_id) {
          markLocalMessageDeleted(payload.room_id, payload.message_id).catch((err) => {
            console.warn("[WS] Failed to mark local message deleted:", err);
          });
        }
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

    /* ── System message → append as system-type message ── */
    unsubscribers.push(
      ws.on("SystemMessage", (payload: any) => {
        const roomId = payload.room_id ?? "";
        if (roomId) {
          const msg: Message = {
            id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            room_id: roomId,
            sender: { id: "system", username: "System", avatar_url: null },
            content: payload.content ?? "",
            message_type: "system",
            reply_to: null,
            reply_to_message: null,
            file_url: null,
            is_deleted: false,
            created_at: new Date().toISOString(),
          };
          appendMessageToCache(roomId, msg);
        }
      }),
    );

    /* ── Room updated → invalidate room detail + lists + local DB ── */
    unsubscribers.push(
      ws.on("RoomUpdated", (payload: any) => {
        queryClient.invalidateQueries({ queryKey: roomKeys.all });
        queryClient.invalidateQueries({ queryKey: roomKeys.recent });
        if (payload.room_id) {
          queryClient.invalidateQueries({ queryKey: roomKeys.detail(payload.room_id) });
          updateLocalRoom(payload.room_id, {
            name: payload.name,
            member_count: payload.member_count,
            unread_count: payload.unread_count,
            last_message: payload.last_message,
          }).catch((err) => {
            console.warn("[WS] Failed to update local room:", err);
          });
        }
      }),
    );

    /* ── Reconnect result → request missed messages for rooms to rejoin ── */
    unsubscribers.push(
      ws.on("ReconnectResult", (payload: ReconnectResultPayload) => {
        if (payload.success && payload.rooms_to_rejoin) {
          payload.rooms_to_rejoin.forEach((roomId) => requestMissedMessages(roomId));
        }
      }),
    );

    /* ── Session restored → invalidate rooms (reconnect complete) ── */
    unsubscribers.push(
      ws.on("SessionRestored", () => {
        queryClient.invalidateQueries({ queryKey: roomKeys.all });
        queryClient.invalidateQueries({ queryKey: roomKeys.recent });
      }),
    );

    /* ── Notification read confirm → invalidate notifications ── */
    unsubscribers.push(
      ws.on("NotificationReadConfirm", () => {
        queryClient.invalidateQueries({ queryKey: notifKeys.all });
        queryClient.invalidateQueries({ queryKey: notifKeys.unread });
      }),
    );

    /* ── Pending action events → invalidate notifications (admin) ── */
    unsubscribers.push(
      ws.on("PendingAction", () => {
        queryClient.invalidateQueries({ queryKey: notifKeys.all });
      }),
    );
    unsubscribers.push(
      ws.on("PendingActionsList", () => {
        queryClient.invalidateQueries({ queryKey: notifKeys.all });
      }),
    );

    /* ── Global online users → update room store ── */
    unsubscribers.push(
      ws.on("GlobalOnlineUsers", (payload: any) => {
        useRoomStore.getState().setOnlineUsers("__global__", payload.users ?? []);
      }),
    );

    /* ── Room summary → invalidate rooms list (all + recent) ── */
    unsubscribers.push(
      ws.on("RoomMessageSummary", (_payload: any) => {
        queryClient.invalidateQueries({ queryKey: roomKeys.all });
        queryClient.invalidateQueries({ queryKey: roomKeys.recent });
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

    /* ── Read receipt → refresh message list ── */
    unsubscribers.push(
      ws.on("MessageReadReceipt", (payload: any) => {
        if (payload.room_id) {
          queryClient.invalidateQueries({
            queryKey: messageKeys.list(payload.room_id),
          });
        }
      }),
    );

    /* ── User status changed → update own state + invalidate caches ── */
    unsubscribers.push(
      ws.on("UserStatusChanged", (payload: any) => {
        const currentUserId = useAuthStore.getState().user?.id;
        if (payload.user_id === currentUserId) {
          useAuthStore.getState().setUserStatus(payload.status);
        }
        queryClient.invalidateQueries({ queryKey: userKeys.me });
        queryClient.invalidateQueries({ queryKey: userKeys.user(payload.user_id) });
        queryClient.invalidateQueries({ queryKey: userKeys.all });
      }),
    );

    /* ── Notification events → invalidate notifications ── */
    unsubscribers.push(
      ws.on("Mentioned", () => {
        queryClient.invalidateQueries({ queryKey: notifKeys.all });
        queryClient.invalidateQueries({ queryKey: notifKeys.unread });
      }),
    );
    unsubscribers.push(
      ws.on("PrivateMessage", () => {
        queryClient.invalidateQueries({ queryKey: notifKeys.all });
        queryClient.invalidateQueries({ queryKey: notifKeys.unread });
      }),
    );
    unsubscribers.push(
      ws.on("RoomInvitation", () => {
        queryClient.invalidateQueries({ queryKey: notifKeys.all });
        queryClient.invalidateQueries({ queryKey: notifKeys.unread });
      }),
    );
    unsubscribers.push(
      ws.on("SystemNotification", () => {
        queryClient.invalidateQueries({ queryKey: notifKeys.all });
        queryClient.invalidateQueries({ queryKey: notifKeys.unread });
      }),
    );
    unsubscribers.push(
      ws.on("FileUploadComplete", () => {
        queryClient.invalidateQueries({ queryKey: notifKeys.all });
        queryClient.invalidateQueries({ queryKey: notifKeys.unread });
      }),
    );

    /* ── Missed messages → invalidate room messages ── */
    unsubscribers.push(
      ws.on("MissedMessages", (payload: any) => {
        queryClient.invalidateQueries({
          queryKey: messageKeys.list(payload.room_id),
        });
      }),
    );

    /* ── Offline notifications → invalidate notifications ── */
    unsubscribers.push(
      ws.on("OfflineNotifications", () => {
        queryClient.invalidateQueries({ queryKey: notifKeys.all });
        queryClient.invalidateQueries({ queryKey: notifKeys.unread });
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
