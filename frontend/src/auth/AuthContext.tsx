/**
 * Lifecycle Stage: Client Auth State -> React 19 Direct Context Provider & Session Lifecycle
 * Production Invariant (🔴): Uses React 19 <AuthContext value={...}> and purges TanStack Query cache on sign-out.
 * Trap Prevented (⚠️): Leaking previous user's cached tickets/metrics across role switches on shared workstations.
 */
import { useQueryClient } from "@tanstack/react-query";
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchCurrentUser, loginWithCredentials, logoutSession, type LoginPayload } from "../api/auth";
import { clearTokens, getAccessToken, registerAuthFailureHandler } from "../api/client";
import type { UserSummary } from "../types/api";

interface AuthContextValue {
  user: UserSummary | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<UserSummary>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getAccessToken()));

  const handleForcedLogout = useCallback(() => {
    clearTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    registerAuthFailureHandler(handleForcedLogout);
  }, [handleForcedLogout]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetchCurrentUser()
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        if (!cancelled) {
          clearTokens();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      queryClient.clear();
      const profile = await loginWithCredentials(payload);
      setUser(profile);
      return profile;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await logoutSession();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  // React 19 direct Context syntax (no .Provider wrapper required)
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
