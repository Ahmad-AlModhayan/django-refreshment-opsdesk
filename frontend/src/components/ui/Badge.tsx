/**
 * Lifecycle Stage: UI Design System -> Status, Priority & Role Pill Primitives
 * Production Invariant (🔴): Centralizes semantic color tokens across Light and Dark modes for visual consistency.
 * Trap Prevented (⚠️): Scattered Tailwind status classes drifting across tables, drawers, and audit timelines.
 */
import type { AuditAction, TicketPriority, TicketStatus } from "../../types/api";

const STATUS_STYLES: Record<TicketStatus, { label: string; className: string; dot: string }> = {
  open: {
    label: "Open",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  in_progress: {
    label: "In Progress",
    className:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  resolved: {
    label: "Resolved",
    className:
      "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  closed: {
    label: "Closed",
    className:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
    dot: "bg-slate-400 dark:bg-zinc-500",
  },
};

const PRIORITY_STYLES: Record<TicketPriority, { label: string; className: string }> = {
  low: {
    label: "Low",
    className:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300",
  },
  medium: {
    label: "Medium",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  },
  high: {
    label: "High",
    className:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300",
  },
  critical: {
    label: "Critical",
    className:
      "border-rose-300 bg-rose-50 text-rose-700 font-semibold dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300",
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
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-tight whitespace-nowrap ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export function ActionBadge({ action }: { action: AuditAction }) {
  const styles: Record<AuditAction, string> = {
    created:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
    updated:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    transitioned:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase ${styles[action]}`}
    >
      {action}
    </span>
  );
}
