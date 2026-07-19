/**
 * WatermelonDB Message model.
 *
 * Stores cached chat messages with denormalized sender info so that offline
 * message lists can render without joining the users table.
 */

import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

export class Message extends Model {
  static override table = "messages";

  @text("server_id") serverId!: string | undefined;
  @text("room_id") roomId!: string;
  @text("sender_id") senderId!: string;
  @text("sender_username") senderUsername!: string;
  @text("sender_avatar_url") senderAvatarUrl!: string | undefined;
  @text("content") content!: string;
  @text("message_type") messageType!: string;
  @text("reply_to") replyTo!: string | undefined;
  @text("reply_to_message_json") replyToMessageJson!: string | undefined;
  @text("file_url") fileUrl!: string | undefined;
  @field("is_deleted") isDeleted!: boolean;
  @field("is_edited") isEdited!: boolean;
  @field("created_at") createdAt!: number;
  @field("edited_at") editedAt!: number | undefined;
  @text("reactions_json") reactionsJson!: string | undefined;
  @text("local_status") localStatus!: "synced" | "pending" | "failed";
}
