import { request } from "./client";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null);
  if (entries.length === 0) return "";
  return (
    "?" +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&")
  );
}

export async function getNotifications(
  limit?: number,
  offset?: number,
): Promise<Notification[]> {
  return request<Notification[]>(
    `/api/v1/notifications${buildQuery({ limit, offset })}`,
    { method: "GET" },
  );
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return request<{ count: number }>("/api/v1/notifications/unread-count", {
    method: "GET",
  });
}

export async function markRead(notificationId: string): Promise<unknown> {
  return request(`/api/v1/notifications/${notificationId}/read`, { method: "POST" });
}

export async function markAllRead(): Promise<unknown> {
  return request("/api/v1/notifications/read-all", { method: "POST" });
}

export type { Notification };
