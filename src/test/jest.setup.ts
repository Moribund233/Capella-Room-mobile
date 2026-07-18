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

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

beforeEach(() => {
  queryClient.clear();
});

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
