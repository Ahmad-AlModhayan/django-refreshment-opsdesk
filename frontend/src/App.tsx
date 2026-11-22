/**
 * Lifecycle Stage: Root SPA Composition -> Providers, Router & Error Containment
 * Production Invariant (🔴): Configures TanStack Query retry policy, wraps routes in ErrorBoundary and ProtectedRoute.
 * Trap Prevented (⚠️): Infinite retry loops on 401/403/404 responses or unprotected deep route mounts.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { LoginPage } from "./auth/LoginPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";
import { AuditLogPage } from "./features/audit/AuditLogPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { StudyModeProvider } from "./features/study/StudyModeContext";
import { TicketWorkspacePage } from "./features/tickets/TicketWorkspacePage";
import { AppShell } from "./layouts/AppShell";

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
                      <Route index element={<DashboardPage />} />
                      <Route path="tickets" element={<TicketWorkspacePage />} />
                      <Route path="projects" element={<ProjectsPage />} />
                      <Route path="audit" element={<AuditLogPage />} />
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
