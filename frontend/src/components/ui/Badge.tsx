/**
 * Lifecycle Stage: UI Design System -> Calibrated Status, Priority & Action Pill Primitives
 * Production Invariant (🔴): Enforces singular Zinc + Emerald neutral hierarchy with desaturated semantic signals.
 * Trap Prevented (⚠️): Purple/neon color drift or inconsistent status badges across tables, drawers, and audit feeds.
 */
import type { AuditAction, TicketPriority, TicketStatus } from "../../types/api";

const STATUS_STYLES: Record<TicketStatus, { label: string; className: string; dot: string }> = {
  open: {
    label: "Open",
    className:
      "border-zinc-300/80 bg-zinc-100/80 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200",
    dot: "bg-zinc-500 dark:bg-zinc-400",
  },
  in_progress: {
    label: "In Progress",
    className:
      "border-sky-300/70 bg-sky-50/80 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
    dot: "bg-sky-600 dark:bg-sky-400",
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    className:
      "border-amber-300/80 bg-amber-50/80 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "bg-amber-600 dark:bg-amber-400",
  },
  approved: {
    label: "Approved",
    className:
      "border-emerald-300/80 bg-emerald-50/80 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  rejected: {
    label: "Rejected",
    className:
      "border-rose-300/80 bg-rose-50/80 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
    dot: "bg-rose-600 dark:bg-rose-400",
  },
  resolved: {
    label: "Resolved",
    className:
      "border-teal-300/70 bg-teal-50/80 text-teal-900 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300",
    dot: "bg-teal-600 dark:bg-teal-400",
  },
  closed: {
    label: "Closed",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500",
    dot: "bg-zinc-400 dark:bg-zinc-600",
  },
};

const PRIORITY_STYLES: Record<TicketPriority, { label: string; className: string }> = {
  low: {
    label: "Low",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
  },
  medium: {
    label: "Medium",
    className:
      "border-zinc-300 bg-zinc-100/70 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200",
  },
  high: {
    label: "High",
    className:
      "border-amber-300/80 bg-amber-50/70 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  },
  critical: {
    label: "Critical",
    className:
      "border-rose-300 bg-rose-50 text-rose-800 font-semibold dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300",
  },
};

export function formatStatusLabel(status: string): string {
  return STATUS_STYLES[status as TicketStatus]?.label ?? status.replaceAll("_", " ");
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = STATUS_STYLES[status] ?? STATUS_STYLES.open;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${cfg.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const cfg = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium;
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-tight whitespace-nowrap ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export function ActionBadge({ action }: { action: AuditAction }) {
  const styles: Record<AuditAction, string> = {
    created:
      "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    updated:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
    transitioned:
      "border-emerald-300/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-tight ${styles[action]}`}
    >
      {action}
    </span>
  );
}
