/**
 * MSW request handlers for tests.
 *
 * Individual tests can override these with `server.use(...)`.
 */

import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/api/v1/users/me", () =>
    HttpResponse.json({
      success: true,
      data: {
        id: "user-1",
        username: "tester",
        email: "tester@example.com",
        avatar_url: null,
        status: "online",
        role: "user",
        created_at: "2026-01-01T00:00:00Z",
      },
    }),
  ),

  http.post("*/api/v1/auth/login", () =>
    HttpResponse.json({
      success: true,
      data: {
        access_token: "access-1",
        refresh_token: "refresh-1",
        expires_in: 3600,
        token_type: "Bearer",
        user: {
          id: "user-1",
          username: "tester",
          email: "tester@example.com",
          avatar_url: null,
          status: "online",
          role: "user",
          created_at: "2026-01-01T00:00:00Z",
        },
      },
    }),
  ),

  http.post("*/api/v1/auth/refresh", () =>
    HttpResponse.json({
      success: true,
      data: {
        access_token: "access-2",
        refresh_token: "refresh-2",
        expires_in: 3600,
        token_type: "Bearer",
      },
    }),
  ),
];
