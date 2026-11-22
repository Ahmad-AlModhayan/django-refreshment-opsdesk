/**
 * Lifecycle Stage: Compliance Screen -> Immutable Audit Log Feed
 * Production Invariant (🔴): Displays read-only audit records joined across ticket, project, and actor in 2 SQL queries.
 * Trap Prevented (⚠️): Allowing client-side mutation of audit history or rendering unpaginated tables.
 */
import { History, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ActionBadge, formatStatusLabel } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useAuditLogs } from "./useAuditLogs";

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError } = useAuditLogs({
    page,
    action: action || undefined,
    search: debouncedSearch || undefined,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
          Immutable Audit Log
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
          Append-only compliance ledger committed inside the same database transaction as every ticket write.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-2 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Filter by ticket reference, title, actor, or note…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <select
          aria-label="Filter by audit action"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
        >
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="transitioned">Transitioned</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        {isError ? (
          <div className="p-6 text-center text-xs text-rose-600 dark:text-rose-400">
            Unable to load audit logs.
          </div>
        ) : isLoading ? (
          <TableSkeleton rows={10} />
        ) : !data?.results.length ? (
          <EmptyState
            icon={<History className="h-5 w-5" />}
            title="No audit events match your filter"
            description="Clear your search query or select a different action type."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                    <th className="px-4 py-2.5">Timestamp (UTC)</th>
                    <th className="px-4 py-2.5">Ticket</th>
                    <th className="px-4 py-2.5">Action</th>
                    <th className="px-4 py-2.5">Transition</th>
                    <th className="px-4 py-2.5">Actor</th>
                    <th className="px-4 py-2.5">Audit Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {data.results.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-500 dark:text-zinc-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/tickets?ticketId=${log.ticket_id}`}
                          className="font-mono font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {log.ticket_reference}
                        </Link>
                        <p className="max-w-xs truncate text-[11px] text-slate-500 dark:text-zinc-400">
                          {log.ticket_title}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-700 dark:text-zinc-300">
                        {log.from_status && log.to_status && log.from_status !== log.to_status
                          ? `${formatStatusLabel(log.from_status)} → ${formatStatusLabel(log.to_status)}`
                          : log.to_status
                            ? formatStatusLabel(log.to_status)
                            : "—"}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="font-medium text-slate-800 dark:text-zinc-200">
                          {log.actor.full_name}
                        </span>
                        <span className="ml-1 font-mono text-[10px] text-slate-400">
                          @{log.actor.username}
                        </span>
                      </td>
                      <td className="max-w-sm truncate px-4 py-2.5 text-slate-600 dark:text-zinc-400">
                        {log.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              pageSize={20}
              totalCount={data.count}
              hasPrevious={Boolean(data.previous)}
              hasNext={Boolean(data.next)}
              isFetching={isFetching}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
