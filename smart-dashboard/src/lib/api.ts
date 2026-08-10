/**
 * Backend API client.
 *
 * Centralises all HTTP calls to the Smart Commit Helper backend.
 * On the server side (Server Components / Server Actions) we read
 * the JWT from the signed session cookie and forward it as a
 * Bearer token.
 */

import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.BACKEND_URL ?? "http://localhost:8000/api/v1";

const ACCESS_COOKIE = "sd_access_token";
const REFRESH_COOKIE = "sd_refresh_token";

// ─── Cookie helpers ──────────────────────────────────────────────

/** Read the access token from the httpOnly cookie (server-only). */
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
): Promise<void> {
  const store = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  store.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: expiresIn,
    path: "/",
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

// ─── Low-level fetch wrapper ─────────────────────────────────────

interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  /** Whether to attach the Authorization header (default true). */
  auth?: boolean;
  /** Override the cache setting (default "no-store"). */
  cache?: RequestCache;
  tags?: string[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Perform a fetch against the backend.
 *
 * Automatically attaches the JWT access token when available.
 * Throws {@link ApiError} on non-2xx responses.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true, cache = "no-store", tags } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = `${BACKEND_URL}${endpoint}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache,
    ...(tags ? { next: { tags } } : {}),
  });

  if (!res.ok) {
    let detail: unknown = null;
    let message = `API error (${res.status})`;
    try {
      detail = await res.json();
      if (detail && typeof detail === "object" && "detail" in detail) {
        message = String((detail as Record<string, unknown>).detail);
      }
    } catch {
      // response body is not JSON
    }
    throw new ApiError(res.status, message, detail);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

// ─── Auth API ────────────────────────────────────────────────────

export interface BackendTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface BackendMeResponse {
  id: string;
  email: string;
  name: string;
  team_id: string;
  role: string;
}

export async function backendLogin(
  email: string,
  password: string,
): Promise<BackendTokenResponse> {
  return apiFetch<BackendTokenResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export async function backendRefresh(
  refreshToken: string,
): Promise<BackendTokenResponse> {
  return apiFetch<BackendTokenResponse>("/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
    auth: false,
  });
}

export async function backendLogout(refreshToken: string): Promise<void> {
  await apiFetch("/auth/logout", {
    method: "POST",
    body: { refresh_token: refreshToken },
    auth: false,
  });
}

export async function backendGetMe(): Promise<BackendMeResponse> {
  return apiFetch<BackendMeResponse>("/auth/me");
}

// ─── Members API ─────────────────────────────────────────────────

export type MemberRole = "member" | "admin" | "developer" | "viewer";

export interface BackendMember {
  id: string;
  team_id: string;
  name: string;
  email: string;
  role: MemberRole;
  github_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function backendListMembers(params?: {
  page?: number;
  page_size?: number;
  role?: string;
  name?: string;
}): Promise<PaginatedResponse<BackendMember>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.page_size) search.set("page_size", String(params.page_size));
  if (params?.role) search.set("role", params.role);
  if (params?.name) search.set("name", params.name);
  const qs = search.toString();
  return apiFetch<PaginatedResponse<BackendMember>>(
    `/members${qs ? `?${qs}` : ""}`,
    { tags: ["members"] },
  );
}