/**
 * Lifecycle Stage: HTTP Transport -> Axios Client with Single-Flight JWT Refresh & Telemetry Capture
 * Production Invariant (🔴): Concurrent 401 responses share one refreshPromise lock so rotated refresh tokens never collide.
 * Trap Prevented (⚠️): Parallel 401 refresh storms triggering BLACKLIST_AFTER_ROTATION and forcefully logging users out.
 */
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { recordTelemetry } from "./telemetryStore";

const ACCESS_KEY = "opsdesk_access_token";
const REFRESH_KEY = "opsdesk_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

type AuthFailureHandler = () => void;
let onAuthFailure: AuthFailureHandler | null = null;

export function registerAuthFailureHandler(handler: AuthFailureHandler): void {
  onAuthFailure = handler;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

function logResponseTelemetry(response?: AxiosResponse, fallbackMethod = "GET", fallbackUrl = ""): void {
  if (!response) return;
  const rawCount = response.headers["x-db-query-count"];
  const rawTime = response.headers["x-response-time-ms"];
  const method = (response.config.method ?? fallbackMethod).toUpperCase();
  const baseUrl = response.config.baseURL ?? "";
  const relUrl = response.config.url ?? fallbackUrl;
  const params = response.config.params as Record<string, unknown> | undefined;
  let fullUrl = `${baseUrl}${relUrl}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        qs.set(k, String(v));
      }
    });
    const str = qs.toString();
    if (str) fullUrl += `?${str}`;
  }

  recordTelemetry({
    method,
    url: fullUrl,
    status: response.status,
    queryCount: rawCount !== undefined ? Number(rawCount) : null,
    responseTimeMs: rawTime !== undefined ? Number(rawTime) : null,
    ok: response.status >= 200 && response.status < 400,
  });
}

// Single-flight promise shared across concurrent 401 responses
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error("No refresh token available");
  }
  const response = await axios.post<{ access: string; refresh?: string }>(
    "/api/auth/token/refresh/",
    { refresh },
    { headers: { "Content-Type": "application/json" } },
  );
  logResponseTelemetry(response, "POST", "/auth/token/refresh/");
  const newAccess = response.data.access;
  const newRefresh = response.data.refresh ?? refresh;
  setTokens(newAccess, newRefresh);
  return newAccess;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    logResponseTelemetry(response);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    if (error.response) {
      logResponseTelemetry(error.response);
    }

    const isUnauthorized = error.response?.status === 401;
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/token/") || originalRequest?.url?.includes("/auth/logout/");

    if (isUnauthorized && originalRequest && !originalRequest._retry && !isAuthEndpoint && getRefreshToken()) {
      originalRequest._retry = true;
      try {
        // Single-flight lock: all simultaneous 401 requests await the exact same refresh call
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const freshAccess = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${freshAccess}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearTokens();
        onAuthFailure?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export function extractApiError(error: unknown, fallback = "An unexpected error occurred."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (!data) return error.message || fallback;
    if (typeof data.detail === "string") return data.detail;
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const value = data[firstKey];
      if (Array.isArray(value) && typeof value[0] === "string") {
        return `${firstKey}: ${value[0]}`;
      }
      if (typeof value === "string") return value;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
