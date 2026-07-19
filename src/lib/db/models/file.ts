/**
 * WatermelonDB File model.
 *
 * Stores cached file resource metadata for local indexing and offline
 * file previews.
 */

import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

export class File extends Model {
  static override table = "files";

  @text("server_id") serverId!: string;
  @text("original_name") originalName!: string;
  @text("file_url") fileUrl!: string;
  @field("file_size") fileSize!: number;
  @text("mime_type") mimeType!: string;
  @text("category") category!: string;
  @text("usage_type") usageType!: string;
  @text("uploader_id") uploaderId!: string | undefined;
  @text("uploader_username") uploaderUsername!: string | undefined;
  @text("uploader_avatar_url") uploaderAvatarUrl!: string | undefined;
  @text("message_id") messageId!: string | undefined;
  @field("created_at") createdAt!: number;
}
