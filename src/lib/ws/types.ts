/* ─── Connection Management ─────────────────────────────── */

export interface AuthPayload {
  token: string;
}

export interface AuthResultPayload {
  success: boolean;
  message: string;
}

export interface ReconnectPayload {
  token: string;
  last_disconnect_at?: string;
}

export interface ReconnectResultPayload {
  success: boolean;
  message: string;
  rooms_to_rejoin?: string[];
}

export interface SessionRestoredPayload {
  restored_at: string;
  rooms_restored: number;
  total_unread: number;
}

/* ─── Ping / Pong (unit variants, no payload) ─────────── */

/* ─── Error ────────────────────────────────────────────── */

export interface ErrorPayload {
  code: string;
  message: string;
}

/* ─── System Message (in-chat broadcast) ──────────────── */

export interface SystemMessagePayload {
  content: string;
}

/* ─── Room Updated ────────────────────────────────────── */

export interface RoomUpdatedPayload {
  room_id: string;
  name?: string | null;
  description?: string | null;
}

/* ─── Room Management ──────────────────────────────────── */

export interface JoinRoomPayload {
  room_id: string;
}

export interface LeaveRoomPayload {
  room_id: string;
}

export interface RoomJoinedPayload {
  room_id: string;
  user_id: string;
  username: string;
}

export interface RoomLeftPayload {
  room_id: string;
  user_id: string;
  username: string;
}

export interface UserEventPayload {
  room_id: string;
  user_id: string;
  username: string;
}

export interface OnlineUser {
  id: string;
  username: string;
  avatar_url: string | null;
  status: "Online" | "Away" | "Busy" | "Offline";
}

export interface OnlineUsersPayload {
  room_id: string;
  users: OnlineUser[];
}

export interface LastMessageSummary {
  id: string;
  content: string;
  sender_name: string;
  created_at: string;
}

export interface RoomMessageSummaryPayload {
  room_id: string;
  last_message: LastMessageSummary;
  unread_count: number;
}

/* ─── Chat Messages ────────────────────────────────────── */

export interface ChatMessagePayload {
  room_id: string;
  content: string;
  reply_to?: string | null;
}

export interface ReplyToInfo {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface NewMessagePayload {
  message_id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type?: string;
  reply_to: string | null;
  reply_to_message: ReplyToInfo | null;
  created_at: string;
}

export interface TypingPayload {
  room_id: string;
}

export interface UserTypingPayload {
  room_id: string;
  user_id: string;
  username: string;
}

export interface MessageReadPayload {
  message_id: string;
}

export interface MessageReadReceiptPayload {
  message_id: string;
  user_id: string;
}

export interface EditMessagePayload {
  message_id: string;
  new_content: string;
}

export interface MessageEditedPayload {
  message_id: string;
  new_content: string;
  edited_at: string;
}

export interface DeleteMessagePayload {
  message_id: string;
}

export interface MessageDeletedPayload {
  message_id: string;
}

/* ─── Reactions ────────────────────────────────────────── */

export interface ReactionPayload {
  message_id: string;
  emoji: string;
}

export interface AddReactionPayload extends ReactionPayload {
  room_id?: string;
}

export interface ReactionEventPayload {
  message_id: string;
  room_id: string;
  user_id: string;
  emoji: string;
}

/* ─── Pin Messages ─────────────────────────────────────── */

export interface PinMessagePayload {
  message_id: string;
  room_id: string;
}

export interface MessagePinnedPayload {
  message_id: string;
  room_id: string;
  pinned_by: string;
  pinned_by_name: string;
  content_preview: string;
  pinned_at: string;
}

export interface MessageUnpinnedPayload {
  message_id: string;
  room_id: string;
  unpinned_by: string;
  unpinned_at: string;
}

/* ─── Missed Messages ──────────────────────────────────── */

export interface GetMissedMessagesPayload {
  room_id: string;
  last_message_id?: string | null;
}

export interface MissedMessageItem {
  message_id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  reply_to: string | null;
  reply_to_message: ReplyToInfo | null;
  created_at: string;
}

export interface MissedMessagesPayload {
  room_id: string;
  messages: MissedMessageItem[];
  has_more: boolean;
}

/* ─── User Status ──────────────────────────────────────── */

export interface UpdateStatusPayload {
  status: "online" | "away" | "busy" | "offline";
}

export interface UserStatusChangedPayload {
  user_id: string;
  username: string;
  status: string;
}

/* ─── Notifications ────────────────────────────────────── */

export interface PrivateMessagePayload {
  message_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface MentionedPayload {
  message_id: string;
  room_id: string;
  mentioned_by: string;
  mentioned_by_name: string;
  content_preview: string;
  created_at: string;
}

export interface RoomInvitationPayload {
  invitation_id: string;
  room_id: string;
  room_name: string;
  invited_by: string;
  invited_by_name: string;
  created_at: string;
}

export interface SystemNotificationPayload {
  notification_type: "new" | "important" | "warning";
  title: string;
  content: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface FileUploadCompletePayload {
  file_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
}

export interface GetOfflineNotificationsPayload {
  last_notification_id?: string | null;
  limit?: number;
}

export interface OfflineNotificationItem {
  id: string;
  notification_type: string;
  title: string | null;
  content: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface OfflineNotificationsPayload {
  notifications: OfflineNotificationItem[];
  has_more: boolean;
}

/* ─── Union type for all incoming messages ─────────────── */

export type WsIncomingMessage =
  | { type: "AuthResult"; payload: AuthResultPayload }
  | { type: "ReconnectResult"; payload: ReconnectResultPayload }
  | { type: "SessionRestored"; payload: SessionRestoredPayload }
  | { type: "Ping" }
  | { type: "Pong" }
  | { type: "Error"; payload: ErrorPayload }
  | { type: "SystemMessage"; payload: SystemMessagePayload }
  | { type: "RoomUpdated"; payload: RoomUpdatedPayload }
  | { type: "RoomJoined"; payload: RoomJoinedPayload }
  | { type: "RoomLeft"; payload: RoomLeftPayload }
  | { type: "UserJoined"; payload: UserEventPayload }
  | { type: "UserLeft"; payload: UserEventPayload }
  | { type: "OnlineUsers"; payload: OnlineUsersPayload }
  | { type: "RoomMessageSummary"; payload: RoomMessageSummaryPayload }
  | { type: "NewMessage"; payload: NewMessagePayload }
  | { type: "UserTyping"; payload: UserTypingPayload }
  | { type: "UserStopTyping"; payload: UserTypingPayload }
  | { type: "MessageReadReceipt"; payload: MessageReadReceiptPayload }
  | { type: "MessageEdited"; payload: MessageEditedPayload }
  | { type: "MessageDeleted"; payload: MessageDeletedPayload }
  | { type: "ReactionAdded"; payload: ReactionEventPayload }
  | { type: "ReactionRemoved"; payload: ReactionEventPayload }
  | { type: "MessagePinned"; payload: MessagePinnedPayload }
  | { type: "MessageUnpinned"; payload: MessageUnpinnedPayload }
  | { type: "MissedMessages"; payload: MissedMessagesPayload }
  | { type: "Mentioned"; payload: MentionedPayload }
  | { type: "PrivateMessage"; payload: PrivateMessagePayload }
  | { type: "RoomInvitation"; payload: RoomInvitationPayload }
  | { type: "SystemNotification"; payload: SystemNotificationPayload }
  | { type: "FileUploadComplete"; payload: FileUploadCompletePayload }
  | { type: "OfflineNotifications"; payload: OfflineNotificationsPayload }
  | { type: "NotificationReadConfirm"; payload: { notification_id: string } }
  | { type: "PendingAction"; payload: Record<string, unknown> }
  | { type: "PendingActionsList"; payload: Record<string, unknown> }
  | { type: "UserStatusChanged"; payload: UserStatusChangedPayload }
  | { type: "GlobalOnlineUsers"; payload: { users: OnlineUser[] } };

/* ─── Event names derived from incoming message types ──── */

export type WsEventType = WsIncomingMessage["type"];
