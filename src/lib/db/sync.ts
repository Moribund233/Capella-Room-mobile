/**
 * Sync utilities: write server state into WatermelonDB.
 *
 * All operations are performed inside `database.write()` and use batching
 * where possible to keep writes fast.
 */

import { Q } from "@nozbe/watermelondb";

import { database } from "./database";
import { apiMessageToDbRaw, apiRoomToDbRaw, apiFileToDbRaw } from "./mappers";
import type { Message } from "./models/message";
import type { Room } from "./models/room";
import type { File } from "./models/file";
import type { User } from "./models/user";
import type { Message as ApiMessage } from "../api/messages";
import type { Room as ApiRoom } from "../api/rooms";
import type { FileInfo } from "../api/files";

/* ─── Message helpers ────────────────────────────────────────── */

function applyMessageRaw(record: Message, raw: Record<string, unknown>): void {
  record.serverId = (raw.server_id as string | undefined) ?? undefined;
  record.roomId = raw.room_id as string;
  record.senderId = raw.sender_id as string;
  record.senderUsername = raw.sender_username as string;
  record.senderAvatarUrl = (raw.sender_avatar_url as string | undefined) ?? undefined;
  record.content = raw.content as string;
  record.messageType = raw.message_type as string;
  record.replyTo = (raw.reply_to as string | undefined) ?? undefined;
  record.replyToMessageJson =
    (raw.reply_to_message_json as string | undefined) ?? undefined;
  record.fileUrl = (raw.file_url as string | undefined) ?? undefined;
  record.isDeleted = raw.is_deleted as boolean;
  record.isEdited = raw.is_edited as boolean;
  record.createdAt = raw.created_at as number;
  record.editedAt = (raw.edited_at as number | undefined) ?? undefined;
  record.reactionsJson = (raw.reactions_json as string | undefined) ?? undefined;
  record.localStatus = raw.local_status as "synced" | "pending" | "failed";
}

export async function syncMessages(
  roomId: string,
  messages: ApiMessage[],
): Promise<void> {
  if (messages.length === 0) return;

  const collection = database.get<Message>("messages");

  await database.write(async () => {
    const existing = await collection.query(Q.where("room_id", roomId)).fetch();
    const byServerId = new Map(existing.map((r) => [r.serverId, r]));

    const operations = messages.map((msg) => {
      const raw = apiMessageToDbRaw(msg, "synced");
      const record = byServerId.get(msg.id);
      if (record) {
        return record.prepareUpdate((draft) => applyMessageRaw(draft, raw));
      }
      return collection.prepareCreate((draft) => applyMessageRaw(draft, raw));
    });

    await database.batch(...operations);
  });
}

export async function updateLocalMessage(
  roomId: string,
  messageId: string,
  updates: Partial<ApiMessage>,
): Promise<void> {
  const collection = database.get<Message>("messages");

  await database.write(async () => {
    const records = await collection
      .query(Q.where("room_id", roomId), Q.where("server_id", messageId))
      .fetch();
    const record = records[0];
    if (!record) return;

    await record.update((draft) => {
      if (updates.content !== undefined) draft.content = updates.content;
      if (updates.is_edited !== undefined) draft.isEdited = updates.is_edited;
      if (updates.edited_at !== undefined && updates.edited_at !== null) {
        const ts = new Date(updates.edited_at).getTime();
        draft.editedAt = Number.isNaN(ts) ? undefined : ts;
      }
      if (updates.reactions !== undefined) {
        draft.reactionsJson = updates.reactions
          ? JSON.stringify(updates.reactions)
          : undefined;
      }
    });
  });
}

export async function markLocalMessageDeleted(
  roomId: string,
  messageId: string,
): Promise<void> {
  const collection = database.get<Message>("messages");

  await database.write(async () => {
    const records = await collection
      .query(Q.where("room_id", roomId), Q.where("server_id", messageId))
      .fetch();
    const record = records[0];
    if (!record) return;

    await record.update((draft) => {
      draft.isDeleted = true;
      draft.content = "";
    });
  });
}

/* ─── Room helpers ───────────────────────────────────────────── */

function applyRoomRaw(record: Room, raw: Record<string, unknown>): void {
  record.serverId = raw.server_id as string;
  record.name = raw.name as string;
  record.description = (raw.description as string | undefined) ?? undefined;
  record.ownerId = raw.owner_id as string;
  record.ownerUsername = raw.owner_username as string;
  record.ownerAvatarUrl = (raw.owner_avatar_url as string | undefined) ?? undefined;
  record.isPrivate = raw.is_private as boolean;
  record.maxMembers = raw.max_members as number;
  record.memberCount = raw.member_count as number;
  record.unreadCount = (raw.unread_count as number | undefined) ?? undefined;
  record.lastMessageId = (raw.last_message_id as string | undefined) ?? undefined;
  record.lastMessageContent =
    (raw.last_message_content as string | undefined) ?? undefined;
  record.lastMessageSenderName =
    (raw.last_message_sender_name as string | undefined) ?? undefined;
  record.lastMessageCreatedAt =
    (raw.last_message_created_at as number | undefined) ?? undefined;
  record.createdAt = raw.created_at as number;
  record.updatedAt = raw.updated_at as number;
}

export async function syncRooms(rooms: ApiRoom[]): Promise<void> {
  if (rooms.length === 0) return;

  const collection = database.get<Room>("rooms");

  await database.write(async () => {
    const existing = await collection.query().fetch();
    const byServerId = new Map(existing.map((r) => [r.serverId, r]));

    const operations = rooms.map((room) => {
      const raw = apiRoomToDbRaw(room);
      const record = byServerId.get(room.id);
      if (record) {
        return record.prepareUpdate((draft) => applyRoomRaw(draft, raw));
      }
      return collection.prepareCreate((draft) => applyRoomRaw(draft, raw));
    });

    await database.batch(...operations);
  });
}

export async function updateLocalRoom(
  roomId: string,
  updates: Partial<ApiRoom>,
): Promise<void> {
  const collection = database.get<Room>("rooms");

  await database.write(async () => {
    const records = await collection.query(Q.where("server_id", roomId)).fetch();
    const record = records[0];
    if (!record) return;

    await record.update((draft) => {
      if (updates.name !== undefined) draft.name = updates.name;
      if (updates.member_count !== undefined) draft.memberCount = updates.member_count;
      if (updates.unread_count !== undefined) draft.unreadCount = updates.unread_count;
      if (updates.last_message !== undefined) {
        draft.lastMessageId = updates.last_message?.id ?? undefined;
        draft.lastMessageContent = updates.last_message?.content ?? undefined;
        draft.lastMessageSenderName = updates.last_message?.sender_name ?? undefined;
        draft.lastMessageCreatedAt = updates.last_message?.created_at
          ? new Date(updates.last_message.created_at).getTime()
          : undefined;
      }
    });
  });
}

/* ─── File helpers ───────────────────────────────────────────── */

function applyFileRaw(record: File, raw: Record<string, unknown>): void {
  record.serverId = raw.server_id as string;
  record.originalName = raw.original_name as string;
  record.fileUrl = raw.file_url as string;
  record.fileSize = raw.file_size as number;
  record.mimeType = raw.mime_type as string;
  record.category = raw.category as string;
  record.usageType = raw.usage_type as string;
  record.uploaderId = (raw.uploader_id as string | undefined) ?? undefined;
  record.uploaderUsername = (raw.uploader_username as string | undefined) ?? undefined;
  record.uploaderAvatarUrl = (raw.uploader_avatar_url as string | undefined) ?? undefined;
  record.messageId = (raw.message_id as string | undefined) ?? undefined;
  record.createdAt = raw.created_at as number;
}

export async function syncFiles(files: FileInfo[], messageId?: string): Promise<void> {
  if (files.length === 0) return;

  const collection = database.get<File>("files");

  await database.write(async () => {
    const existing = await collection.query().fetch();
    const byServerId = new Map(existing.map((r) => [r.serverId, r]));

    const operations = files.map((file) => {
      const raw = apiFileToDbRaw(file, messageId);
      const record = byServerId.get(file.id);
      if (record) {
        return record.prepareUpdate((draft) => applyFileRaw(draft, raw));
      }
      return collection.prepareCreate((draft) => applyFileRaw(draft, raw));
    });

    await database.batch(...operations);
  });
}

/* ─── User helpers ───────────────────────────────────────────── */

export async function upsertUsers(
  users: { id: string; username: string; avatar_url?: string | null }[],
): Promise<void> {
  if (users.length === 0) return;

  const collection = database.get<User>("users");

  await database.write(async () => {
    const existing = await collection.query().fetch();
    const byServerId = new Map(existing.map((r) => [r.serverId, r]));

    const operations = users.map((user) => {
      const record = byServerId.get(user.id);
      if (record) {
        return record.prepareUpdate((draft) => {
          draft.username = user.username;
          draft.avatarUrl = user.avatar_url ?? undefined;
        });
      }
      return collection.prepareCreate((draft) => {
        draft.serverId = user.id;
        draft.username = user.username;
        draft.avatarUrl = user.avatar_url ?? undefined;
      });
    });

    await database.batch(...operations);
  });
}
