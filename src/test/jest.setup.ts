/**
 * Jest setup: MSW native server, native module mocks and query client reset.
 */

import "@testing-library/react-native";
import { setupServer } from "msw/native";
import { queryClient } from "@/lib/hooks/queryClient";
import { handlers } from "./server";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-font", () => ({
  useFonts: () => [true],
}));

jest.mock("@nozbe/watermelondb", () => ({
  Database: class Database {
    adapter = {};
    modelClasses = [];
    constructor(opts: Record<string, unknown>) {
      this.adapter = opts.adapter as Record<string, unknown>;
      this.modelClasses = opts.modelClasses as [];
    }
    get = jest.fn(() => ({
      query: jest.fn(() => ({
        observe: jest.fn(() => ({ subscribe: jest.fn() })),
        fetch: jest.fn(() => Promise.resolve([])),
      })),
      find: jest.fn(() => Promise.resolve(null)),
      create: jest.fn(() => Promise.resolve({})),
    }));
    write = jest.fn(async (fn: () => Promise<void>) => await fn());
    batch = jest.fn(async (records: unknown[]) => records);
    unsafeResetDatabase = jest.fn(() => Promise.resolve());
  },
  appSchema: jest.fn((schema) => schema),
  tableSchema: jest.fn((table) => table),
  Model: class Model {
    static table = "";
    update = jest.fn();
    prepareUpdate = jest.fn((fn) => {
      if (fn) fn(this);
      return this;
    });
    markAsDeleted = jest.fn();
    destroyPermanently = jest.fn();
  },
  field: jest.fn(() => () => {}),
  date: jest.fn(() => () => {}),
  bool: jest.fn(() => () => {}),
  text: jest.fn(() => () => {}),
  readonly: jest.fn(() => () => {}),
  relation: jest.fn(() => () => {}),
  children: jest.fn(() => () => {}),
  lazy: jest.fn(() => () => {}),
  Q: {
    where: jest.fn((...args) => args),
    sortBy: jest.fn((...args) => args),
    take: jest.fn((...args) => args),
    skip: jest.fn((...args) => args),
    like: jest.fn((...args) => args),
    eq: jest.fn((...args) => args),
    gt: jest.fn((...args) => args),
    gte: jest.fn((...args) => args),
    lt: jest.fn((...args) => args),
    lte: jest.fn((...args) => args),
    and: jest.fn((...args) => args),
    or: jest.fn((...args) => args),
    notIn: jest.fn((...args) => args),
    asc: jest.fn(() => "asc"),
    desc: jest.fn(() => "desc"),
  },
}));

jest.mock("@nozbe/watermelondb/adapters/sqlite", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    schema: jest.fn(),
    migrations: jest.fn(),
  })),
}));

jest.mock("@nozbe/watermelondb/DatabaseProvider", () => ({
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => children,
  withDatabase: jest.fn((component) => component),
}));

jest.mock("@nozbe/watermelondb/hooks", () => ({
  useDatabase: jest.fn(() => ({
    get: jest.fn(),
    collections: {
      get: jest.fn(() => ({
        query: jest.fn(() => ({
          observe: jest.fn(() => ({ subscribe: jest.fn() })),
          fetch: jest.fn(() => Promise.resolve([])),
        })),
        find: jest.fn(() => Promise.resolve(null)),
        create: jest.fn(() => Promise.resolve({})),
      })),
    },
    write: jest.fn(async (fn) => await fn()),
    batch: jest.fn(async (records) => records),
    unsafeResetDatabase: jest.fn(() => Promise.resolve()),
  })),
}));

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

beforeEach(() => {
  queryClient.clear();
});

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
