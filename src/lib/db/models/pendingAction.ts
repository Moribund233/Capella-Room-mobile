/**
 * WatermelonDB PendingAction model.
 *
 * Represents an action that was requested while offline and needs to be
 * flushed to the server once connectivity is restored.
 */

import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

export type PendingActionType =
  | "send_message"
  | "edit_message"
  | "delete_message"
  | "add_reaction"
  | "remove_reaction"
  | "pin_message"
  | "unpin_message";

export type PendingActionStatus = "queued" | "processing" | "failed";

export class PendingAction extends Model {
  static override table = "pending_actions";

  @text("action_type") actionType!: PendingActionType;
  @text("payload_json") payloadJson!: string;
  @text("status") status!: PendingActionStatus;
  @field("retry_count") retryCount!: number;
  @text("error_message") errorMessage!: string | undefined;
  @field("created_at") createdAt!: number;
}
