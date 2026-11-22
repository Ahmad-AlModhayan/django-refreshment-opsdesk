/**
 * Lifecycle Stage: API Service -> Single-Query Dashboard KPI Aggregation
 * Production Invariant (🔴): Delegates KPI counting and SLA risk weighting to PostgreSQL via Django ORM aggregate().
 * Trap Prevented (⚠️): Downloading thousands of ticket records just to count statuses in the browser.
 */
import type { DashboardMetrics } from "../types/api";
import { apiClient } from "./client";

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await apiClient.get<DashboardMetrics>("/dashboard/metrics/");
  return data;
}
