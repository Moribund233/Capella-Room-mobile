import { WS_BASE_URL } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useWebSocketStore } from "./store";
import type { WsIncomingMessage, WsEventType } from "./types";

/* ─── Connection States ────────────────────────────────── */

export type WsConnectionState =
  | "disconnected"
  | "connecting"
  | "authenticating"
  | "connected"
  | "reconnecting";

/* ─── Event Listeners ──────────────────────────────────── */

type EventCallback<T = unknown> = (payload: T) => void;
type StatusCallback = (state: WsConnectionState) => void;

/* ─── Reconnect Config ─────────────────────────────────── */

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_TIMEOUT_MS = 95000; // slightly less than server's 90s

/* ─── WebSocket Client ─────────────────────────────────── */

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private connectionState: WsConnectionState = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastPingTime = 0;
  private lastDisconnectAt: string | null = null;

  /* Event listeners */
  private eventListeners = new Map<string, Set<EventCallback>>();
  private statusListeners = new Set<StatusCallback>();

  constructor(baseUrl: string) {
    this.url = baseUrl.replace(/^http/, "ws") + "/ws";
  }

  /* ── Public API ─────────────────────────────────────── */

  get state(): WsConnectionState {
    return this.connectionState;
  }

  /** Connect & authenticate using the current token from auth store */
  connect(): void {
    if (
      this.connectionState === "connecting" ||
      this.connectionState === "authenticating"
    ) {
      return;
    }

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      console.warn("[WS] No token available — cannot connect");
      return;
    }

    this.setConnectionState("connecting");
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("[WS] Connected, authenticating...");
      this.setConnectionState("authenticating");
      this.reconnectAttempts = 0;
      this.sendMessage("Auth", { token });
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg: WsIncomingMessage = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.warn("[WS] Failed to parse message:", event.data);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log(`[WS] Closed (code=${event.code})`);
      this.cleanup();
      this.handleReconnect();
    };

    this.ws.onerror = (error: Event) => {
      console.warn("[WS] Error:", error);
    };
  }

  /** Disconnect gracefully (no auto-reconnect) */
  disconnect(): void {
    this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // prevent reconnect
    this.cleanup();
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.setConnectionState("disconnected");
  }

  /** Send a message (type + optional payload) */
  send(type: string, payload?: Record<string, unknown>): void {
    this.sendMessage(type, payload);
  }

  /** Send JSON-serializable raw payload */
  sendRaw(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("[WS] Cannot send — not connected");
    }
  }

  /** Register an event listener. Returns unsubscribe function. */
  on<T = unknown>(event: WsEventType, callback: EventCallback<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as EventCallback);
    return () => {
      this.eventListeners.get(event)?.delete(callback as EventCallback);
    };
  }

  /** Listen for connection state changes */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    // Immediately notify current state
    callback(this.connectionState);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /* ── Internal Message Router ─────────────────────────── */

  private handleMessage(msg: WsIncomingMessage): void {
    switch (msg.type) {
      /* ── Auth ── */
      case "AuthResult":
        if (msg.payload.success) {
          this.setConnectionState("connected");
          this.startHeartbeatMonitor();
          console.log("[WS] Authenticated successfully");
        } else {
          console.error("[WS] Auth failed:", msg.payload.message);
          this.ws?.close();
          this.setConnectionState("disconnected");
        }
        break;

      /* ── Reconnect ── */
      case "ReconnectResult":
        if (msg.payload.success) {
          this.setConnectionState("connected");
          this.startHeartbeatMonitor();
          console.log(
            "[WS] Reconnected, rooms to rejoin:",
            msg.payload.rooms_to_rejoin,
          );
        } else {
          console.error("[WS] Reconnect failed:", msg.payload.message);
          this.ws?.close();
          this.setConnectionState("disconnected");
        }
        break;

      case "SessionRestored":
        console.log(
          `[WS] Session restored: ${msg.payload.rooms_restored} rooms, ${msg.payload.total_unread} unread`,
        );
        break;

      /* ── Heartbeat ── */
      case "Ping":
        this.lastPingTime = Date.now();
        this.sendMessage("Pong");
        break;

      /* ── Error ── */
      case "Error":
        console.error("[WS] Server error:", msg.payload.code, msg.payload.message);
        if (msg.payload.code === "TOKEN_EXPIRED") {
          this.handleTokenExpired();
        }
        break;
    }

    /* Dispatch to registered listeners */
    this.dispatch(msg.type, (msg as any).payload);
  }

  /* ── Auth Helpers ────────────────────────────────────── */

  private async handleTokenExpired(): Promise<void> {
    console.log("[WS] Token expired — attempting refresh...");
    const newToken = await useAuthStore.getState().refreshAccessToken();
    if (newToken) {
      this.disconnect();
      this.connect();
    } else {
      console.error("[WS] Token refresh failed — staying disconnected");
      this.disconnect();
      useAuthStore.getState().logout();
    }
  }

  /* ── Reconnect ───────────────────────────────────────── */

  private handleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("[WS] Max reconnect attempts reached");
      this.setConnectionState("disconnected");
      return;
    }

    this.setConnectionState("reconnecting");
    this.reconnectAttempts++;

    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempts - 1),
      RECONNECT_MAX_MS,
    );

    console.log(
      `[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.lastDisconnectAt = new Date().toISOString();
      this.connect();
    }, delay);
  }

  /* ── Heartbeat ───────────────────────────────────────── */

  private startHeartbeatMonitor(): void {
    this.stopHeartbeatMonitor();
    this.lastPingTime = Date.now();

    this.heartbeatTimer = setInterval(() => {
      const elapsed = Date.now() - this.lastPingTime;
      if (elapsed > HEARTBEAT_TIMEOUT_MS) {
        console.warn("[WS] Heartbeat timeout — reconnecting...");
        this.cleanup();
        this.handleReconnect();
      }
    }, 15000); // check every 15s
  }

  private stopHeartbeatMonitor(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /* ── Helpers ─────────────────────────────────────────── */

  private sendMessage(type: string, payload?: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const msg = payload !== undefined ? { type, payload } : { type };
      this.ws.send(JSON.stringify(msg));
    }
  }

  private cleanup(): void {
    this.stopHeartbeatMonitor();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setConnectionState(state: WsConnectionState): void {
    this.connectionState = state;
    // Sync to Zustand store (admin-ui pattern)
    useWebSocketStore.setState({
      connectionState: state,
      connected: state === "connected",
    });
    this.statusListeners.forEach((cb) => cb(state));
  }

  private dispatch(type: string, payload: unknown): void {
    const handlers = this.eventListeners.get(type);
    if (handlers) {
      handlers.forEach((cb) => cb(payload));
    }
    // Also dispatch to wildcard "message" listener
    const messageHandlers = this.eventListeners.get("message" as any);
    if (messageHandlers) {
      messageHandlers.forEach((cb) => cb({ type, payload }));
    }
  }
}

/* ─── Singleton ─────────────────────────────────────────── */

let instance: WebSocketClient | null = null;

export function getWsClient(): WebSocketClient {
  if (!instance) {
    instance = new WebSocketClient(WS_BASE_URL);
  }
  return instance;
}

export function resetWsClient(): void {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
}
