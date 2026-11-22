/**
 * Lifecycle Stage: Route Guard -> Authenticated Route Protection
 * Production Invariant (🔴): Blocks rendering protected routes until session hydration settles; preserves return URL.
 * Trap Prevented (⚠️): Flashing protected UI skeletons or firing 401 API bursts before auth state is resolved.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium tracking-wide text-slate-500 dark:text-zinc-400">
            Verifying enterprise session…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
