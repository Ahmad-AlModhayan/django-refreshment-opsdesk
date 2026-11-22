/**
 * Lifecycle Stage: Server-State Cache -> Executive Dashboard Query Hook
 * Production Invariant (🔴): Keyed under ['dashboard', 'metrics'] so every ticket mutation invalidates KPIs cleanly.
 * Trap Prevented (⚠️): Stale KPI counters lingering after a ticket is created or transitioned in another view.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "../../api/dashboard";

export const DASHBOARD_QUERY_KEY = ["dashboard", "metrics"] as const;

export function useDashboardMetrics() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardMetrics,
    staleTime: 15_000,
  });
}
