import { request } from "./client";

/* ─── Types ─────────────────────────────────────────────────── */

export interface RoomOwner {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface LastMessage {
  id: string;
  content: string;
  sender_name: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  owner: RoomOwner;
  is_private: boolean;
  max_members: number;
  member_count: number;
  unread_count?: number;
  last_message?: LastMessage | null;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  username: string;
  email: string;
  avatar_url: string | null;
  user_status: string;
}

export interface CreateRoomPayload {
  name: string;
  description?: string;
  is_private: boolean;
  max_members?: number;
}

export interface DirectRoom {
  id: string;
  name: string;
  target_user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  created_at: string;
}

export interface Invitation {
  id: string;
  room_id: string;
  inviter: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  invite_code: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ValidateInviteResult {
  valid: boolean;
  room_id?: string;
  expires_at?: string;
  max_uses?: number;
  used_count?: number;
}

/* ─── API Functions ─────────────────────────────────────────── */

export async function getRooms(
  token: string,
  search?: string,
  limit?: number,
  offset?: number,
): Promise<Room[]> {
  const params = new URLSearchParams();
  if (search !== undefined) params.set("search", search);
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const path = `/api/v1/rooms${qs ? `?${qs}` : ""}`;
  return request<Room[]>(path, { method: "GET" }, token);
}

export async function createRoom(
  token: string,
  payload: CreateRoomPayload,
): Promise<Room> {
  return request<Room>(
    "/api/v1/rooms",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function getRoom(
  token: string,
  roomId: string,
): Promise<Room> {
  return request<Room>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}`,
    { method: "GET" },
    token,
  );
}

export async function updateRoom(
  token: string,
  roomId: string,
  payload: Partial<CreateRoomPayload>,
): Promise<Room> {
  return request<Room>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteRoom(
  token: string,
  roomId: string,
): Promise<string> {
  return request<string>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}`,
    { method: "DELETE" },
    token,
  );
}

export async function joinRoom(
  token: string,
  roomId: string,
): Promise<string> {
  return request<string>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}/join`,
    { method: "POST" },
    token,
  );
}

export async function leaveRoom(
  token: string,
  roomId: string,
): Promise<string> {
  return request<string>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}/leave`,
    { method: "DELETE" },
    token,
  );
}

export async function getMembers(
  token: string,
  roomId: string,
): Promise<RoomMember[]> {
  return request<RoomMember[]>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}/members`,
    { method: "GET" },
    token,
  );
}

export async function kickMember(
  token: string,
  roomId: string,
  userId: string,
): Promise<string> {
  return request<string>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
    token,
  );
}

export async function setMemberRole(
  token: string,
  roomId: string,
  userId: string,
  role: "owner" | "admin" | "member",
): Promise<string> {
  return request<string>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(userId)}/role`,
    {
      method: "PUT",
      body: JSON.stringify({ role }),
    },
    token,
  );
}

export async function getDirectRoom(
  token: string,
  targetUserId: string,
): Promise<DirectRoom> {
  return request<DirectRoom>(
    "/api/v1/rooms/direct",
    {
      method: "POST",
      body: JSON.stringify({ target_user_id: targetUserId }),
    },
    token,
  );
}

export async function getDirectRooms(
  token: string,
): Promise<DirectRoom[]> {
  return request<DirectRoom[]>(
    "/api/v1/rooms/direct/list",
    { method: "GET" },
    token,
  );
}

export async function joinByInvite(
  token: string,
  inviteCode: string,
): Promise<string> {
  return request<string>(
    "/api/v1/rooms/join-by-invite",
    {
      method: "POST",
      body: JSON.stringify({ invite_code: inviteCode }),
    },
    token,
  );
}

export async function validateInvite(
  token: string,
  inviteCode: string,
): Promise<ValidateInviteResult> {
  const path = `/api/v1/rooms/validate-invite?invite_code=${encodeURIComponent(inviteCode)}`;
  return request<ValidateInviteResult>(path, { method: "GET" }, token);
}

export async function getInvitations(
  token: string,
  roomId: string,
): Promise<Invitation[]> {
  return request<Invitation[]>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}/invitations`,
    { method: "GET" },
    token,
  );
}

export async function createInvitation(
  token: string,
  roomId: string,
  expiresInHours?: number,
  maxUses?: number,
): Promise<Invitation> {
  const body: Record<string, unknown> = {};
  if (expiresInHours !== undefined) body.expires_in_hours = expiresInHours;
  if (maxUses !== undefined) body.max_uses = maxUses;
  return request<Invitation>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}/invitations`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    token,
  );
}

export async function deleteInvitation(
  token: string,
  roomId: string,
  invitationId: string,
): Promise<string> {
  return request<string>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}/invitations/${encodeURIComponent(invitationId)}`,
    { method: "DELETE" },
    token,
  );
}
