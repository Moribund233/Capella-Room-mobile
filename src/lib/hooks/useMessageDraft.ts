/**
 * Persist the message input draft for a room using secure storage.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

const DRAFT_KEY_PREFIX = "message_draft_";

async function loadDraft(roomId: string): Promise<string> {
  try {
    const value = await SecureStore.getItemAsync(`${DRAFT_KEY_PREFIX}${roomId}`);
    return value ?? "";
  } catch {
    return "";
  }
}

async function saveDraft(roomId: string, text: string) {
  try {
    if (!text.trim()) {
      await SecureStore.deleteItemAsync(`${DRAFT_KEY_PREFIX}${roomId}`);
    } else {
      await SecureStore.setItemAsync(`${DRAFT_KEY_PREFIX}${roomId}`, text);
    }
  } catch {
    // Silently ignore secure store errors.
  }
}

/**
 * React hook that keeps a per-room message draft in sync with secure storage.
 *
 * @param roomId - The room identifier.
 * @returns A tuple `[text, setText]` similar to `useState`.
 */
export function useMessageDraft(roomId: string): [string, (text: string) => void] {
  const [text, setTextState] = useState("");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    loadDraft(roomId).then((draft) => {
      if (mounted) setTextState(draft);
    });
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const setText = useCallback(
    (value: string) => {
      setTextState(value);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveDraft(roomId, value), 500);
    },
    [roomId],
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      // Flush the latest draft on unmount.
      saveDraft(roomId, text);
    };
  }, [roomId, text]);

  return [text, setText];
}
