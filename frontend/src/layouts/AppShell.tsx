/**
 * Lifecycle Stage: Application Chrome -> Responsive Collapsible Sidebar, Liquid-Glass Top Bar & Study Mode Host
 * Production Invariant (🔴): Uses min-h-[100dvh], mobile slide-over collapse (<768px), and shared layoutId nav indicator.
 * Trap Prevented (⚠️): Fixed desktop sidebars overflowing mobile viewports or purple/gray palette drift.
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ExternalLink,
  FolderKanban,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Sun,
  Ticket,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTelemetryEvents } from "../api/telemetryStore";
import { useAuth } from "../auth/AuthContext";
import {
  LivePulseDot,
  MonogramAvatar,
  SPRING_DRAWER,
  SPRING_TACTILE,
} from "../components/ui/MotionPrimitives";
import { StudyInspectorDrawer } from "../features/study/StudyInspectorDrawer";
import { type StudyScreenKey, useStudyMode } from "../features/study/StudyModeContext";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const activeScreen = resolveStudyScreen(location.pathname);
  const latestQueryCount = telemetry[0]?.queryCount;

  const handleGlobalSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim();
    navigate(q ? `/tickets?search=${encodeURIComponent(q)}` : "/tickets");
  };

  const renderNavLinks = (isCollapsed: boolean, layoutScope: string) => (
    <nav className="flex-1 space-y-1 p-2.5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId={`nav-active-${layoutScope}`}
                    transition={SPRING_TACTILE}
                    className="absolute inset-0 rounded-lg border border-zinc-200/90 bg-zinc-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  />
                )}
                <Icon
                  className={`relative z-10 h-4 w-4 shrink-0 ${
                    isActive ? "text-emerald-600 dark:text-emerald-400" : ""
                  }`}
                  strokeWidth={1.75}
                />
                {!isCollapsed && <span className="relative z-10">{item.label}</span>}
              </>
            )}
          </NavLink>
        );
      })}

      <div className="my-3 border-t border-zinc-200/70 dark:border-zinc-800/80" />

      <a
        href="/api/docs/"
        target="_blank"
        rel="noreferrer"
        title={isCollapsed ? "OpenAPI Swagger Docs" : undefined}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
      >
        <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        {!isCollapsed && <span>OpenAPI Docs</span>}
      </a>
    </nav>
  );

  return (
    <div className="flex min-h-[100dvh] bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-zinc-200/80 bg-white transition-[width] duration-200 ease-out dark:border-zinc-800/90 dark:bg-zinc-950 md:flex ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-200/80 px-3.5 dark:border-zinc-800/90">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-1 dark:ring-emerald-500/30">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  OpsDesk
                </p>
                <p className="font-mono text-[10px] text-zinc-400">control-plane</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 active:scale-[0.96] dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {renderNavLinks(collapsed, "desktop")}

        {/* Identity Footer */}
        <div className="border-t border-zinc-200/80 p-2.5 dark:border-zinc-800/90">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200/70 bg-zinc-50/80 p-2 dark:border-zinc-800/80 dark:bg-zinc-900/70">
            <div className="flex min-w-0 items-center gap-2">
              <MonogramAvatar name={user?.full_name ?? user?.username ?? "U"} size="sm" />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {user?.full_name}
                  </p>
                  <p className="truncate font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                    @{user?.username}
                  </p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-md p-1.5 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-[0.96] dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              title="Sign out (blacklists refresh token)"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Navigation (<768px) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-zinc-950/50 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={SPRING_DRAWER}
              onClick={(e) => e.stopPropagation()}
              className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-emerald-400 dark:bg-emerald-500/15">
                    <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <span className="text-sm font-semibold tracking-tight">OpsDesk</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Close navigation menu"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
              {renderNavLinks(false, "mobile")}
              <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Sign out (@{user?.username})
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div
        className={`flex min-h-[100dvh] w-full flex-1 flex-col transition-[padding] duration-200 ease-out ${
          collapsed ? "md:pl-16" : "md:pl-60"
        } ${studyEnabled ? "xl:pr-[440px]" : ""}`}
      >
        {/* Liquid-Glass Top Utility Bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/80 px-4 shadow-[inset_0_-1px_0_rgba(255,255,255,0.4)] backdrop-blur-md sm:px-6 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.03)]">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-600 md:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" strokeWidth={1.75} />
            </button>

            <form onSubmit={handleGlobalSearch} className="relative w-full max-w-sm">
              <Search
                className="pointer-events-none absolute top-2 left-2.5 h-3.5 w-3.5 text-zinc-400"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Jump to reference or keyword (e.g. INFRA-1001, KMS)…"
                className="w-full rounded-lg border border-zinc-200/90 bg-zinc-50/80 py-1.5 pr-3 pl-8 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600/60 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100 dark:focus:border-emerald-500/60"
              />
            </form>
          </div>

          <div className="flex items-center gap-2">
            {/* Calibrated Role Telemetry Pill */}
            <span className="hidden items-center gap-2 rounded-full border border-zinc-200/90 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] font-medium text-zinc-700 sm:inline-flex dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <LivePulseDot
                tone={user?.is_superuser ? "emerald" : user?.is_staff ? "emerald" : "amber"}
              />
              {user?.role}
            </span>

            {/* Study Mode Toggle */}
            <button
              type="button"
              onClick={toggleStudy}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
                studyEnabled
                  ? "border-emerald-700 bg-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] dark:border-emerald-500/60 dark:bg-emerald-600"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Study Mode</span>
              {latestQueryCount !== undefined && latestQueryCount !== null && (
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                    studyEnabled
                      ? "bg-black/20 text-white"
                      : "bg-zinc-100 text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400"
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
              className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Toggle color theme"
              title="Toggle Light / Dark mode"
            >
              {darkMode ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </header>

        {/* Active Screen */}
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Collapsible Study Mode Engineering Inspector */}
      <StudyInspectorDrawer screenKey={activeScreen} />
    </div>
  );
}
