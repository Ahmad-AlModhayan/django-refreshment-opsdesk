/**
 * Lifecycle Stage: Directory Screen -> Annotated Projects & RBAC Directory
 * Production Invariant (🔴): Displays live ticket counts computed via a single ORM Count('tickets') annotation.
 * Trap Prevented (⚠️): Firing N+1 ticket count queries per project card.
 */
import { AlertTriangle, ArrowRight, FolderKanban, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { useUsers } from "../tickets/useTickets";
import { useProjects } from "./useProjects";

export function ProjectsPage() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: users = [], isLoading: loadingUsers } = useUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
          Projects & RBAC Directory
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
          Each project card aggregates live ticket counts via SQL <code className="font-mono">Count(&quot;tickets&quot;)</code> in 1 query.
        </p>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {loadingProjects
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="mt-3 h-10 w-full" />
                <SkeletonBlock className="mt-4 h-12 w-full" />
              </div>
            ))
          : projects.map((proj) => (
              <div
                key={proj.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-indigo-700 dark:bg-zinc-800 dark:text-indigo-300">
                            {proj.code}
                          </span>
                          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                            {proj.name}
                          </h2>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {proj.department}
                        </p>
                      </div>
                    </div>
                    {proj.critical_ticket_count > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                        <AlertTriangle className="h-3 w-3" />
                        {proj.critical_ticket_count} Critical
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                    {proj.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-zinc-800">
                  <div className="flex items-center gap-5 font-mono text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">
                        {proj.ticket_count}
                      </span>{" "}
                      <span className="font-sans text-[11px] text-slate-500 dark:text-zinc-400">
                        total
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {proj.open_ticket_count}
                      </span>{" "}
                      <span className="font-sans text-[11px] text-slate-500 dark:text-zinc-400">
                        active
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/tickets?project=${proj.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    Inspect Queue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
      </div>

      {/* RBAC Directory Table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                RBAC Identity Matrix
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Server-enforced permissions via <code className="font-mono">IsAuthorOrStaff</code>
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-0.5 font-mono text-[10px] text-slate-600 dark:border-zinc-700 dark:text-zinc-300">
            <Shield className="h-3 w-3 text-indigo-500" />
            {users.length} active accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                <th className="px-5 py-2.5">User</th>
                <th className="px-5 py-2.5">Username</th>
                <th className="px-5 py-2.5">Role</th>
                <th className="px-5 py-2.5">Ticket Mutation Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {loadingUsers ? (
                <tr>
                  <td colSpan={4} className="p-4">
                    <SkeletonBlock className="h-8 w-full" />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-zinc-100">
                      {u.full_name}
                      <p className="font-mono text-[10px] font-normal text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600 dark:text-zinc-300">
                      @{u.username}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                          u.is_superuser
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
                            : u.is_staff
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "border-slate-200 bg-slate-100 text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-zinc-400">
                      {u.is_staff || u.is_superuser
                        ? "All tickets (global triage, edits & state approvals)"
                        : "Author-owned tickets only (HTTP 403 on other users' tickets)"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
