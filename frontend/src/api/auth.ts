/**
 * Lifecycle Stage: API Service -> Authentication & User Directory Endpoints
 * Production Invariant (🔴): Logout blacklists the refresh token server-side before clearing local storage.
 * Trap Prevented (⚠️): Orphaned refresh tokens staying usable after a user signs out.
 */
import type { UserSummary } from "../types/api";
import { apiClient, clearTokens, getRefreshToken, setTokens } from "./client";

export interface LoginPayload {
  username: string;
  password: string;
}

export async function loginWithCredentials(payload: LoginPayload): Promise<UserSummary> {
  const { data } = await apiClient.post<{ access: string; refresh: string }>("/auth/token/", payload);
  setTokens(data.access, data.refresh);
  return fetchCurrentUser();
}

export async function fetchCurrentUser(): Promise<UserSummary> {
  const { data } = await apiClient.get<UserSummary>("/auth/me/");
  return data;
}

export async function logoutSession(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await apiClient.post("/auth/logout/", { refresh });
    }
  } finally {
    clearTokens();
  }
}

export async function fetchUsers(): Promise<UserSummary[]> {
  const { data } = await apiClient.get<UserSummary[]>("/users/");
  return data;
}
