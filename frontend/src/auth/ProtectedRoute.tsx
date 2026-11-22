/**
 * Lifecycle Stage: Route Guard -> Authenticated Route Protection with Layout-Matched Skeleton
 * Production Invariant (🔴): Blocks rendering protected routes until session hydration settles; preserves return URL.
 * Trap Prevented (⚠️): Flashing protected UI or using jarring spinners before auth state is resolved.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShellHydrationSkeleton } from "../components/ui/Skeleton";
import { useAuth } from "./AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <ShellHydrationSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
