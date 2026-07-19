/**
 * Tests for WatermelonDB sync utilities.
 */

import { syncMessages, markLocalMessageDeleted } from "../sync";
import type { Message } from "../../api/messages";

jest.mock("../database", () => ({
  database: {
    get: jest.fn(),
    write: jest.fn(async (fn: () => Promise<void>) => await fn()),
    batch: jest.fn(async (...records: unknown[]) => records),
  },
}));

const mockedDatabase = jest.requireMock("../database").database as {
  get: jest.Mock;
  write: jest.Mock;
  batch: jest.Mock;
};

function createMessage(id: string, content: string): Message {
  return {
    id,
    room_id: "room-1",
    sender: { id: "user-1", username: "tester", avatar_url: null },
    content,
    message_type: "text",
    reply_to: null,
    reply_to_message: null,
    file_url: null,
    is_deleted: false,
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("syncMessages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates new records when no existing messages are present", async () => {
    const collection = {
      query: jest.fn().mockReturnValue({
        fetch: jest.fn().mockResolvedValue([]),
      }),
      prepareCreate: jest.fn((fn) => {
        const draft: Record<string, unknown> = {};
        fn(draft);
        return { ...draft, _op: "create" };
      }),
    };
    mockedDatabase.get.mockReturnValue(collection);

    await syncMessages("room-1", [createMessage("msg-1", "hello")]);

    expect(collection.prepareCreate).toHaveBeenCalledTimes(1);
    expect(mockedDatabase.batch).toHaveBeenCalledTimes(1);
  });

  it("updates existing records matched by server_id", async () => {
    const existing = {
      serverId: "msg-1",
      prepareUpdate: jest.fn((fn) => {
        const draft: Record<string, unknown> = { serverId: "msg-1" };
        fn(draft);
        return { ...draft, _op: "update" };
      }),
    };
    const collection = {
      query: jest.fn().mockReturnValue({
        fetch: jest.fn().mockResolvedValue([existing]),
      }),
      prepareCreate: jest.fn(),
    };
    mockedDatabase.get.mockReturnValue(collection);

    await syncMessages("room-1", [createMessage("msg-1", "updated")]);

    expect(existing.prepareUpdate).toHaveBeenCalledTimes(1);
    expect(collection.prepareCreate).not.toHaveBeenCalled();
  });

  it("returns early for an empty message list", async () => {
    await syncMessages("room-1", []);

    expect(mockedDatabase.get).not.toHaveBeenCalled();
    expect(mockedDatabase.batch).not.toHaveBeenCalled();
  });
});

describe("markLocalMessageDeleted", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks a matching message as deleted and clears content", async () => {
    const record = {
      update: jest.fn(async (fn: (draft: Record<string, unknown>) => void) => {
        const draft: Record<string, unknown> = {};
        fn(draft);
        return draft;
      }),
    };
    const collection = {
      query: jest.fn().mockReturnValue({
        fetch: jest.fn().mockResolvedValue([record]),
      }),
    };
    mockedDatabase.get.mockReturnValue(collection);

    await markLocalMessageDeleted("room-1", "msg-1");

    expect(record.update).toHaveBeenCalledTimes(1);
    const updated = (await record.update.mock.results[0].value) as Record<
      string,
      unknown
    >;
    expect(updated.isDeleted).toBe(true);
    expect(updated.content).toBe("");
  });

  it("does nothing when the message is not found", async () => {
    const collection = {
      query: jest.fn().mockReturnValue({
        fetch: jest.fn().mockResolvedValue([]),
      }),
    };
    mockedDatabase.get.mockReturnValue(collection);

    await expect(markLocalMessageDeleted("room-1", "missing")).resolves.toBeUndefined();

    expect(collection.query).toHaveBeenCalled();
  });
});
