/**
 * Authentication helpers — backed by the Smart Commit Helper API.
 *
 * The backend issues short-lived JWT access tokens (15 min) and
 * longer-lived refresh tokens (7 days).  Both are stored in
 * httpOnly cookies; the access token is attached to every API
 * request as a Bearer token.
 *
 * When the access token expires we transparently exchange the
 * refresh token for a new pair.
 */

import "server-only";

import {
  backendGetMe,
  backendLogin,
  backendLogout,
  backendRefresh,
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  type BackendMeResponse,
} from "./api";

export type SessionUser = BackendMeResponse;

export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Authenticate against the backend and persist tokens in cookies.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const tokens = await backendLogin(email, password);
    await setAuthCookies(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in,
    );
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "登录失败，请稍后重试";
    return { success: false, error: message };
  }
}

/**
 * Return the current user, or null when not authenticated.
 *
 * Attempts to use the access token; on 401 it tries to refresh
 * the token pair once.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    return await backendGetMe();
  } catch (err) {
    // If access token expired, try refresh
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
      const tokens = await backendRefresh(refreshToken);
      await setAuthCookies(
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in,
      );
      return await backendGetMe();
    } catch {
      await clearAuthCookies();
      return null;
    }
  }
}

/**
 * Check whether the current visitor is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Log out: blacklist the refresh token on the backend and clear cookies.
 */
export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      await backendLogout(refreshToken);
    } catch {
      // Ignore errors — we clear cookies regardless
    }
  }
  await clearAuthCookies();
}