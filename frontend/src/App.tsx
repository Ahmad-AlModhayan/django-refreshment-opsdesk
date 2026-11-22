/**
 * Lifecycle Stage: Root SPA Composition -> Code-Split Routes, Providers & Error Containment
 * Production Invariant (🔴): Lazy-loads feature screens with layout skeletons and prevents 4xx query retry storms.
 * Trap Prevented (⚠️): Monolithic JS bundles delaying first paint or infinite retry loops on 401/403 responses.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { LoginPage } from "./auth/LoginPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { TableSkeleton } from "./components/ui/Skeleton";
import { ToastProvider } from "./components/ui/Toast";
import { StudyModeProvider } from "./features/study/StudyModeContext";
import { AppShell } from "./layouts/AppShell";

const DashboardPage = lazy(() =>
  import("./features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const TicketWorkspacePage = lazy(() =>
  import("./features/tickets/TicketWorkspacePage").then((m) => ({
    default: m.TicketWorkspacePage,
  })),
);
const ProjectsPage = lazy(() =>
  import("./features/projects/ProjectsPage").then((m) => ({ default: m.ProjectsPage })),
);
const AuditLogPage = lazy(() =>
  import("./features/audit/AuditLogPage").then((m) => ({ default: m.AuditLogPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500) return false;
        }
        return failureCount < 1;
      },
    },
  },
});

function RouteFallback() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
      <TableSkeleton rows={8} />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <StudyModeProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                      <Route
                        index
                        element={
                          <Suspense fallback={<RouteFallback />}>
                            <DashboardPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="tickets"
                        element={
                          <Suspense fallback={<RouteFallback />}>
                            <TicketWorkspacePage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="projects"
                        element={
                          <Suspense fallback={<RouteFallback />}>
                            <ProjectsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="audit"
                        element={
                          <Suspense fallback={<RouteFallback />}>
                            <AuditLogPage />
                          </Suspense>
                        }
                      />
                    </Route>
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </StudyModeProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
