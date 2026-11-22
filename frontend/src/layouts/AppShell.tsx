/**
 * Lifecycle Stage: Application Chrome -> Collapsible Enterprise Sidebar, Top Utility Bar & Study Mode Host
 * Production Invariant (🔴): Persists Light/Dark preference cleanly and keeps Study Inspector synced to the active route.
 * Trap Prevented (⚠️): Layout shift or lost navigation context when toggling drawers or deep-linking routes.
 */
import {
  BookOpen,
  ExternalLink,
  FolderKanban,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Sun,
  Ticket,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTelemetryEvents } from "../api/telemetryStore";
import { useAuth } from "../auth/AuthContext";
import { StudyInspectorDrawer } from "../features/study/StudyInspectorDrawer";
import { type StudyScreenKey, useStudyMode } from "../features/study/StudyModeContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tickets", label: "Requests", icon: Ticket, end: false },
  { to: "/projects", label: "Projects", icon: FolderKanban, end: false },
  { to: "/audit", label: "Audit Log", icon: History, end: false },
];

function resolveStudyScreen(pathname: string): StudyScreenKey {
  if (pathname.startsWith("/tickets")) return "tickets";
  if (pathname.startsWith("/projects")) return "projects";
  if (pathname.startsWith("/audit")) return "audit";
  return "dashboard";
}

export function AppShell() {
  const { user, logout } = useAuth();
  const { enabled: studyEnabled, toggle: toggleStudy } = useStudyMode();
  const location = useLocation();
  const navigate = useNavigate();
  const telemetry = useTelemetryEvents();

  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("opsdesk_theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("opsdesk_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const activeScreen = resolveStudyScreen(location.pathname);
  const latestQueryCount = telemetry[0]?.queryCount;

  const handleGlobalSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim();
    navigate(q ? `/tickets?search=${encodeURIComponent(q)}` : "/tickets");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Collapsible Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3.5 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                  OpsDesk
                </p>
                <p className="font-mono text-[10px] text-slate-400">django-refreshment</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}

          <div className="my-3 border-t border-slate-100 dark:border-zinc-800/80" />

          <a
            href="/api/docs/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            title={collapsed ? "OpenAPI Swagger Docs" : undefined}
          >
            <span className="flex items-center gap-2.5">
              <ExternalLink className="h-4 w-4 shrink-0" />
              {!collapsed && <span>API Docs (Swagger)</span>}
            </span>
          </a>
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-200 p-2.5 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-zinc-900">
            <div className="min-w-0">
              {!collapsed ? (
                <>
                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-zinc-100">
                    {user?.full_name}
                  </p>
                  <p className="truncate font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                    @{user?.username} • {user?.role}
                  </p>
                </>
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-mono text-[10px] font-bold text-white">
                  {(user?.username?.[0] ?? "U").toUpperCase()}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              title="Sign out (blacklists refresh token)"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex min-h-screen flex-1 flex-col transition-all duration-200 ${
          collapsed ? "pl-16" : "pl-60"
        } ${studyEnabled ? "xl:pr-[440px]" : ""}`}
      >
        {/* Slim Top Utility Bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
          <form onSubmit={handleGlobalSearch} className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-2 left-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="search"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Jump to ticket (e.g. INFRA-1001, KMS, PostgreSQL)…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </form>

          <div className="flex items-center gap-2">
            {/* Role Indicator */}
            <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-700 sm:inline-flex dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  user?.is_superuser
                    ? "bg-indigo-500"
                    : user?.is_staff
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                }`}
              />
              {user?.role}
            </span>

            {/* Study Mode Toggle */}
            <button
              type="button"
              onClick={toggleStudy}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                studyEnabled
                  ? "border-indigo-500 bg-indigo-600 text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-500/40"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Study Mode</span>
              {latestQueryCount !== undefined && latestQueryCount !== null && (
                <span
                  className={`rounded px-1 font-mono text-[10px] ${
                    studyEnabled
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-indigo-600 dark:bg-zinc-800 dark:text-indigo-300"
                  }`}
                >
                  {latestQueryCount} SQL
                </span>
              )}
            </button>

            {/* Light / Dark Theme Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Toggle color theme"
              title="Toggle Light / Dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Active Screen */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-5 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Collapsible Study Mode Engineering Inspector */}
      <StudyInspectorDrawer screenKey={activeScreen} />
    </div>
  );
}
