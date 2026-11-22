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
import { MonogramAvatar } from "../../components/ui/MotionPrimitives";
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
    <div className="space-y-5">
      <div className="border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          Compliance Ledger
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Immutable Audit Log
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Append-only trail committed inside the same database transaction as every ticket write.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute top-2 left-2.5 h-3.5 w-3.5 text-zinc-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Filter by ticket reference, title, actor, or note…"
            className="w-full rounded-lg border border-zinc-200/90 bg-white py-1.5 pr-3 pl-8 text-xs text-zinc-900 outline-none focus:border-emerald-600/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <select
          aria-label="Filter by audit action"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-200/90 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-emerald-600/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="transitioned">Transitioned</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_16px_40px_-24px_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-900/60">
        {isError ? (
          <div className="p-6 text-center text-xs text-rose-600 dark:text-rose-400">
            Unable to load audit logs.
          </div>
        ) : isLoading ? (
          <TableSkeleton rows={10} />
        ) : !data?.results.length ? (
          <EmptyState
            icon={<History className="h-5 w-5" strokeWidth={1.75} />}
            title="No audit events match your filter"
            description="Clear your search query or select a different action type."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/70 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                    <th className="px-4 py-2.5">Timestamp (UTC)</th>
                    <th className="px-4 py-2.5">Ticket</th>
                    <th className="px-4 py-2.5">Action</th>
                    <th className="px-4 py-2.5">Transition</th>
                    <th className="px-4 py-2.5">Actor</th>
                    <th className="px-4 py-2.5">Audit Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {data.results.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/tickets?ticketId=${log.ticket_id}`}
                          className="font-mono font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          {log.ticket_reference}
                        </Link>
                        <p className="max-w-xs truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          {log.ticket_title}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                        {log.from_status && log.to_status && log.from_status !== log.to_status
                          ? `${formatStatusLabel(log.from_status)} → ${formatStatusLabel(log.to_status)}`
                          : log.to_status
                            ? formatStatusLabel(log.to_status)
                            : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MonogramAvatar name={log.actor.full_name} size="xs" />
                          <span className="font-medium text-zinc-900 dark:text-zinc-200">
                            {log.actor.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-sm truncate px-4 py-3 text-zinc-600 dark:text-zinc-400">
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
