/**
 * Local database queries used for offline fallback and fast local search.
 */

import { Q } from "@nozbe/watermelondb";

import { database } from "./database";
import { dbMessageToApiMessage, dbRoomToApiRoom, dbFileToFileInfo } from "./mappers";
import type { Message } from "./models/message";
import type { Room } from "./models/room";
import type { File } from "./models/file";
import type { Message as ApiMessage } from "../api/messages";
import type { Room as ApiRoom } from "../api/rooms";
import type { FileInfo } from "../api/files";

const DEFAULT_LOCAL_LIMIT = 500;

/**
 * Fetch cached messages for a room, newest last, suitable for appending to
 * a chat view.
 */
export async function getMessagesForRoom(
  roomId: string,
  limit = DEFAULT_LOCAL_LIMIT,
): Promise<ApiMessage[]> {
  const collection = database.get<Message>("messages");
  const records = await collection
    .query(Q.where("room_id", roomId), Q.sortBy("created_at", "asc"), Q.take(limit))
    .fetch();

  return records.map(dbMessageToApiMessage);
}

/**
 * Full-text-ish local search over cached message content.
 */
export async function searchMessages(
  query: string,
  roomId?: string,
  limit = 50,
): Promise<ApiMessage[]> {
  const collection = database.get<Message>("messages");
  const likePattern = `%${query}%`;

  const conditions: Q.Clause[] = [Q.where("content", Q.like(likePattern))];
  if (roomId) {
    conditions.unshift(Q.where("room_id", roomId));
  }

  const records = await collection
    .query(...conditions, Q.sortBy("created_at", "desc"), Q.take(limit))
    .fetch();

  return records.map(dbMessageToApiMessage);
}

/**
 * Fetch cached rooms ordered by most recent update.
 */
export async function getRooms(): Promise<ApiRoom[]> {
  const collection = database.get<Room>("rooms");
  const records = await collection.query(Q.sortBy("updated_at", "desc")).fetch();

  return records.map(dbRoomToApiRoom);
}

/**
 * Local search over cached file metadata.
 */
export async function searchFiles(query: string, limit = 50): Promise<FileInfo[]> {
  const collection = database.get<File>("files");
  const likePattern = `%${query}%`;

  const records = await collection
    .query(
      Q.or(
        Q.where("original_name", Q.like(likePattern)),
        Q.where("mime_type", Q.like(likePattern)),
      ),
      Q.sortBy("created_at", "desc"),
      Q.take(limit),
    )
    .fetch();

  return records.map(dbFileToFileInfo);
}
