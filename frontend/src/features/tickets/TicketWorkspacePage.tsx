/**
 * Lifecycle Stage: Primary Operations Screen -> High-Density Paginated Ticket & Approval Workspace
 * Production Invariant (🔴): Multi-facet filters, debounced search, sort, and CSV export all execute server-side.
 * Trap Prevented (⚠️): Firing un-debounced API calls on every keystroke or flickering empty tables on page changes.
 */
import {
  ArrowRight,
  ArrowUpDown,
  Download,
  FilterX,
  Inbox,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { extractApiError } from "../../api/client";
import { exportTicketsCsv, type TicketQueryParams } from "../../api/tickets";
import { useAuth } from "../../auth/AuthContext";
import { formatStatusLabel, PriorityBadge, StatusBadge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { MagneticButton, MonogramAvatar } from "../../components/ui/MotionPrimitives";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import type { Ticket, TicketStatus } from "../../types/api";
import { useProjects } from "../projects/useProjects";
import { CreateTicketModal } from "./CreateTicketModal";
import { TicketDrawer } from "./TicketDrawer";
import { useTickets, useTransitionTicket, useUsers } from "./useTickets";

const STATUS_OPTIONS: TicketStatus[] = [
  "open",
  "in_progress",
  "awaiting_approval",
  "approved",
  "rejected",
  "resolved",
  "closed",
];

export function TicketWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { notify } = useToast();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [priority, setPriority] = useState(() => searchParams.get("priority") ?? "");
  const [project, setProject] = useState(() => searchParams.get("project") ?? "");
  const [assignee, setAssignee] = useState(() => searchParams.get("assignee") ?? "");
  const [ordering, setOrdering] = useState("-created_at");
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(() => {
    const raw = searchParams.get("ticketId");
    return raw ? Number(raw) : null;
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const urlSearch = searchParams.get("search");
    const urlStatus = searchParams.get("status");
    const urlPriority = searchParams.get("priority");
    const urlProject = searchParams.get("project");
    const urlTicketId = searchParams.get("ticketId");
    if (urlSearch !== null) setSearchInput(urlSearch);
    if (urlStatus !== null) setStatus(urlStatus);
    if (urlPriority !== null) setPriority(urlPriority);
    if (urlProject !== null) setProject(urlProject);
    if (urlTicketId) setSelectedTicketId(Number(urlTicketId));
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const queryParams: TicketQueryParams = {
    page,
    status: status || undefined,
    priority: priority || undefined,
    project: project || undefined,
    assignee: assignee || undefined,
    search: debouncedSearch || undefined,
    ordering,
  };

  const { data, isLoading, isFetching, isError } = useTickets(queryParams);
  const { data: projects = [] } = useProjects();
  const { data: users = [] } = useUsers();
  const transitionMutation = useTransitionTicket();

  const hasActiveFilters = Boolean(status || priority || project || assignee || searchInput);

  const resetFilters = () => {
    setStatus("");
    setPriority("");
    setProject("");
    setAssignee("");
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
    setSearchParams({});
  };

  const toggleSort = (field: string) => {
    setOrdering((prev) => (prev === field ? `-${field}` : field));
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportTicketsCsv({
        status: status || undefined,
        priority: priority || undefined,
        project: project || undefined,
        assignee: assignee || undefined,
        search: debouncedSearch || undefined,
        ordering,
      });
      notify("success", "CSV exported", "Streamed filtered tickets from /api/tickets/export/.");
    } catch (err) {
      notify("error", "CSV export failed", extractApiError(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickAdvance = async (ticket: Ticket, nextStatus: TicketStatus) => {
    try {
      await transitionMutation.mutateAsync({
        id: ticket.id,
        toStatus: nextStatus,
        note: "Quick workflow transition from Operations Table.",
      });
      notify(
        "success",
        `${ticket.reference_code} updated`,
        `Moved to ${formatStatusLabel(nextStatus)}.`,
      );
    } catch (err) {
      notify("error", "Transition blocked", extractApiError(err));
    }
  };

  const canModifyTicket = (ticket: Ticket) =>
    Boolean(user && (user.is_staff || user.is_superuser || ticket.author.id === user.id));

  const handleCloseDrawer = () => {
    setSelectedTicketId(null);
    if (searchParams.has("ticketId")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("ticketId");
      setSearchParams(nextParams, { replace: true });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Change Control Queue
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Requests & Approvals
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Select any row to open the state-machine drawer, RBAC editor, and immutable audit history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
            {isExporting ? "Streaming…" : "Export CSV"}
          </button>
          <MagneticButton
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 py-1.5 text-xs font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            New Request
          </MagneticButton>
        </div>
      </div>

      {/* Flat Multi-Facet Filter Rail */}
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
            placeholder="Filter by reference, title, or project…"
            className="w-full rounded-lg border border-zinc-200/90 bg-white py-1.5 pr-3 pl-8 text-xs text-zinc-900 outline-none transition focus:border-emerald-600/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-200/90 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-emerald-600/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {formatStatusLabel(st)}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by priority"
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-200/90 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-emerald-600/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          aria-label="Filter by project"
          value={project}
          onChange={(e) => {
            setProject(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-200/90 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-emerald-600/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by assignee"
          value={assignee}
          onChange={(e) => {
            setAssignee(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-200/90 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-emerald-600/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="">All Assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <FilterX className="h-3.5 w-3.5" strokeWidth={1.75} />
            Reset
          </button>
        )}
      </div>

      {/* High-Density Operations Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_16px_40px_-24px_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-900/60">
        {isError ? (
          <div className="p-6 text-center text-xs text-rose-600 dark:text-rose-400">
            Could not load tickets. Verify API connectivity.
          </div>
        ) : isLoading ? (
          <TableSkeleton rows={10} />
        ) : !data?.results.length ? (
          <EmptyState
            icon={<Inbox className="h-5 w-5" strokeWidth={1.75} />}
            title="No matching requests"
            description="Adjust your active filters or open a new operational change request."
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/70 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                    <th className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSort("reference_code")}
                        className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Ref
                        <ArrowUpDown className="h-3 w-3" strokeWidth={1.75} />
                      </button>
                    </th>
                    <th className="px-4 py-2.5">Request</th>
                    <th className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSort("status")}
                        className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Status
                        <ArrowUpDown className="h-3 w-3" strokeWidth={1.75} />
                      </button>
                    </th>
                    <th className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSort("priority")}
                        className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Priority
                        <ArrowUpDown className="h-3 w-3" strokeWidth={1.75} />
                      </button>
                    </th>
                    <th className="px-4 py-2.5">Assignee</th>
                    <th className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSort("created_at")}
                        className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Created
                        <ArrowUpDown className="h-3 w-3" strokeWidth={1.75} />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-right">Next State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {data.results.map((ticket) => {
                    const nextAction = ticket.allowed_transitions[0];
                    const editable = canModifyTicket(ticket);
                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className="cursor-pointer transition-colors hover:bg-zinc-50/90 dark:hover:bg-zinc-800/35"
                      >
                        <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                          {ticket.reference_code}
                        </td>
                        <td className="max-w-md px-4 py-3">
                          <p className="truncate font-medium text-zinc-950 dark:text-zinc-100">
                            {ticket.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="font-mono">{ticket.project.code}</span> ·{" "}
                            {ticket.author.full_name}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {ticket.assignee ? (
                            <span className="inline-flex items-center gap-2">
                              <MonogramAvatar name={ticket.assignee.full_name} size="xs" />
                              <span>{ticket.assignee.full_name}</span>
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>
                        <td
                          className="px-4 py-3 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {nextAction && editable ? (
                            <button
                              type="button"
                              disabled={transitionMutation.isPending}
                              onClick={() => handleQuickAdvance(ticket, nextAction)}
                              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-800 transition hover:border-emerald-500/60 hover:text-emerald-700 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300"
                            >
                              <ArrowRight
                                className="h-3 w-3 text-emerald-600 dark:text-emerald-400"
                                strokeWidth={1.75}
                              />
                              {formatStatusLabel(nextAction)}
                            </button>
                          ) : (
                            <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                              {editable ? "Terminal" : "Read-only"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

      <TicketDrawer
        key={selectedTicketId ?? "closed"}
        ticketId={selectedTicketId}
        onClose={handleCloseDrawer}
      />
      <CreateTicketModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
