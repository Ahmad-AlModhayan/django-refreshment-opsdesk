/**
 * Lifecycle Stage: API Service -> Paginated Compliance Audit Feed
 * Production Invariant (🔴): Consumes server-paginated immutable audit logs with actor and ticket joins preloaded.
 * Trap Prevented (⚠️): Unbounded log queries hanging the browser or triggering N+1 user lookups.
 */
import type { AuditLogFeedItem, PaginatedResponse } from "../types/api";
import { apiClient } from "./client";

export interface AuditQueryParams {
  page?: number;
  action?: string;
  search?: string;
}

export async function fetchAuditLogs(
  params: AuditQueryParams,
): Promise<PaginatedResponse<AuditLogFeedItem>> {
  const { data } = await apiClient.get<PaginatedResponse<AuditLogFeedItem>>("/audit-logs/", {
    params,
  });
  return data;
}
