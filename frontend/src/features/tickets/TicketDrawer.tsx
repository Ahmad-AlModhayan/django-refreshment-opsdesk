/**
 * Lifecycle Stage: Detail Slide-Over -> Spring Drawer for State-Machine Transitions, RBAC Edit/Delete & Audit Trail
 * Production Invariant (🔴): Animates solely via GPU transforms, enforces server-advertised states, and syncs Study Mode.
 * Trap Prevented (⚠️): Presenting illegal status transitions or mutating layout properties during drawer open/close.
 */
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Edit3, Lock, ShieldCheck, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { extractApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { ActionBadge, formatStatusLabel, PriorityBadge, StatusBadge } from "../../components/ui/Badge";
import { MonogramAvatar, SPRING_DRAWER } from "../../components/ui/MotionPrimitives";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import type { TicketPriority, TicketStatus } from "../../types/api";
import { useStudyMode } from "../study/StudyModeContext";
import {
  useDeleteTicket,
  useTicketDetail,
  useTransitionTicket,
  useUpdateTicket,
  useUsers,
} from "./useTickets";

interface TicketDrawerProps {
  ticketId: number | null;
  onClose: () => void;
}

export function TicketDrawer({ ticketId, onClose }: TicketDrawerProps) {
  const { user } = useAuth();
  const { notify } = useToast();
  const { setActiveTicketRef } = useStudyMode();
  const { data: ticket, isLoading, isError } = useTicketDetail(ticketId);
  const { data: users = [] } = useUsers();
  const transitionMutation = useTransitionTicket();
  const updateMutation = useUpdateTicket();
  const deleteMutation = useDeleteTicket();

  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setActiveTicketRef(ticket?.reference_code ?? null);
    return () => setActiveTicketRef(null);
  }, [ticket?.reference_code, setActiveTicketRef]);

  useEffect(() => {
    if (ticketId === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ticketId, onClose]);

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

  const handleDelete = async () => {
    if (!ticket) return;
    try {
      await deleteMutation.mutateAsync(ticket.id);
      notify("info", `Deleted ${ticket.reference_code}`, "Ticket removed from queue.");
      onClose();
    } catch (err) {
      notify("error", "Delete blocked", extractApiError(err));
    }
  };

  return (
    <AnimatePresence>
      {ticketId !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-40 flex justify-end bg-zinc-950/40 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Ticket details drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SPRING_DRAWER}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-xl flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200/80 px-5 py-3.5 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {ticket?.reference_code ?? `#${ticketId}`}
                </span>
                {ticket && <StatusBadge status={ticket.status} />}
                {ticket && <PriorityBadge priority={ticket.priority} />}
              </div>
              <div className="flex items-center gap-1.5">
                {ticket && canModify && !isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDelete(false);
                        setIsEditing(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                      <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Edit
                    </button>
                    {confirmDelete ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={handleDelete}
                          className="rounded-md bg-rose-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50"
                        >
                          {deleteMutation.isPending ? "Deleting…" : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.96] dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                        title="Delete ticket"
                        aria-label="Delete ticket"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label="Close ticket drawer"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Body */}
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
                  {isEditing ? (
                    <form
                      action={editAction}
                      className="space-y-3 rounded-xl border border-emerald-300/70 bg-emerald-50/30 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/[0.04]"
                    >
                      {editState.error && (
                        <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                          {editState.error}
                        </div>
                      )}
                      <div className="grid gap-1.5">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                          Title
                        </label>
                        <input
                          name="title"
                          required
                          defaultValue={ticket.title}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-950 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                          Description
                        </label>
                        <textarea
                          name="description"
                          required
                          rows={3}
                          defaultValue={ticket.description}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-950 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                            Priority
                          </label>
                          <select
                            name="priority"
                            defaultValue={ticket.priority}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                            Assignee
                          </label>
                          <select
                            name="assignee"
                            defaultValue={ticket.assignee?.id ?? ""}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                          className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingEdit}
                          className="inline-flex items-center gap-1 rounded-md bg-zinc-950 px-3 py-1 text-xs font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2} />
                          {isSavingEdit ? "Saving…" : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                        {ticket.title}
                      </h2>
                      <p className="max-w-[65ch] text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {ticket.description}
                      </p>
                    </div>
                  )}

                  {/* Hair-lined Metadata Matrix */}
                  <div className="grid grid-cols-2 gap-y-4 border-y border-zinc-200/80 py-4 text-xs dark:border-zinc-800">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Project
                      </p>
                      <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-200">
                        <span className="font-mono text-emerald-700 dark:text-emerald-400">
                          {ticket.project.code}
                        </span>{" "}
                        — {ticket.project.name}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Department
                      </p>
                      <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-200">
                        {ticket.project.department}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Author
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <MonogramAvatar name={ticket.author.full_name} size="xs" />
                        <span className="font-medium text-zinc-900 dark:text-zinc-200">
                          {ticket.author.full_name}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Assignee
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {ticket.assignee ? (
                          <>
                            <MonogramAvatar name={ticket.assignee.full_name} size="xs" />
                            <span className="font-medium text-zinc-900 dark:text-zinc-200">
                              {ticket.assignee.full_name}
                            </span>
                          </>
                        ) : (
                          <span className="font-mono text-[11px] text-zinc-400">Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Created (UTC)
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {new Date(ticket.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Updated
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {new Date(ticket.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* State-Machine Transitions */}
                  <div className="space-y-3 rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck
                          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                          strokeWidth={1.75}
                        />
                        <h3 className="text-xs font-semibold text-zinc-950 dark:text-zinc-100">
                          State-Machine Transitions
                        </h3>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400">
                        select_for_update(of=(&quot;self&quot;,))
                      </span>
                    </div>

                    {!canModify ? (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                        <Lock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <div>
                          <p className="font-semibold">Read-Only (RBAC Enforced)</p>
                          <p className="mt-0.5 text-[11px] opacity-90">
                            Signed in as <code className="font-mono">@{user?.username}</code>. Only{" "}
                            <code className="font-mono">@{ticket.author.username}</code> or staff
                            can mutate this ticket. Server <code className="font-mono">IsAuthorOrStaff</code>{" "}
                            enforces HTTP 403.
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
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-emerald-600/60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                        <div className="flex flex-wrap gap-2">
                          {ticket.allowed_transitions.map((nextStatus) => (
                            <button
                              key={nextStatus}
                              type="button"
                              disabled={transitionMutation.isPending}
                              onClick={() => handleTransition(nextStatus)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/80 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-900 transition hover:bg-emerald-100 active:scale-[0.98] disabled:opacity-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                            >
                              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                              Move to {formatStatusLabel(nextStatus)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Immutable Audit Timeline */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-zinc-950 dark:text-zinc-100">
                        Immutable Audit History ({ticket.audit_logs.length})
                      </h3>
                      <span className="font-mono text-[10px] text-zinc-400">
                        prefetch_related(&quot;audit_logs__actor&quot;)
                      </span>
                    </div>

                    <ol className="relative ml-2 space-y-4 border-l border-zinc-200 pl-4 dark:border-zinc-800">
                      {ticket.audit_logs.map((entry) => (
                        <li key={entry.id} className="relative text-xs">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-600 dark:border-zinc-950 dark:bg-emerald-400" />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <ActionBadge action={entry.action} />
                              <span className="font-medium text-zinc-900 dark:text-zinc-200">
                                {entry.actor.full_name}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-zinc-400">
                              {new Date(entry.created_at).toLocaleString()}
                            </span>
                          </div>
                          {entry.from_status &&
                            entry.to_status &&
                            entry.from_status !== entry.to_status && (
                              <p className="mt-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                                {formatStatusLabel(entry.from_status)} →{" "}
                                {formatStatusLabel(entry.to_status)}
                              </p>
                            )}
                          {entry.note && (
                            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
