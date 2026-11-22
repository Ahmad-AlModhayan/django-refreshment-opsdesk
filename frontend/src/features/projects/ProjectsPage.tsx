/**
 * Lifecycle Stage: Directory Screen -> Annotated Projects Bento & RBAC Identity Matrix
 * Production Invariant (🔴): Displays live ticket counts computed via a single ORM Count('tickets') annotation.
 * Trap Prevented (⚠️): Firing N+1 ticket count queries per project card or rendering generic icon avatars.
 */
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, FolderKanban, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import {
  MonogramAvatar,
  STAGGER_CONTAINER,
  STAGGER_ITEM,
} from "../../components/ui/MotionPrimitives";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { useUsers } from "../tickets/useTickets";
import { useProjects } from "./useProjects";

export function ProjectsPage() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: users = [], isLoading: loadingUsers } = useUsers();

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          Governance & Access Control
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Projects & RBAC Directory
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Each service domain aggregates live ticket counts via SQL{" "}
          <code className="font-mono">Count(&quot;tickets&quot;)</code> in 1 annotated query.
        </p>
      </div>

      {/* Architectural 2-Column Project Grid */}
      {loadingProjects ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <SkeletonBlock className="h-5 w-32" />
              <SkeletonBlock className="mt-3 h-10 w-full" />
              <SkeletonBlock className="mt-4 h-12 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {projects.map((proj) => (
            <motion.div
              key={proj.id}
              variants={STAGGER_ITEM}
              className="group flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.06)] transition hover:border-emerald-500/50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-emerald-500/40"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-emerald-400">
                      <FolderKanban className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-emerald-400">
                          {proj.code}
                        </span>
                        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                          {proj.name}
                        </h2>
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {proj.department}
                      </p>
                    </div>
                  </div>
                  {proj.critical_ticket_count > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                      <AlertTriangle className="h-3 w-3" strokeWidth={1.75} />
                      {proj.critical_ticket_count} Critical
                    </span>
                  )}
                </div>

                <p className="mt-3.5 max-w-[60ch] text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {proj.description}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3.5 dark:border-zinc-800/80">
                <div className="flex items-center gap-5 font-mono text-xs">
                  <div>
                    <span className="font-semibold text-zinc-950 dark:text-zinc-100">
                      {proj.ticket_count}
                    </span>{" "}
                    <span className="font-sans text-[11px] text-zinc-500 dark:text-zinc-400">
                      total
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {proj.open_ticket_count}
                    </span>{" "}
                    <span className="font-sans text-[11px] text-zinc-500 dark:text-zinc-400">
                      active
                    </span>
                  </div>
                </div>

                <Link
                  to={`/tickets?project=${proj.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400"
                >
                  Inspect Queue
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={1.75}
                  />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* RBAC Identity Matrix */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
              RBAC Identity Matrix
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Server-enforced permissions via <code className="font-mono">IsAuthorOrStaff</code>
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <Shield className="h-3 w-3 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
            {users.length} active accounts
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/70 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                  <th className="px-5 py-2.5">Identity</th>
                  <th className="px-5 py-2.5">Handle</th>
                  <th className="px-5 py-2.5">Role</th>
                  <th className="px-5 py-2.5">Ticket Mutation Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={4} className="p-4">
                      <SkeletonBlock className="h-8 w-full" />
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/25">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <MonogramAvatar name={u.full_name} size="sm" />
                          <div>
                            <p className="font-medium text-zinc-950 dark:text-zinc-100">
                              {u.full_name}
                            </p>
                            <p className="font-mono text-[10px] text-zinc-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-zinc-600 dark:text-zinc-300">
                        @{u.username}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                            u.is_superuser
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : u.is_staff
                                ? "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">
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
      </section>
    </div>
  );
}
