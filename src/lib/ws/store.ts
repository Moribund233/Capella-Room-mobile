import { create } from "zustand";
import type { WsConnectionState } from "./client";

interface WebSocketStore {
  connected: boolean;
  connectionState: WsConnectionState;
}

export const useWebSocketStore = create<WebSocketStore>(() => ({
  connected: false,
  connectionState: "disconnected",
}));
