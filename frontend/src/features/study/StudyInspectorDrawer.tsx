/**
 * Lifecycle Stage: Embedded Learning System -> Collapsible Engineering Inspector Drawer
 * Production Invariant (🔴): Surfaces live X-DB-Query-Count telemetry, 5-step traces, failure chains, and recall drills.
 * Trap Prevented (⚠️): Passive reading without active recall or live verification against real API traffic.
 */
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  HelpCircle,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { clearTelemetry, useTelemetryEvents } from "../../api/telemetryStore";
import { STUDY_MODULES } from "./studyContent";
import { type StudyScreenKey, useStudyMode } from "./StudyModeContext";

type TabId = "telemetry" | "trace" | "chains" | "traps" | "drills";

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: "telemetry", label: "Telemetry", icon: Activity },
  { id: "trace", label: "Trace", icon: GitBranch },
  { id: "chains", label: "Defenses", icon: ShieldAlert },
  { id: "traps", label: "Traps", icon: AlertTriangle },
  { id: "drills", label: "Recall", icon: HelpCircle },
];

export function StudyInspectorDrawer({ screenKey }: { screenKey: StudyScreenKey }) {
  const { enabled, setEnabled, activeTicketRef } = useStudyMode();
  const [activeTab, setActiveTab] = useState<TabId>("telemetry");
  const [openDrills, setOpenDrills] = useState<Record<string, boolean>>({});
  const telemetry = useTelemetryEvents();

  if (!enabled) return null;

  const module = STUDY_MODULES[screenKey];
  const latestEvent = telemetry[0];

  const toggleDrill = (key: string) => {
    setOpenDrills((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside
      aria-label="Study Mode Engineering Inspector"
      className="fixed top-14 right-0 bottom-0 z-30 flex w-full max-w-[440px] flex-col border-l border-indigo-200/80 bg-white shadow-2xl dark:border-indigo-500/30 dark:bg-zinc-950"
    >
      {/* Inspector header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-indigo-950/30">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold tracking-tight text-indigo-950 dark:text-indigo-200">
              Engineering Inspector
            </span>
            <span className="rounded bg-indigo-600 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white">
              STUDY MODE
            </span>
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-600 dark:text-zinc-400">
            {activeTicketRef
              ? `Drawer: ${activeTicketRef} • POST /api/tickets/{id}/transition/`
              : `${module.screenTitle} • ${module.endpointFocus}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(false)}
          className="rounded-md p-1 text-slate-500 hover:bg-white/70 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Close Study Inspector"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tab strip */}
      <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50/80 px-1.5 pt-1.5 dark:border-zinc-800 dark:bg-zinc-900/60">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 rounded-t-md border-b-2 px-1 py-2 text-[10px] font-semibold transition ${
                active
                  ? "border-indigo-600 bg-white text-indigo-700 dark:border-indigo-400 dark:bg-zinc-950 dark:text-indigo-300"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 text-xs">
        {activeTab === "telemetry" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 p-3 dark:border-indigo-500/20 dark:bg-indigo-500/5">
              <p className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200">
                Query Efficiency Benchmark (Active Screen)
              </p>
              <p className="mt-1 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                ✓ {module.expectedQueries}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                {module.naiveComparison}
              </p>
              {latestEvent && latestEvent.queryCount !== null && (
                <div className="mt-2.5 flex items-center justify-between border-t border-indigo-200/60 pt-2 font-mono text-[11px] dark:border-indigo-500/20">
                  <span className="text-slate-500 dark:text-zinc-400">Latest observed call:</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                    {latestEvent.queryCount} SQL • {latestEvent.responseTimeMs?.toFixed(1)} ms
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 dark:text-zinc-200">
                Live Request Stream ({telemetry.length})
              </h4>
              {telemetry.length > 0 && (
                <button
                  type="button"
                  onClick={clearTelemetry}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 dark:text-zinc-400"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            {telemetry.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                Interact with filters, drawers, or tabs to inspect live SQL query headers.
              </p>
            ) : (
              <div className="space-y-2">
                {telemetry.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 dark:bg-zinc-800 dark:text-zinc-200">
                          {ev.method}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            ev.ok
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                          }`}
                        >
                          {ev.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        {ev.queryCount !== null && (
                          <span
                            className={`rounded px-1.5 py-0.5 font-semibold ${
                              ev.queryCount <= 5
                                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                            }`}
                          >
                            {ev.queryCount} SQL
                          </span>
                        )}
                        {ev.responseTimeMs !== null && (
                          <span className="text-slate-500 dark:text-zinc-400">
                            {ev.responseTimeMs.toFixed(1)} ms
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1.5 break-all font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                      {ev.url}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "trace" && (
          <div className="space-y-3">
            <p className="text-slate-500 dark:text-zinc-400">
              End-to-end execution trace from React component to PostgreSQL for{" "}
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {module.screenTitle}
              </span>
              :
            </p>
            <ol className="relative ml-2.5 space-y-4 border-l border-indigo-200 pl-5 dark:border-indigo-500/30">
              {module.trace.map((item) => (
                <li key={item.step} className="relative">
                  <span className="absolute -left-[30px] flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 font-mono text-[10px] font-bold text-white">
                    {item.step}
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-zinc-100">{item.layer}</p>
                  <p className="mt-0.5 break-all font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                    {item.filePath}
                  </p>
                  <p className="mt-1 leading-relaxed text-slate-600 dark:text-zinc-400">
                    {item.summary}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {activeTab === "chains" && (
          <div className="space-y-4">
            {module.chains.map((chain) => (
              <div
                key={chain.title}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-slate-900 dark:text-zinc-100">
                    🔴 {chain.title}
                  </h4>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400">
                  {chain.failure}
                </p>
                <p className="mt-1.5 font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                  File: {chain.fileRef}
                </p>

                <div className="mt-2.5 space-y-2">
                  <div className="overflow-x-auto rounded-lg border border-rose-200 bg-rose-50/70 p-2 dark:border-rose-500/30 dark:bg-rose-950/30">
                    <p className="mb-1 font-mono text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                      ✗ Broken (Naive)
                    </p>
                    <pre className="font-mono text-[10px] leading-relaxed text-rose-900 dark:text-rose-200">
                      {chain.brokenCode}
                    </pre>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-emerald-200 bg-emerald-50/70 p-2 dark:border-emerald-500/30 dark:bg-emerald-950/30">
                    <p className="mb-1 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                      ✓ Production-Safe (This Repo)
                    </p>
                    <pre className="font-mono text-[10px] leading-relaxed text-emerald-900 dark:text-emerald-200">
                      {chain.safeCode}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "traps" && (
          <div className="space-y-3">
            {module.acronymsAndTraps.map((item) => (
              <div
                key={item.term}
                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {item.term}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-300">
                    {item.expansion}
                  </span>
                </div>
                <div className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/70 p-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <span className="font-semibold">⚠️ Trap: </span>
                  {item.trap}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "drills" && (
          <div className="space-y-3">
            <p className="text-slate-500 dark:text-zinc-400">
              Test your recall before revealing the answer. Each drill maps directly to code running
              on this screen.
            </p>
            {module.drills.map((drill, idx) => {
              const key = `${screenKey}-${idx}`;
              const revealed = Boolean(openDrills[key]);
              return (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="font-semibold leading-snug text-slate-900 dark:text-zinc-100">
                    Q{idx + 1}. {drill.question}
                  </p>
                  <p className="mt-1.5 text-[11px] italic text-slate-500 dark:text-zinc-400">
                    Hint: {drill.hint}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleDrill(key)}
                    className="mt-2.5 inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
                  >
                    {revealed ? (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        Hide answer
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3.5 w-3.5" />
                        Reveal answer
                      </>
                    )}
                  </button>
                  {revealed && (
                    <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-[11px] leading-relaxed text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{drill.answer}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
