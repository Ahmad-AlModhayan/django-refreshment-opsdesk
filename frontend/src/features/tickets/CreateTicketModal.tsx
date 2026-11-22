/**
 * Lifecycle Stage: Mutation Modal -> Spring-Animated Ticket Creation Using React 19 useActionState
 * Production Invariant (🔴): Submits only write-safe fields; server assigns author and initial status='open'.
 * Trap Prevented (⚠️): Allowing clients to inject arbitrary initial status or spoof another author ID.
 */
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useActionState, useEffect } from "react";
import { extractApiError } from "../../api/client";
import { SPRING_TACTILE } from "../../components/ui/MotionPrimitives";
import { useToast } from "../../components/ui/Toast";
import type { TicketPriority } from "../../types/api";
import { useProjects } from "../projects/useProjects";
import { useCreateTicket, useUsers } from "./useTickets";

interface CreateTicketModalProps {
  open: boolean;
  onClose: () => void;
}

interface ActionState {
  error: string | null;
}

export function CreateTicketModal({ open, onClose }: CreateTicketModalProps) {
  const { data: projects = [] } = useProjects();
  const { data: users = [] } = useUsers();
  const createMutation = useCreateTicket();
  const { notify } = useToast();

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const project = Number(formData.get("project"));
      const title = String(formData.get("title") ?? "").trim();
      const description = String(formData.get("description") ?? "").trim();
      const priority = String(formData.get("priority") ?? "medium") as TicketPriority;
      const rawAssignee = String(formData.get("assignee") ?? "");
      const assignee = rawAssignee ? Number(rawAssignee) : null;

      if (!project || !title || !description) {
        return { error: "Project, title, and description are required." };
      }

      try {
        const created = await createMutation.mutateAsync({
          project,
          title,
          description,
          priority,
          assignee,
        });
        notify("success", `Created ${created.reference_code}`, created.title);
        onClose();
        return { error: null };
      } catch (err) {
        return { error: extractApiError(err, "Unable to create ticket.") };
      }
    },
    { error: null },
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-ticket-heading"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={SPRING_TACTILE}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_48px_-16px_rgba(0,0,0,0.2)] dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
              <div>
                <h2
                  id="create-ticket-heading"
                  className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-100"
                >
                  Create Operational Request
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Author and initial status (<code className="font-mono">open</code>) are enforced server-side.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <form action={formAction} className="space-y-4 p-5">
              {state.error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {state.error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Project
                  </label>
                  <select
                    name="project"
                    required
                    defaultValue={projects[0]?.id ?? ""}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-950 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue="high"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-950 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Request Title
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="e.g. Approve PostgreSQL 17 connection pool resize for billing API"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-950 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Technical Scope & Rollback Plan
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="Describe operational impact, blast radius, and rollback steps…"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-950 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Assignee (Optional)
                </label>
                <select
                  name="assignee"
                  defaultValue=""
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-950 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-zinc-950 px-4 py-1.5 text-xs font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {isPending ? "Creating…" : "Create Request"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
