/**
 * Lifecycle Stage: Server-State Cache -> Paginated Compliance Audit Log Hook
 * Production Invariant (🔴): Uses keepPreviousData to keep audit tables stable during search and pagination.
 * Trap Prevented (⚠️): Layout jank and stale page overlap when filtering compliance records.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchAuditLogs, type AuditQueryParams } from "../../api/audit";

export function useAuditLogs(params: AuditQueryParams) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => fetchAuditLogs(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
