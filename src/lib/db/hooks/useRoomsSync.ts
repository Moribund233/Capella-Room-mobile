/**
 * Hook that writes fetched server rooms into the local DB.
 */

import { useEffect, useRef } from "react";

import { syncRooms } from "../sync";
import type { Room } from "../../api/rooms";

function buildRoomFingerprint(rooms: Room[]): string {
  return rooms.map((r) => r.id).join(",");
}

export function useRoomsSync(rooms: Room[] | undefined): void {
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (!rooms || rooms.length === 0) return;

    const fingerprint = buildRoomFingerprint(rooms);
    if (lastFingerprintRef.current === fingerprint) return;
    lastFingerprintRef.current = fingerprint;

    syncRooms(rooms).catch((err) => {
      console.warn("[useRoomsSync] failed:", err);
    });
  }, [rooms]);
}
