/**
 * WatermelonDB database singleton.
 *
 * This module creates the SQLite-backed database used for local caching of
 * messages, rooms, files and the offline action queue.
 */

import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import { mySchema } from "./schema";
import { Message, Room, File, PendingAction, User } from "./models";

const adapter = new SQLiteAdapter({
  schema: mySchema,
  dbName: "capella_room",
  // Migrations will be added here when the schema changes.
});

export const database = new Database({
  adapter,
  modelClasses: [Message, Room, File, PendingAction, User],
});

/**
 * Reset all local cached data. Should be called on logout.
 */
export async function resetLocalDatabase(): Promise<void> {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
}
