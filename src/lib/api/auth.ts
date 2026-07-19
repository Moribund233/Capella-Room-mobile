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

/* ─── v1 API (legacy) ──────────────────────────────────── */

export async function loginApi(
  email: string,
  password: string,
  deviceName?: string,
  deviceType?: string,
): Promise<LoginResponse> {
  return rawRequest<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      device_name: deviceName,
      device_type: deviceType,
    }),
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

/* ─── v2 API ───────────────────────────────────────────── */

export async function sendRegisterCodeApi(
  email: string,
): Promise<{ message: string; code_length: number }> {
  return rawRequest("/api/v2/auth/register/send-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function v2RegisterApi(
  email: string,
  code: string,
  username: string,
  password: string,
): Promise<LoginResponse> {
  return rawRequest<LoginResponse>("/api/v2/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, code, username, password }),
  });
}

export async function sendLoginCodeApi(
  email: string,
): Promise<{ message: string; code_length: number }> {
  return rawRequest("/api/v2/auth/login/send-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function v2LoginWithCodeApi(
  email: string,
  code: string,
): Promise<LoginResponse> {
  return rawRequest<LoginResponse>("/api/v2/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function v2LoginWithPasswordApi(
  email: string,
  password: string,
  deviceName?: string,
  deviceType?: string,
): Promise<LoginResponse> {
  return rawRequest<LoginResponse>("/api/v2/auth/login-with-password", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      device_name: deviceName,
      device_type: deviceType,
    }),
  });
}
