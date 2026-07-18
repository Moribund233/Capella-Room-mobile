import { request } from "./client";
import type { Room } from "./rooms";

/* ─── Types ─────────────────────────────────────────────────── */

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  status: "online" | "offline" | "away";
  is_active?: boolean;
  role: "user" | "admin" | "super_admin";
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  message?: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface UserSettings {
  notification: {
    private_message: boolean;
    mentioned: boolean;
    sound_enabled: boolean;
    do_not_disturb: boolean;
  };
  privacy: {
    online_status_visibility: string;
    single_device_login: boolean;
  };
  message: {
    message_preview: boolean;
    read_receipt: boolean;
    typing_indicator: boolean;
  };
}

export interface Device {
  id: string;
  device_name: string;
  device_type: string;
  ip_address: string;
  location: string | null;
  is_current: boolean;
  is_active: boolean;
  is_blocked: boolean;
  last_active_at: string;
  created_at: string;
}

export interface LoginHistory {
  id: string;
  ip_address: string;
  device_name: string;
  device_type: string;
  location: string | null;
  login_status: string;
  risk_level: string;
  is_suspicious: boolean;
  failure_reason: string | null;
  created_at: string;
}

export interface UserStats {
  joined_rooms: number;
  total_messages: number;
  online_hours: number;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

/* ─── API Functions ─────────────────────────────────────────── */

export async function getMe(token: string): Promise<User> {
  return request<User>("/api/v1/users/me", { method: "GET" }, token);
}

export async function updateMe(
  token: string,
  data: { username?: string; avatar_url?: string },
): Promise<User> {
  return request<User>(
    "/api/v1/users/me",
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function changePassword(
  token: string,
  oldPassword: string,
  newPassword: string,
): Promise<string> {
  return request<string>(
    "/api/v1/users/me/password",
    {
      method: "PUT",
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    },
    token,
  );
}

export async function getMyRooms(token: string): Promise<Room[]> {
  return request<Room[]>(
    "/api/v1/users/me/rooms",
    { method: "GET" },
    token,
  );
}

export async function logout(token: string): Promise<string> {
  return request<string>(
    "/api/v1/users/logout",
    { method: "POST" },
    token,
  );
}

export async function getUsers(
  token: string,
  search?: string,
  limit?: number,
  offset?: number,
): Promise<PaginatedUsers> {
  const params = new URLSearchParams();
  if (search !== undefined) params.set("search", search);
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const path = `/api/v1/users${qs ? `?${qs}` : ""}`;
  return request<PaginatedUsers>(path, { method: "GET" }, token);
}

export async function searchUsers(
  token: string,
  keyword: string,
  limit?: number,
  offset?: number,
): Promise<PaginatedUsers> {
  const params = new URLSearchParams();
  params.set("keyword", keyword);
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const path = `/api/v1/users/search?${params.toString()}`;
  return request<PaginatedUsers>(path, { method: "GET" }, token);
}

export async function getUser(
  token: string,
  userId: string,
): Promise<User> {
  return request<User>(
    `/api/v1/users/${encodeURIComponent(userId)}`,
    { method: "GET" },
    token,
  );
}

export async function getFriends(token: string): Promise<User[]> {
  return request<User[]>(
    "/api/v1/users/friends",
    { method: "GET" },
    token,
  );
}

export async function sendFriendRequest(
  token: string,
  receiverId: string,
  message?: string,
): Promise<FriendRequest> {
  const body: Record<string, unknown> = { receiver_id: receiverId };
  if (message !== undefined) body.message = message;
  return request<FriendRequest>(
    "/api/v1/users/friends/requests",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    token,
  );
}

export async function getReceivedRequests(
  token: string,
): Promise<FriendRequest[]> {
  return request<FriendRequest[]>(
    "/api/v1/users/friends/requests/received",
    { method: "GET" },
    token,
  );
}

export async function getSentRequests(
  token: string,
): Promise<FriendRequest[]> {
  return request<FriendRequest[]>(
    "/api/v1/users/friends/requests/sent",
    { method: "GET" },
    token,
  );
}

export async function handleFriendRequest(
  token: string,
  requestId: string,
  action: "accept" | "reject",
): Promise<string> {
  return request<string>(
    "/api/v1/users/friends/requests/handle",
    {
      method: "POST",
      body: JSON.stringify({ request_id: requestId, action }),
    },
    token,
  );
}

export async function cancelFriendRequest(
  token: string,
  requestId: string,
): Promise<string> {
  return request<string>(
    `/api/v1/users/friends/requests/${encodeURIComponent(requestId)}`,
    { method: "DELETE" },
    token,
  );
}

export async function deleteFriend(
  token: string,
  userId: string,
): Promise<string> {
  return request<string>(
    `/api/v1/users/friends/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
    token,
  );
}

export async function deleteAccount(token: string): Promise<string> {
  return request<string>(
    "/api/v1/users/me",
    { method: "DELETE" },
    token,
  );
}

export async function getUserStats(token: string): Promise<UserStats> {
  return request<UserStats>(
    "/api/v1/users/me/stats",
    { method: "GET" },
    token,
  );
}

export async function getSettings(token: string): Promise<UserSettings> {
  return request<UserSettings>(
    "/api/v1/users/me/settings",
    { method: "GET" },
    token,
  );
}

export async function updateSettings(
  token: string,
  settings: Partial<UserSettings>,
): Promise<UserSettings> {
  return request<UserSettings>(
    "/api/v1/users/me/settings",
    {
      method: "PATCH",
      body: JSON.stringify(settings),
    },
    token,
  );
}

export async function getDevices(token: string): Promise<Device[]> {
  return request<Device[]>(
    "/api/v1/users/me/devices",
    { method: "GET" },
    token,
  );
}

export async function terminateDevice(
  token: string,
  deviceId: string,
): Promise<string> {
  return request<string>(
    `/api/v1/users/me/devices/${encodeURIComponent(deviceId)}`,
    { method: "DELETE" },
    token,
  );
}

export async function blockDevice(
  token: string,
  deviceId: string,
): Promise<string> {
  return request<string>(
    `/api/v1/users/me/devices/${encodeURIComponent(deviceId)}/block`,
    { method: "POST" },
    token,
  );
}

export async function unblockDevice(
  token: string,
  deviceId: string,
): Promise<string> {
  return request<string>(
    `/api/v1/users/me/devices/${encodeURIComponent(deviceId)}/unblock`,
    { method: "POST" },
    token,
  );
}

export async function getLoginHistory(
  token: string,
  limit?: number,
  offset?: number,
): Promise<{
  login_history: LoginHistory[];
  pagination: { total: number; limit: number; offset: number };
}> {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const path = `/api/v1/users/me/login-history${qs ? `?${qs}` : ""}`;
  return request(path, { method: "GET" }, token);
}
