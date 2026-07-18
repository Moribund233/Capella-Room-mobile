/**
 * Tests for WebSocket hook helpers that mutate React Query cache.
 */

import { InfiniteData } from "@tanstack/react-query";
import { appendMessageToCache } from "./hooks";
import { queryClient } from "../hooks/queryClient";
import { messageKeys } from "../hooks/useMessagesQuery";
import type { MessagesResponse, Message } from "../api/messages";

const roomId = "room-1";

function createMessage(id: string, content: string): Message {
  return {
    id,
    room_id: roomId,
    sender: { id: "user-1", username: "tester", avatar_url: null },
    content,
    message_type: "text",
    reply_to: null,
    reply_to_message: null,
    is_deleted: false,
    created_at: "2026-01-01T00:00:00Z",
  };
}

function seedCache(messages: Message[]) {
  const data: InfiniteData<MessagesResponse> = {
    pages: [
      { messages, total: messages.length, has_more: false },
      { messages: [createMessage("old-1", "older page")], total: 1, has_more: false },
    ],
    pageParams: [undefined, "old-1"],
  };
  queryClient.setQueryData<InfiniteData<MessagesResponse>>(
    messageKeys.list(roomId),
    data,
  );
  return data;
}

describe("appendMessageToCache", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it("appends the new message to the first page only", () => {
    const original = seedCache([createMessage("msg-1", "hello")]);
    const newMessage = createMessage("msg-2", "world");

    appendMessageToCache(roomId, newMessage);

    const updated = queryClient.getQueryData<InfiniteData<MessagesResponse>>(
      messageKeys.list(roomId),
    );
    expect(updated).toBeDefined();
    expect(updated!.pages[0].messages).toHaveLength(2);
    expect(updated!.pages[0].messages[1]).toEqual(newMessage);
    // Older pages must remain untouched.
    expect(updated!.pages[1]).toEqual(original.pages[1]);
  });

  it("does nothing when the cache has not been populated yet", () => {
    const newMessage = createMessage("msg-3", "orphan");

    expect(() => appendMessageToCache(roomId, newMessage)).not.toThrow();

    const cached = queryClient.getQueryData<InfiniteData<MessagesResponse>>(
      messageKeys.list(roomId),
    );
    expect(cached).toBeUndefined();
  });
});
