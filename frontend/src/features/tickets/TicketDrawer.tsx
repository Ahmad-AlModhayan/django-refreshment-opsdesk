/**
 * Lifecycle Stage: Detail Slide-Over -> State-Machine Transitions, RBAC Inline Edit & Audit Timeline
 * Production Invariant (🔴): Renders only valid server-advertised next states and enforces author/staff edit boundaries.
 * Trap Prevented (⚠️): Presenting illegal status transitions or exposing edit controls that silently fail without guidance.
 */
import { ArrowRight, Check, Edit3, Lock, ShieldCheck, X } from "lucide-react";
import { useActionState, useState } from "react";
import { extractApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { ActionBadge, formatStatusLabel, PriorityBadge, StatusBadge } from "../../components/ui/Badge";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import type { TicketPriority, TicketStatus } from "../../types/api";
import { useTicketDetail, useTransitionTicket, useUpdateTicket, useUsers } from "./useTickets";

interface TicketDrawerProps {
  ticketId: number | null;
  onClose: () => void;
}

export function TicketDrawer({ ticketId, onClose }: TicketDrawerProps) {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data: ticket, isLoading, isError } = useTicketDetail(ticketId);
  const { data: users = [] } = useUsers();
  const transitionMutation = useTransitionTicket();
  const updateMutation = useUpdateTicket();

  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const canModify = Boolean(
    user && ticket && (user.is_staff || user.is_superuser || ticket.author.id === user.id),
  );

  const [editState, editAction, isSavingEdit] = useActionState<{ error: string | null }, FormData>(
    async (_prev, formData) => {
      if (!ticket) return { error: null };
      const title = String(formData.get("title") ?? "").trim();
      const description = String(formData.get("description") ?? "").trim();
      const priority = String(formData.get("priority") ?? ticket.priority) as TicketPriority;
      const rawAssignee = String(formData.get("assignee") ?? "");
      const assignee = rawAssignee ? Number(rawAssignee) : null;

      try {
        await updateMutation.mutateAsync({
          id: ticket.id,
          payload: { title, description, priority, assignee },
        });
        notify("success", `Updated ${ticket.reference_code}`, "Changes saved and recorded in audit log.");
        setIsEditing(false);
        return { error: null };
      } catch (err) {
        return { error: extractApiError(err, "Failed to update ticket.") };
      }
    },
    { error: null },
  );

  if (ticketId === null) return null;

  const handleTransition = async (nextStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      await transitionMutation.mutateAsync({
        id: ticket.id,
        toStatus: nextStatus,
        note: note.trim(),
      });
      setNote("");
      notify(
        "success",
        `${ticket.reference_code} → ${formatStatusLabel(nextStatus)}`,
        "Row lock acquired, status transitioned, and AuditLog committed atomically.",
      );
    } catch (err) {
      notify("error", "Transition rejected", extractApiError(err));
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/35 backdrop-blur-[1px]">
      <div className="flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {ticket?.reference_code ?? `#${ticketId}`}
            </span>
            {ticket && <StatusBadge status={ticket.status} />}
            {ticket && <PriorityBadge priority={ticket.priority} />}
          </div>
          <div className="flex items-center gap-1.5">
            {ticket && canModify && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                onClose();
              }}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Close ticket drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {isLoading ? (
            <div className="space-y-4">
              <SkeletonBlock className="h-6 w-3/4" />
              <SkeletonBlock className="h-24 w-full" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-40 w-full" />
            </div>
          ) : isError || !ticket ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              Unable to load ticket details.
            </div>
          ) : (
            <>
              {/* Title + Description or Inline Edit Form */}
              {isEditing ? (
                <form
                  action={editAction}
                  className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/5"
                >
                  {editState.error && (
                    <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                      {editState.error}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-300">
                      Title
                    </label>
                    <input
                      name="title"
                      required
                      defaultValue={ticket.title}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-300">
                      Description
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      defaultValue={ticket.description}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-300">
                        Priority
                      </label>
                      <select
                        name="priority"
                        defaultValue={ticket.priority}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-300">
                        Assignee
                      </label>
                      <select
                        name="assignee"
                        defaultValue={ticket.assignee?.id ?? ""}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      >
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {isSavingEdit ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
                    {ticket.title}
                  </h2>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                    {ticket.description}
                  </p>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Project
                  </p>
                  <p className="mt-0.5 font-medium text-slate-800 dark:text-zinc-200">
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      {ticket.project.code}
                    </span>{" "}
                    — {ticket.project.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Department
                  </p>
                  <p className="mt-0.5 font-medium text-slate-800 dark:text-zinc-200">
                    {ticket.project.department}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Author
                  </p>
                  <p className="mt-0.5 font-medium text-slate-800 dark:text-zinc-200">
                    {ticket.author.full_name}{" "}
                    <span className="font-mono text-[10px] text-slate-500">
                      (@{ticket.author.username})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Assignee
                  </p>
                  <p className="mt-0.5 font-medium text-slate-800 dark:text-zinc-200">
                    {ticket.assignee ? ticket.assignee.full_name : "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Created (UTC)
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Last Updated
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                    {new Date(ticket.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* State Machine Workflow Controls */}
              <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                      State-Machine Transitions
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    select_for_update()
                  </span>
                </div>

                {!canModify ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">Read-Only (RBAC Enforced)</p>
                      <p className="mt-0.5 text-[11px] opacity-90">
                        You are signed in as <code className="font-mono">@{user?.username}</code>{" "}
                        (Requester). Only the ticket author (
                        <code className="font-mono">@{ticket.author.username}</code>) or staff can
                        edit or transition this ticket. Server-side{" "}
                        <code className="font-mono">IsAuthorOrStaff</code> enforces HTTP 403.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional audit note (e.g. Change Advisory Board sign-off)…"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <div className="flex flex-wrap gap-2">
                      {ticket.allowed_transitions.map((nextStatus) => (
                        <button
                          key={nextStatus}
                          type="button"
                          disabled={transitionMutation.isPending}
                          onClick={() => handleTransition(nextStatus)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          Move to {formatStatusLabel(nextStatus)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Immutable Audit History Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                    Immutable Audit History ({ticket.audit_logs.length})
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400">
                    prefetch_related(&quot;audit_logs__actor&quot;)
                  </span>
                </div>

                <ol className="relative ml-2 space-y-4 border-l border-slate-200 pl-4 dark:border-zinc-800">
                  {ticket.audit_logs.map((entry) => (
                    <li key={entry.id} className="relative text-xs">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-indigo-500 dark:border-zinc-950" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <ActionBadge action={entry.action} />
                          <span className="font-medium text-slate-800 dark:text-zinc-200">
                            {entry.actor.full_name}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      {entry.from_status && entry.to_status && entry.from_status !== entry.to_status && (
                        <p className="mt-1 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                          {formatStatusLabel(entry.from_status)} → {formatStatusLabel(entry.to_status)}
                        </p>
                      )}
                      {entry.note && (
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                          {entry.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
