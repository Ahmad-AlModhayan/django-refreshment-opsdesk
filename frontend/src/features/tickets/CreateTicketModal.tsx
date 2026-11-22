/**
 * Lifecycle Stage: Mutation Form -> Ticket Creation Modal Using React 19 useActionState
 * Production Invariant (🔴): Submits only write-safe fields; server assigns author and initial status='open'.
 * Trap Prevented (⚠️): Allowing clients to inject arbitrary initial status or spoof another author ID.
 */
import { X } from "lucide-react";
import { useActionState, useEffect } from "react";
import { extractApiError } from "../../api/client";
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-ticket-heading"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-zinc-800">
          <div>
            <h2
              id="create-ticket-heading"
              className="text-sm font-semibold text-slate-900 dark:text-zinc-100"
            >
              Create Operational Request
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Author and initial status (<code className="font-mono">open</code>) are enforced server-side.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="space-y-4 p-5">
          {state.error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Project
              </label>
              <select
                name="project"
                required
                defaultValue={projects[0]?.id ?? ""}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Priority
              </label>
              <select
                name="priority"
                defaultValue="high"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
              Request Title
            </label>
            <input
              name="title"
              type="text"
              required
              maxLength={200}
              placeholder="e.g. Approve PostgreSQL 17 connection pool resize for billing API"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
              Technical Scope & Rollback Plan
            </label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Describe operational impact, blast radius, and rollback steps…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
              Assignee (Optional)
            </label>
            <select
              name="assignee"
              defaultValue=""
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending ? "Creating…" : "Create Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
