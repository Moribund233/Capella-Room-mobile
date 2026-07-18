const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8079";
const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:8079";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  code?: string;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

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

export { request, ApiError, API_BASE_URL, WS_BASE_URL };
export type { ApiResponse };
