/**
 * Lifecycle Stage: Embedded Learning System -> Spring-Animated Engineering Inspector Drawer
 * Production Invariant (🔴): Zero emojis in markup; uses crisp vector icons, layoutId tab bar, and live SQL telemetry.
 * Trap Prevented (⚠️): Passive documentation disconnected from real-time HTTP headers and route execution.
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  HelpCircle,
  ShieldAlert,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { clearTelemetry, useTelemetryEvents } from "../../api/telemetryStore";
import { SPRING_DRAWER, SPRING_TACTILE } from "../../components/ui/MotionPrimitives";
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

  const module = STUDY_MODULES[screenKey];
  const latestEvent = telemetry[0];

  const toggleDrill = (key: string) => {
    setOpenDrills((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      {enabled && (
        <motion.aside
          aria-label="Study Mode Engineering Inspector"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={SPRING_DRAWER}
          className="fixed top-14 right-0 bottom-0 z-30 flex w-full max-w-[440px] flex-col border-l border-zinc-200/90 bg-white shadow-[-16px_0_40px_-20px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:bg-zinc-950"
        >
          {/* Inspector Header */}
          <div className="flex items-center justify-between border-b border-zinc-200/80 bg-zinc-50/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookOpen
                  className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                  strokeWidth={1.75}
                />
                <span className="text-xs font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                  Engineering Inspector
                </span>
                <span className="rounded border border-emerald-300/80 bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                  Live
                </span>
              </div>
              <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                {activeTicketRef
                  ? `Drawer: ${activeTicketRef} · POST /api/tickets/{id}/transition/`
                  : `${module.screenTitle} · ${module.endpointFocus}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(false)}
              className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-200/60 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Close Study Inspector"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>

          {/* Shared-Element Spring Tab Strip */}
          <div className="grid grid-cols-5 border-b border-zinc-200/80 bg-zinc-50/50 px-1.5 pt-1.5 dark:border-zinc-800 dark:bg-zinc-900/40">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-col items-center gap-1 px-1 py-2 text-[10px] font-semibold transition-colors ${
                    active
                      ? "text-zinc-950 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      active ? "text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                    strokeWidth={1.75}
                  />
                  <span>{tab.label}</span>
                  {active && (
                    <motion.span
                      layoutId="study-tab-underline"
                      transition={SPRING_TACTILE}
                      className="absolute right-1.5 bottom-0 left-1.5 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 text-xs">
            {activeTab === "telemetry" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Query Efficiency Target
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    {module.expectedQueries}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    {module.naiveComparison}
                  </p>
                  {latestEvent && latestEvent.queryCount !== null && (
                    <div className="mt-3 flex items-center justify-between border-t border-zinc-200/80 pt-2.5 font-mono text-[11px] dark:border-zinc-800">
                      <span className="text-zinc-500 dark:text-zinc-400">Latest observed:</span>
                      <span className="rounded border border-emerald-300/70 bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                        {latestEvent.queryCount} SQL · {latestEvent.responseTimeMs?.toFixed(1)} ms
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Live Request Stream ({telemetry.length})
                  </h4>
                  {telemetry.length > 0 && (
                    <button
                      type="button"
                      onClick={clearTelemetry}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-500 transition hover:text-rose-600 dark:text-zinc-400"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                      Clear
                    </button>
                  )}
                </div>

                {telemetry.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-zinc-300 p-5 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    Interact with filters, drawers, or routes to capture live SQL telemetry headers.
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-200/80 overflow-hidden rounded-xl border border-zinc-200/80 dark:divide-zinc-800 dark:border-zinc-800">
                    {telemetry.map((ev) => (
                      <div key={ev.id} className="bg-white p-2.5 dark:bg-zinc-900/50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                              {ev.method}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                ev.ok
                                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                                  : "bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"
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
                                    ? "bg-zinc-900 text-emerald-400 dark:bg-zinc-800 dark:text-emerald-300"
                                    : "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300"
                                }`}
                              >
                                {ev.queryCount} SQL
                              </span>
                            )}
                            {ev.responseTimeMs !== null && (
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {ev.responseTimeMs.toFixed(1)} ms
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 break-all font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                          {ev.url}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "trace" && (
              <div className="space-y-4">
                <p className="text-zinc-500 dark:text-zinc-400">
                  End-to-end execution path for{" "}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {module.screenTitle}
                  </span>
                  :
                </p>
                <ol className="relative ml-2.5 space-y-5 border-l border-zinc-200 pl-5 dark:border-zinc-800">
                  {module.trace.map((item) => (
                    <li key={item.step} className="relative">
                      <span className="absolute -left-[30px] flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 font-mono text-[10px] font-bold text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-1 dark:ring-emerald-500/40">
                        {item.step}
                      </span>
                      <p className="font-semibold text-zinc-950 dark:text-zinc-100">{item.layer}</p>
                      <p className="mt-0.5 break-all font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                        {item.filePath}
                      </p>
                      <p className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-400">
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
                    className="rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50"
                  >
                    <div className="flex items-start gap-2">
                      <ShieldAlert
                        className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400"
                        strokeWidth={1.75}
                      />
                      <h4 className="font-semibold text-zinc-950 dark:text-zinc-100">
                        {chain.title}
                      </h4>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {chain.failure}
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                      {chain.fileRef}
                    </p>

                    <div className="mt-3 space-y-2">
                      <div className="overflow-x-auto rounded-lg border border-rose-200/80 bg-rose-50/60 p-2.5 dark:border-rose-500/30 dark:bg-rose-950/30">
                        <p className="mb-1 flex items-center gap-1 font-mono text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                          <XCircle className="h-3 w-3" strokeWidth={1.75} />
                          Broken (Naive)
                        </p>
                        <pre className="font-mono text-[10px] leading-relaxed text-rose-950 dark:text-rose-200">
                          {chain.brokenCode}
                        </pre>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-emerald-200/80 bg-emerald-50/60 p-2.5 dark:border-emerald-500/30 dark:bg-emerald-950/30">
                        <p className="mb-1 flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} />
                          Production-Safe (This Repo)
                        </p>
                        <pre className="font-mono text-[10px] leading-relaxed text-emerald-950 dark:text-emerald-200">
                          {chain.safeCode}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "traps" && (
              <div className="divide-y divide-zinc-200/80 overflow-hidden rounded-xl border border-zinc-200/90 dark:divide-zinc-800 dark:border-zinc-800">
                {module.acronymsAndTraps.map((item) => (
                  <div key={item.term} className="bg-white p-3.5 dark:bg-zinc-900/50">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {item.term}
                      </span>
                      <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                        {item.expansion}
                      </span>
                    </div>
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 p-2.5 text-[11px] leading-relaxed text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      <AlertTriangle
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                        strokeWidth={1.75}
                      />
                      <span>{item.trap}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "drills" && (
              <div className="space-y-3">
                <p className="text-zinc-500 dark:text-zinc-400">
                  Answer out loud before revealing. Each drill maps directly to live code on this route.
                </p>
                {module.drills.map((drill, idx) => {
                  const key = `${screenKey}-${idx}`;
                  const revealed = Boolean(openDrills[key]);
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-zinc-200/90 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60"
                    >
                      <p className="font-semibold leading-snug text-zinc-950 dark:text-zinc-100">
                        Q{idx + 1}. {drill.question}
                      </p>
                      <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Hint: {drill.hint}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleDrill(key)}
                        className="mt-2.5 inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 transition hover:border-emerald-500/50 hover:text-emerald-700 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:text-emerald-300"
                      >
                        {revealed ? (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Hide answer
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Reveal answer
                          </>
                        )}
                      </button>
                      <AnimatePresence initial={false}>
                        {revealed && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={SPRING_TACTILE}
                            className="mt-2.5 flex items-start gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-2.5 text-[11px] leading-relaxed text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                          >
                            <CheckCircle2
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                              strokeWidth={1.75}
                            />
                            <span>{drill.answer}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
