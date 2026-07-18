import { request } from "./client";

interface MessageSender {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface ReplyToMessage {
  id: string;
  sender: MessageSender;
  content: string;
  created_at: string;
}

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

interface Message {
  id: string;
  room_id: string;
  sender: MessageSender;
  content: string;
  message_type: "text" | "image" | "file" | "system";
  reply_to: string | null;
  reply_to_message: ReplyToMessage | null;
  is_deleted: boolean;
  is_edited?: boolean;
  created_at: string;
  edit_count?: number;
  edited_at?: string | null;
  reactions?: MessageReaction[] | null;
}

interface MessagesResponse {
  messages: Message[];
  total: number;
  has_more: boolean;
}

interface EditHistoryEntry {
  id: string;
  message_id: string;
  editor: MessageSender;
  old_content: string;
  new_content: string;
  created_at: string;
}

interface PinnedMessage {
  id: string;
  message_id: string;
  room_id: string;
  pinned_by: string;
  content: string;
  sender_name: string;
  created_at: string;
}

interface Reaction {
  emoji: string;
  user_id: string;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null);
  if (entries.length === 0) return "";
  return (
    "?" +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&")
  );
}

export async function getMessages(
  roomId: string,
  limit?: number,
  before?: string,
): Promise<MessagesResponse> {
  return request<MessagesResponse>(
    `/api/v1/rooms/${roomId}/messages${buildQuery({ limit, before })}`,
    { method: "GET" },
  );
}

export async function searchMessages(
  query: string,
  roomId?: string,
  limit?: number,
): Promise<Message[]> {
  return request<Message[]>(
    `/api/v1/messages/search${buildQuery({ q: query, room_id: roomId, limit })}`,
    { method: "GET" },
  );
}

export async function editMessage(messageId: string, content: string): Promise<Message> {
  return request<Message>(`/api/v1/messages/${messageId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export async function deleteMessage(messageId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/v1/messages/${messageId}`, {
    method: "DELETE",
  });
}

export async function getEditHistory(
  messageId: string,
  limit?: number,
): Promise<EditHistoryEntry[]> {
  return request<EditHistoryEntry[]>(
    `/api/v1/messages/${messageId}/history${buildQuery({ limit })}`,
    { method: "GET" },
  );
}

export async function addReaction(messageId: string, emoji: string): Promise<unknown> {
  return request(`/api/v1/messages/${messageId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
}

export async function removeReaction(messageId: string, emoji: string): Promise<unknown> {
  return request(`/api/v1/messages/${messageId}/reactions${buildQuery({ emoji })}`, {
    method: "DELETE",
  });
}

export async function getReactions(messageId: string): Promise<Reaction[]> {
  return request<Reaction[]>(`/api/v1/messages/${messageId}/reactions`, {
    method: "GET",
  });
}

export async function pinMessage(messageId: string): Promise<PinnedMessage> {
  return request<PinnedMessage>(`/api/v1/messages/${messageId}/pin`, { method: "POST" });
}

export async function unpinMessage(messageId: string): Promise<string> {
  return request<string>(`/api/v1/messages/${messageId}/pin`, { method: "DELETE" });
}

export async function getPinnedMessages(roomId: string): Promise<PinnedMessage[]> {
  return request<PinnedMessage[]>(`/api/v1/rooms/${roomId}/pinned-messages`, {
    method: "GET",
  });
}

export type {
  Message,
  MessageSender,
  ReplyToMessage,
  MessageReaction,
  MessagesResponse,
  EditHistoryEntry,
  PinnedMessage,
  Reaction,
};
