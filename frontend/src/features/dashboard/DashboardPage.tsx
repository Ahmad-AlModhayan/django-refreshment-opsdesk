/**
 * Lifecycle Stage: Executive Screen -> Asymmetric Telemetry Ledger, Priority Breakdown & Staggered Audit Feed
 * Production Invariant (🔴): Uses hair-lined architectural layout (zero card spam) backed by 1 ORM aggregate query.
 * Trap Prevented (⚠️): Generic 4-card boxed grids or computing KPI sums over a single paginated client slice.
 */
import { motion } from "framer-motion";
import {
  AlertOctagon,
  ArrowUpRight,
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
import {
  LivePulseDot,
  MagneticButton,
  MonogramAvatar,
  STAGGER_CONTAINER,
  STAGGER_ITEM,
} from "../../components/ui/MotionPrimitives";
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Live Operations Telemetry
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Operations Overview
          </h1>
          <p className="mt-1 max-w-[60ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Queue pressure, SLA exposure, and atomic workflow transitions aggregated in a single SQL query.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
              strokeWidth={1.75}
            />
            Sync
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

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          Failed to load dashboard metrics. Verify the Django backend is reachable and click Sync.
        </div>
      )}

      {/* Asymmetric Hair-Lined Executive KPI Ledger (Anti-Card Overuse) */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_16px_40px_-24px_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="grid grid-cols-1 divide-y divide-zinc-200/80 md:grid-cols-12 md:divide-x md:divide-y-0 dark:divide-zinc-800/90">
          {/* Dominant Left Focal Cell: Critical SLA Exposure */}
          <Link
            to="/tickets?priority=critical"
            className="group flex flex-col justify-between p-6 transition hover:bg-rose-50/30 md:col-span-4 dark:hover:bg-rose-500/[0.04]"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wider text-rose-700 dark:text-rose-400">
                <LivePulseDot tone={(kpis?.critical_sla ?? 0) > 0 ? "rose" : "emerald"} />
                Critical SLA Active
              </span>
              <AlertOctagon
                className="h-4 w-4 text-rose-600/80 dark:text-rose-400"
                strokeWidth={1.75}
              />
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              {isLoading ? (
                <SkeletonBlock className="h-11 w-20" />
              ) : (
                <span className="font-mono text-4xl font-semibold tracking-tighter text-zinc-950 dark:text-zinc-50">
                  {kpis?.critical_sla ?? 0}
                </span>
              )}
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                pressure index {kpis?.sla_pressure_score ?? 0}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
              <span>Unresolved critical items</span>
              <ArrowUpRight
                className="h-3.5 w-3.5 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-rose-600"
                strokeWidth={1.75}
              />
            </div>
          </Link>

          {/* Right 3-Cell Precision Queue Strip */}
          <div className="grid grid-cols-1 divide-y divide-zinc-200/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:col-span-8 dark:divide-zinc-800/90">
            {[
              {
                label: "Awaiting Approval",
                value: kpis?.awaiting_approval,
                sub: "Change-control sign-off",
                icon: ShieldAlert,
                barColor: "bg-amber-500",
                to: "/tickets?status=awaiting_approval",
              },
              {
                label: "In Progress",
                value: kpis?.in_progress,
                sub: "Active engineering work",
                icon: Clock,
                barColor: "bg-emerald-600 dark:bg-emerald-400",
                to: "/tickets?status=in_progress",
              },
              {
                label: "Open Queue",
                value: kpis?.open,
                sub: "Triage & assignment",
                icon: Inbox,
                barColor: "bg-zinc-900 dark:bg-zinc-200",
                to: "/tickets?status=open",
              },
            ].map((cell) => {
              const Icon = cell.icon;
              const pct = Math.min(100, Math.round(((cell.value ?? 0) / totalForBars) * 100));
              return (
                <Link
                  key={cell.label}
                  to={cell.to}
                  className="group flex flex-col justify-between p-6 transition hover:bg-zinc-50/90 dark:hover:bg-zinc-800/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {cell.label}
                    </span>
                    <Icon className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
                  </div>

                  <div className="mt-4">
                    {isLoading ? (
                      <SkeletonBlock className="h-9 w-14" />
                    ) : (
                      <p className="font-mono text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                        {cell.value ?? 0}
                      </p>
                    )}
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${cell.barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>{cell.sub}</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 opacity-40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-600 group-hover:opacity-100"
                      strokeWidth={1.75}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Asymmetric 7/5 Lower Workspace Split */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Dominant Column: Immutable Audit Stream */}
        <section className="space-y-3 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                Recent Audit Activity
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Committed inside the same database transaction as every ticket mutation
              </p>
            </div>
            <Link
              to="/audit"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400"
            >
              Full Ledger
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            {isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !data?.recent_activity.length ? (
              <EmptyState
                icon={<GitCommitHorizontal className="h-5 w-5" strokeWidth={1.75} />}
                title="No activity recorded yet"
                description="Create or transition a ticket to populate the immutable compliance ledger."
              />
            ) : (
              <motion.div
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="visible"
                className="divide-y divide-zinc-100 dark:divide-zinc-800/80"
              >
                {data.recent_activity.map((entry) => (
                  <motion.div
                    key={entry.id}
                    variants={STAGGER_ITEM}
                    className="flex items-start justify-between gap-3 px-4 py-3.5 transition hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <MonogramAvatar name={entry.actor.full_name} size="sm" />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/tickets?ticketId=${entry.ticket_id}`}
                            className="font-mono text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                          >
                            {entry.ticket_reference}
                          </Link>
                          <ActionBadge action={entry.action} />
                          {entry.from_status &&
                            entry.to_status &&
                            entry.from_status !== entry.to_status && (
                              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                                {formatStatusLabel(entry.from_status)} →{" "}
                                {formatStatusLabel(entry.to_status)}
                              </span>
                            )}
                        </div>
                        <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                          {entry.ticket_title}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {entry.actor.full_name}
                          </span>
                          {entry.note ? ` — ${entry.note}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                      {formatRelativeTime(entry.created_at)}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* Right Telemetry Column: Priority & Lifecycle Breakdown */}
        <section className="space-y-6 lg:col-span-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                Priority Distribution
              </h2>
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {kpis?.total ?? 0} total
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              {isLoading ? (
                <div className="space-y-3.5">
                  <SkeletonBlock className="h-6 w-full" />
                  <SkeletonBlock className="h-6 w-full" />
                  <SkeletonBlock className="h-6 w-full" />
                  <SkeletonBlock className="h-6 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Critical", count: byPriority?.critical ?? 0, bar: "bg-rose-500" },
                    { label: "High", count: byPriority?.high ?? 0, bar: "bg-amber-500" },
                    {
                      label: "Medium",
                      count: byPriority?.medium ?? 0,
                      bar: "bg-emerald-600 dark:bg-emerald-400",
                    },
                    {
                      label: "Low",
                      count: byPriority?.low ?? 0,
                      bar: "bg-zinc-400 dark:bg-zinc-600",
                    },
                  ].map((row) => {
                    const pct = Math.round((row.count / totalForBars) * 100);
                    return (
                      <div key={row.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {row.label}
                          </span>
                          <span className="font-mono text-zinc-500 dark:text-zinc-400">
                            {row.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${row.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 grid grid-cols-3 divide-x divide-zinc-200/80 border-t border-zinc-200/80 pt-4 text-center dark:divide-zinc-800 dark:border-zinc-800">
                {[
                  { label: "Approved", value: kpis?.approved ?? 0 },
                  { label: "Resolved", value: kpis?.resolved ?? 0 },
                  { label: "Closed", value: kpis?.closed ?? 0 },
                ].map((stat) => (
                  <div key={stat.label} className="px-2">
                    <p className="font-mono text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link
            to="/projects"
            className="group flex items-center justify-between rounded-2xl border border-zinc-200/90 bg-white p-5 transition hover:border-emerald-500/50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-emerald-500/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-emerald-400">
                <FolderKanban className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100">
                  Projects & RBAC Directory
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Annotated single-query counts & role boundaries
                </p>
              </div>
            </div>
            <ArrowUpRight
              className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-600"
              strokeWidth={1.75}
            />
          </Link>
        </section>
      </div>

      <CreateTicketModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
