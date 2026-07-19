/**
 * Mappers between API types and WatermelonDB raw records.
 *
 * These helpers keep the conversion logic in one place so that sync code and
 * UI code do not need to know the internal column names.
 */

import type { Message as ApiMessage, MessageReaction } from "../api/messages";
import type { Room as ApiRoom, LastMessage } from "../api/rooms";
import type { FileInfo } from "../api/files";
import type { Message as DbMessage } from "./models/message";
import type { Room as DbRoom } from "./models/room";
import type { File as DbFile } from "./models/file";

function parseJson<T>(json: string | undefined | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function isoToTimestamp(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  return Number.isNaN(ts) ? null : ts;
}

function timestampToIso(ts: number | undefined | null): string | null {
  if (ts == null) return null;
  return new Date(ts).toISOString();
}

/* ─── Messages ─────────────────────────────────────────────── */

export function apiMessageToDbRaw(
  message: ApiMessage,
  localStatus: "synced" | "pending" | "failed" = "synced",
): Record<string, unknown> {
  return {
    server_id: message.id,
    room_id: message.room_id,
    sender_id: message.sender.id,
    sender_username: message.sender.username,
    sender_avatar_url: message.sender.avatar_url,
    content: message.content,
    message_type: message.message_type,
    reply_to: message.reply_to,
    reply_to_message_json: message.reply_to_message
      ? JSON.stringify(message.reply_to_message)
      : null,
    file_url: message.file_url,
    is_deleted: message.is_deleted,
    is_edited: message.is_edited ?? false,
    created_at: isoToTimestamp(message.created_at) ?? Date.now(),
    edited_at: isoToTimestamp(message.edited_at),
    reactions_json: message.reactions ? JSON.stringify(message.reactions) : null,
    local_status: localStatus,
  };
}

export function dbMessageToApiMessage(record: DbMessage): ApiMessage {
  const reactions = parseJson<MessageReaction[]>(record.reactionsJson);
  const replyToMessage = parseJson<ApiMessage["reply_to_message"]>(
    record.replyToMessageJson,
  );

  return {
    id: record.serverId ?? record.id,
    room_id: record.roomId,
    sender: {
      id: record.senderId,
      username: record.senderUsername,
      avatar_url: record.senderAvatarUrl ?? null,
    },
    content: record.content,
    message_type: record.messageType as ApiMessage["message_type"],
    reply_to: record.replyTo ?? null,
    reply_to_message: replyToMessage,
    file_url: record.fileUrl ?? null,
    is_deleted: record.isDeleted,
    is_edited: record.isEdited,
    created_at: timestampToIso(record.createdAt) ?? new Date().toISOString(),
    edited_at: timestampToIso(record.editedAt),
    reactions,
  };
}

/* ─── Rooms ──────────────────────────────────────────────────── */

export function apiRoomToDbRaw(room: ApiRoom): Record<string, unknown> {
  const lastMessage: LastMessage | undefined = room.last_message ?? undefined;

  return {
    server_id: room.id,
    name: room.name,
    description: room.description,
    owner_id: room.owner.id,
    owner_username: room.owner.username,
    owner_avatar_url: room.owner.avatar_url,
    is_private: room.is_private,
    max_members: room.max_members,
    member_count: room.member_count,
    unread_count: room.unread_count ?? 0,
    last_message_id: lastMessage?.id ?? null,
    last_message_content: lastMessage?.content ?? null,
    last_message_sender_name: lastMessage?.sender_name ?? null,
    last_message_created_at: isoToTimestamp(lastMessage?.created_at),
    created_at: isoToTimestamp(room.created_at) ?? Date.now(),
    updated_at: isoToTimestamp(room.updated_at) ?? Date.now(),
  };
}

export function dbRoomToApiRoom(record: DbRoom): ApiRoom {
  const lastMessageId = record.lastMessageId;
  const lastMessage: LastMessage | null = lastMessageId
    ? {
        id: lastMessageId,
        content: record.lastMessageContent ?? "",
        sender_name: record.lastMessageSenderName ?? "",
        created_at:
          timestampToIso(record.lastMessageCreatedAt) ?? new Date().toISOString(),
      }
    : null;

  return {
    id: record.serverId,
    name: record.name,
    description: record.description ?? null,
    owner: {
      id: record.ownerId,
      username: record.ownerUsername,
      avatar_url: record.ownerAvatarUrl ?? null,
    },
    is_private: record.isPrivate,
    max_members: record.maxMembers,
    member_count: record.memberCount,
    unread_count: record.unreadCount ?? 0,
    last_message: lastMessage,
    created_at: timestampToIso(record.createdAt) ?? new Date().toISOString(),
    updated_at: timestampToIso(record.updatedAt) ?? new Date().toISOString(),
  };
}

/* ─── Files ──────────────────────────────────────────────────── */

export function apiFileToDbRaw(
  file: FileInfo,
  messageId?: string,
): Record<string, unknown> {
  return {
    server_id: file.id,
    original_name: file.original_name,
    file_url: file.file_url,
    file_size: file.file_size,
    mime_type: file.mime_type,
    category: file.category,
    usage_type: file.usage_type,
    uploader_id: file.uploader?.id ?? null,
    uploader_username: file.uploader?.username ?? null,
    uploader_avatar_url: file.uploader?.avatar_url ?? null,
    message_id: messageId ?? null,
    created_at: isoToTimestamp(file.created_at) ?? Date.now(),
  };
}

export function dbFileToFileInfo(record: DbFile): FileInfo {
  return {
    id: record.serverId,
    original_name: record.originalName,
    file_url: record.fileUrl,
    file_size: record.fileSize,
    mime_type: record.mimeType,
    category: record.category as FileInfo["category"],
    usage_type: record.usageType as FileInfo["usage_type"],
    uploader: record.uploaderId
      ? {
          id: record.uploaderId,
          username: record.uploaderUsername ?? "",
          avatar_url: record.uploaderAvatarUrl ?? null,
        }
      : null,
    created_at: timestampToIso(record.createdAt) ?? new Date().toISOString(),
  };
}
