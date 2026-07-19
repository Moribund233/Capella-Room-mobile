/**
 * WatermelonDB Room model.
 *
 * Stores cached room metadata with denormalized last message info for the
 * recent rooms list.
 */

import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

export class Room extends Model {
  static override table = "rooms";

  @text("server_id") serverId!: string;
  @text("name") name!: string;
  @text("description") description!: string | undefined;
  @text("owner_id") ownerId!: string;
  @text("owner_username") ownerUsername!: string;
  @text("owner_avatar_url") ownerAvatarUrl!: string | undefined;
  @field("is_private") isPrivate!: boolean;
  @field("max_members") maxMembers!: number;
  @field("member_count") memberCount!: number;
  @field("unread_count") unreadCount!: number | undefined;
  @text("last_message_id") lastMessageId!: string | undefined;
  @text("last_message_content") lastMessageContent!: string | undefined;
  @text("last_message_sender_name") lastMessageSenderName!: string | undefined;
  @field("last_message_created_at") lastMessageCreatedAt!: number | undefined;
  @field("created_at") createdAt!: number;
  @field("updated_at") updatedAt!: number;
}
