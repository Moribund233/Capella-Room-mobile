/**
 * Authentication getter injection layer.
 *
 * `api/client.ts` cannot import the auth store directly without creating a
 * circular dependency (the store also imports API functions). This module
 * exposes lightweight getter callbacks that the store wires up after it is
 * created, allowing the API client to read tokens and trigger refresh/logout
 * without knowing about Zustand.
 */

let getAccessTokenImpl: () => string | null = () => null;
let refreshAccessTokenImpl: () => Promise<string | null> = async () => null;
let forceLogoutImpl: () => Promise<void> | void = () => {};

/**
 * Wire the API client to the application's auth source.
 *
 * @param getToken - Returns the current access token, or null if logged out.
 * @param refreshToken - Attempts to refresh the access token and returns the
 *   new token, or null when refresh fails.
 * @param logout - Clears the authenticated session.
 */
export function setAuthGetters(
  getToken: () => string | null,
  refreshToken: () => Promise<string | null>,
  logout: () => Promise<void> | void,
): void {
  getAccessTokenImpl = getToken;
  refreshAccessTokenImpl = refreshToken;
  forceLogoutImpl = logout;
}

/** @returns The current access token, or null when not authenticated. */
export function getAccessToken(): string | null {
  return getAccessTokenImpl();
}

/**
 * Attempts to silently refresh the access token.
 * @returns The new token, or null if refresh failed.
 */
export async function refreshAccessToken(): Promise<string | null> {
  return refreshAccessTokenImpl();
}

/** Forces a logout, typically after token refresh fails. */
export async function forceLogout(): Promise<void> {
  await forceLogoutImpl();
}
