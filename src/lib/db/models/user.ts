/**
 * WatermelonDB User model.
 *
 * Stores cached sender profiles so that offline views can render avatars
 * and usernames without refetching.
 */

import { Model } from "@nozbe/watermelondb";
import { text } from "@nozbe/watermelondb/decorators";

export class User extends Model {
  static override table = "users";

  @text("server_id") serverId!: string;
  @text("username") username!: string;
  @text("avatar_url") avatarUrl!: string | undefined;
  @text("status") status!: string | undefined;
}
