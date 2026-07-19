/**
 * Hook that writes fetched server messages into the local DB.
 *
 * This is a write-through cache: React Query keeps the authoritative server
 * state, and this hook persists a copy for offline fallback.
 */

import { useEffect, useRef } from "react";

import { syncMessages } from "../sync";
import type { Message } from "../../api/messages";

function buildMessageFingerprint(messages: Message[]): string {
  // A compact fingerprint that captures insertions and deletions.
  // Content edits are handled by the WebSocket sync path.
  return messages.map((m) => m.id).join(",");
}

export function useMessagesSync(
  roomId: string | null,
  messages: Message[] | undefined,
): void {
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId || !messages || messages.length === 0) return;

    const fingerprint = buildMessageFingerprint(messages);
    if (lastFingerprintRef.current === fingerprint) return;
    lastFingerprintRef.current = fingerprint;

    syncMessages(roomId, messages).catch((err) => {
      console.warn("[useMessagesSync] failed:", err);
    });
  }, [roomId, messages]);
}
