/**
 * Hook that observes locally cached rooms for the home screen.
 */

import { useEffect, useState } from "react";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import { Q } from "@nozbe/watermelondb";

import { dbRoomToApiRoom } from "../mappers";
import type { Room as DbRoom } from "../models/room";
import type { Room as ApiRoom } from "../../api/rooms";

export function useLocalRooms(): ApiRoom[] {
  const database = useDatabase();
  const [rooms, setRooms] = useState<ApiRoom[]>([]);

  useEffect(() => {
    const collection = database.get<DbRoom>("rooms");
    const query = collection.query(Q.sortBy("updated_at", "desc"));

    let mounted = true;
    query
      .fetch()
      .then((records) => {
        if (!mounted) return;
        setRooms(records.map(dbRoomToApiRoom));
      })
      .catch((err) => {
        console.warn("[useLocalRooms] initial fetch failed:", err);
      });

    const subscription = query.observe().subscribe((records) => {
      if (mounted) {
        setRooms(records.map(dbRoomToApiRoom));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [database]);

  return rooms;
}
