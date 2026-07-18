import { request } from './client';

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
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

export async function getNotifications(
  token: string,
  limit?: number,
  offset?: number,
): Promise<Notification[]> {
  return request<Notification[]>(
    `/api/v1/notifications${buildQuery({ limit, offset })}`,
    { method: 'GET' },
    token,
  );
}

export async function getUnreadCount(
  token: string,
): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/v1/notifications/unread-count',
    { method: 'GET' },
    token,
  );
}

export async function markRead(
  token: string,
  notificationId: string,
): Promise<unknown> {
  return request(
    `/api/v1/notifications/${notificationId}/read`,
    { method: 'POST' },
    token,
  );
}

export async function markAllRead(
  token: string,
): Promise<unknown> {
  return request(
    '/api/v1/notifications/read-all',
    { method: 'POST' },
    token,
  );
}

export type { Notification };
