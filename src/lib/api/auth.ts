import { rawRequest } from "./client";

/* ─── Types ───────────────────────────────────────────────── */

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  status: "online" | "offline" | "away";
  role: "user" | "admin" | "super_admin";
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  status: "offline";
  role: "user";
  created_at: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/* ─── API Functions ───────────────────────────────────────── */

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return rawRequest<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerApi(
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  return rawRequest<RegisterResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function refreshApi(refreshToken: string): Promise<RefreshResponse> {
  return rawRequest<RefreshResponse>("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}
