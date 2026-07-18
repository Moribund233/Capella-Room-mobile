import { getAccessToken, refreshAccessToken, forceLogout } from "@/lib/auth/token";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8079";
const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:8079";

const DEFAULT_TIMEOUT_MS = 10_000;

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  code?: string;
  error?: string;
  message?: string;
}

/**
 * Structured error returned by the backend API.
 */
class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Merge multiple abort signals into a single signal.
 * Useful for respecting both a caller-provided signal and an internal timeout.
 */
function mergeSignals(
  signals: (AbortSignal | null | undefined)[],
): AbortSignal | undefined {
  const valid = signals.filter((s): s is AbortSignal => !!s && !s.aborted);
  if (valid.length === 0) return undefined;
  if (valid.length === 1) return valid[0];

  const controller = new AbortController();
  const onAbort = () => controller.abort();

  for (const signal of valid) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }

  return controller.signal;
}

/**
 * Fetch with a timeout. The caller's AbortSignal is also respected.
 */
async function fetchWithTimeout(
  input: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const signal = mergeSignals([controller.signal, options.signal]);

  try {
    return await fetch(input, { ...options, signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Low-level JSON request helper. No authentication, no refresh logic.
 * Use this for auth endpoints (login / register / refresh) or file uploads
 * that need to manage their own headers.
 */
async function rawRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const body: ApiResponse<T> = await response.json();

  if (!body.success) {
    throw new ApiError(
      response.status,
      body.code ?? "UNKNOWN_ERROR",
      body.message ?? "Unknown error",
    );
  }

  return body.data as T;
}

/**
 * Authenticated JSON request helper.
 *
 * - Automatically injects the current access token.
 * - Applies a 10-second timeout.
 * - On 401 with code `TOKEN_EXPIRED`, attempts a token refresh and retries the
n *   original request once. If refresh fails, forces logout and throws.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetchWithTimeout(
    `${API_BASE_URL}${path}`,
    { ...options, headers },
    DEFAULT_TIMEOUT_MS,
  );

  const body: ApiResponse<T> = await response.json();

  if (!body.success) {
    if (response.status === 401 && body.code === "TOKEN_EXPIRED") {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request<T>(path, options);
      }
      await forceLogout();
    }

    throw new ApiError(
      response.status,
      body.code ?? "UNKNOWN_ERROR",
      body.message ?? "Unknown error",
    );
  }

  return body.data as T;
}

export { rawRequest, request, ApiError, API_BASE_URL, WS_BASE_URL };
export type { ApiResponse };
