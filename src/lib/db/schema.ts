/**
 * WatermelonDB schema for local caching.
 *
 * Tables:
 * - messages: cached chat messages with sender denormalization.
 * - rooms: cached room metadata with last message denormalization.
 * - files: cached file resource metadata for local indexing.
 * - pending_actions: offline action queue.
 * - users: cached sender profiles.
 */

import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const DB_SCHEMA_VERSION = 1;

export const mySchema = appSchema({
  version: DB_SCHEMA_VERSION,
  tables: [
    tableSchema({
      name: "messages",
      columns: [
        { name: "server_id", type: "string", isOptional: true },
        { name: "room_id", type: "string" },
        { name: "sender_id", type: "string" },
        { name: "sender_username", type: "string" },
        { name: "sender_avatar_url", type: "string", isOptional: true },
        { name: "content", type: "string" },
        { name: "message_type", type: "string" },
        { name: "reply_to", type: "string", isOptional: true },
        { name: "reply_to_message_json", type: "string", isOptional: true },
        { name: "file_url", type: "string", isOptional: true },
        { name: "is_deleted", type: "boolean" },
        { name: "is_edited", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "edited_at", type: "number", isOptional: true },
        { name: "reactions_json", type: "string", isOptional: true },
        { name: "local_status", type: "string" },
      ],
    }),
    tableSchema({
      name: "rooms",
      columns: [
        { name: "server_id", type: "string" },
        { name: "name", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "owner_id", type: "string" },
        { name: "owner_username", type: "string" },
        { name: "owner_avatar_url", type: "string", isOptional: true },
        { name: "is_private", type: "boolean" },
        { name: "max_members", type: "number" },
        { name: "member_count", type: "number" },
        { name: "unread_count", type: "number", isOptional: true },
        { name: "last_message_id", type: "string", isOptional: true },
        { name: "last_message_content", type: "string", isOptional: true },
        { name: "last_message_sender_name", type: "string", isOptional: true },
        { name: "last_message_created_at", type: "number", isOptional: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "files",
      columns: [
        { name: "server_id", type: "string" },
        { name: "original_name", type: "string" },
        { name: "file_url", type: "string" },
        { name: "file_size", type: "number" },
        { name: "mime_type", type: "string" },
        { name: "category", type: "string" },
        { name: "usage_type", type: "string" },
        { name: "uploader_id", type: "string", isOptional: true },
        { name: "uploader_username", type: "string", isOptional: true },
        { name: "uploader_avatar_url", type: "string", isOptional: true },
        { name: "message_id", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "pending_actions",
      columns: [
        { name: "action_type", type: "string" },
        { name: "payload_json", type: "string" },
        { name: "status", type: "string" },
        { name: "retry_count", type: "number" },
        { name: "error_message", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "users",
      columns: [
        { name: "server_id", type: "string" },
        { name: "username", type: "string" },
        { name: "avatar_url", type: "string", isOptional: true },
        { name: "status", type: "string", isOptional: true },
      ],
    }),
  ],
});
