/**
 * Lifecycle Stage: Executive Screen -> Single-Query KPIs, Priority Risk Breakdown & Activity Feed
 * Production Invariant (🔴): Renders aggregated server metrics with skeleton loaders and zero client-side counting.
 * Trap Prevented (⚠️): Calculating dashboard counts from a paginated /tickets/ list and displaying wrong totals.
 */
import {
  AlertOctagon,
  ArrowRight,
  Clock,
  FolderKanban,
  GitCommitHorizontal,
  Inbox,
  Plus,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ActionBadge, formatStatusLabel } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { CreateTicketModal } from "../tickets/CreateTicketModal";
import { useDashboardMetrics } from "./useDashboard";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDashboardMetrics();
  const [createOpen, setCreateOpen] = useState(false);

  const kpis = data?.kpis;
  const byPriority = data?.by_priority;
  const totalForBars = Math.max(1, kpis?.total ?? 1);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
            Operations Overview
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            Live enterprise queue health aggregated directly from PostgreSQL in a single ORM query.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New Request
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          Failed to load dashboard metrics. Verify the Django backend is reachable and click Refresh.
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Open Queue",
            value: kpis?.open,
            sub: "Unstarted operational items",
            icon: Inbox,
            accent: "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400",
            to: "/tickets?status=open",
          },
          {
            label: "In Progress",
            value: kpis?.in_progress,
            sub: "Actively assigned & executing",
            icon: Clock,
            accent: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400",
            to: "/tickets?status=in_progress",
          },
          {
            label: "Awaiting Approval",
            value: kpis?.awaiting_approval,
            sub: "Pending change-control sign-off",
            icon: ShieldAlert,
            accent: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400",
            to: "/tickets?status=awaiting_approval",
          },
          {
            label: "Critical SLA Active",
            value: kpis?.critical_sla,
            sub: `SLA pressure score: ${kpis?.sla_pressure_score ?? 0}`,
            icon: AlertOctagon,
            accent: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400",
            to: "/tickets?priority=critical",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  {card.label}
                </span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.accent}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              {isLoading ? (
                <SkeletonBlock className="mt-3 h-8 w-16" />
              ) : (
                <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
                  {card.value ?? 0}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                <span>{card.sub}</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Breakdown + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Status & Priority distribution */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Priority Distribution
              </h2>
              <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                {kpis?.total ?? 0} total
              </span>
            </div>

            {isLoading ? (
              <div className="mt-4 space-y-3">
                <SkeletonBlock className="h-6 w-full" />
                <SkeletonBlock className="h-6 w-full" />
                <SkeletonBlock className="h-6 w-full" />
                <SkeletonBlock className="h-6 w-full" />
              </div>
            ) : (
              <div className="mt-4 space-y-3.5">
                {[
                  { label: "Critical", count: byPriority?.critical ?? 0, bar: "bg-rose-500" },
                  { label: "High", count: byPriority?.high ?? 0, bar: "bg-orange-500" },
                  { label: "Medium", count: byPriority?.medium ?? 0, bar: "bg-indigo-500" },
                  { label: "Low", count: byPriority?.low ?? 0, bar: "bg-slate-400 dark:bg-zinc-500" },
                ].map((row) => {
                  const pct = Math.round((row.count / totalForBars) * 100);
                  return (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-zinc-300">
                          {row.label}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-zinc-400">
                          {row.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                        <div
                          className={`h-full rounded-full ${row.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-zinc-800">
              {[
                { label: "Approved", value: kpis?.approved ?? 0 },
                { label: "Resolved", value: kpis?.resolved ?? 0 },
                { label: "Closed", value: kpis?.closed ?? 0 },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg bg-slate-50 p-2.5 text-center dark:bg-zinc-950"
                >
                  <p className="font-mono text-base font-semibold text-slate-900 dark:text-zinc-100">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <FolderKanban className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                    Explore Projects & Ticket Queues
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Inspect department ownership and SLA exposure
                  </p>
                </div>
              </div>
              <Link
                to="/projects"
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Directory
              </Link>
            </div>
          </div>
        </div>

        {/* Recent immutable audit activity */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Recent Audit Activity
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Immutable workflow events committed atomically alongside mutations
              </p>
            </div>
            <Link
              to="/audit"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Full Audit Log
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.recent_activity.length ? (
            <EmptyState
              icon={<GitCommitHorizontal className="h-5 w-5" />}
              title="No activity recorded yet"
              description="Create or transition a ticket to populate the immutable compliance feed."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {data.recent_activity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-3 px-5 py-3 transition hover:bg-slate-50/70 dark:hover:bg-zinc-800/40"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/tickets?ticketId=${entry.ticket_id}`}
                        className="font-mono text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {entry.ticket_reference}
                      </Link>
                      <ActionBadge action={entry.action} />
                      {entry.from_status && entry.to_status && entry.from_status !== entry.to_status && (
                        <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                          {formatStatusLabel(entry.from_status)} → {formatStatusLabel(entry.to_status)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs font-medium text-slate-800 dark:text-zinc-200">
                      {entry.ticket_title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      <span className="font-medium text-slate-700 dark:text-zinc-300">
                        {entry.actor.full_name}
                      </span>
                      {entry.note ? ` — ${entry.note}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-slate-400 dark:text-zinc-500">
                    {formatRelativeTime(entry.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateTicketModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
