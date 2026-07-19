/**
 * Hook that observes locally cached messages for a room.
 *
 * Returns an array of API-shaped messages suitable for rendering when the
 * device is offline or while the server response is still loading.
 */

import { useEffect, useState } from "react";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import { Q } from "@nozbe/watermelondb";

import { dbMessageToApiMessage } from "../mappers";
import type { Message as DbMessage } from "../models/message";
import type { Message as ApiMessage } from "../../api/messages";

export function useLocalMessages(roomId: string | null): ApiMessage[] {
  const database = useDatabase();
  const [messages, setMessages] = useState<ApiMessage[]>([]);

  useEffect(() => {
    if (!roomId) return;

    const collection = database.get<DbMessage>("messages");
    const query = collection.query(
      Q.where("room_id", roomId),
      Q.sortBy("created_at", "asc"),
    );

    let mounted = true;
    query
      .fetch()
      .then((records) => {
        if (!mounted) return;
        setMessages(records.map(dbMessageToApiMessage));
      })
      .catch((err) => {
        console.warn("[useLocalMessages] initial fetch failed:", err);
      });

    const subscription = query.observe().subscribe((records) => {
      if (mounted) {
        setMessages(records.map(dbMessageToApiMessage));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [database, roomId]);

  return roomId ? messages : [];
}
