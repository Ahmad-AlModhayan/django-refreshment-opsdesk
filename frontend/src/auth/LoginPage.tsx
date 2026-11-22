/**
 * Lifecycle Stage: Authentication Entry -> Enterprise Sign-In with React 19 useActionState
 * Production Invariant (🔴): Manages form submission state natively via useActionState with zero manual loading/error races.
 * Trap Prevented (⚠️): Duplicate login submits or unvalidated state toggles causing stale auth banners.
 */
import { ArrowRight, CheckCircle2, Lock, Moon, ShieldCheck, Sun, Terminal } from "lucide-react";
import { useActionState, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { extractApiError } from "../api/client";
import { useAuth } from "./AuthContext";

interface LoginActionState {
  error: string | null;
}

const DEMO_ACCOUNTS = [
  {
    label: "Admin",
    roleNote: "Full RBAC + Staff Approvals",
    username: "admin",
    password: "AdminPassword123!",
    badge: "is_superuser",
  },
  {
    label: "Manager",
    roleNote: "Staff Triage & Transitions",
    username: "manager",
    password: "ManagerPassword123!",
    badge: "is_staff",
  },
  {
    label: "Requester",
    roleNote: "Author-Only Edit (IDOR Demo)",
    username: "requester",
    password: "RequesterPassword123!",
    badge: "standard",
  },
] as const;

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from ?? "/";

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("AdminPassword123!");
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("opsdesk_theme", next ? "dark" : "light");
  };

  const [formState, formAction, isPending] = useActionState<LoginActionState, FormData>(
    async (_prevState, formData) => {
      const userVal = String(formData.get("username") ?? "").trim();
      const passVal = String(formData.get("password") ?? "");
      if (!userVal || !passVal) {
        return { error: "Enter both username and password." };
      }
      try {
        await login({ username: userVal, password: passVal });
        navigate(fromPath, { replace: true });
        return { error: null };
      } catch (err) {
        return { error: extractApiError(err, "Invalid credentials. Check username and password.") };
      }
    },
    { error: null },
  );

  if (isAuthenticated) {
    return <Navigate to={fromPath} replace />;
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 dark:bg-zinc-950 lg:grid-cols-12">
      {/* Left enterprise identity panel */}
      <div className="hidden flex-col justify-between border-r border-slate-200 bg-slate-900 p-10 text-slate-100 dark:border-zinc-800 dark:bg-zinc-900/60 lg:col-span-5 lg:flex">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">OpsDesk</p>
              <p className="font-mono text-[11px] text-slate-400">django-refreshment v1.0</p>
            </div>
          </div>

          <div className="mt-14 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 font-mono text-[11px] text-indigo-300">
              <Terminal className="h-3 w-3" />
              Enterprise IT Operations & Approval Control Plane
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Production-grade change governance with zero query waste.
            </h1>
            <p className="text-sm leading-relaxed text-slate-400">
              Built on latest stable Django + DRF + React 19 + TanStack Query. Inspect live SQL
              query counts, state-machine locks, and single-flight JWT refresh directly inside
              Study Mode.
            </p>
          </div>

          <div className="mt-10 space-y-3 border-t border-slate-800 pt-8 text-xs text-slate-300">
            {[
              "Single-flight JWT rotation & server-side refresh blacklisting",
              "Row-locked select_for_update() transitions with atomic audit trails",
              "O(1) SQL queries verified by automated assertNumQueries tests",
              "Built-in Study Mode Inspector for accelerated architecture recall",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="font-mono text-[11px] text-slate-500">
          PostgreSQL 17 • Gunicorn • Nginx Reverse Proxy • OpenAPI 3
        </p>
      </div>

      {/* Right login form */}
      <div className="relative flex items-center justify-center p-6 sm:p-10 lg:col-span-7">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          title="Toggle Light / Dark mode"
          className="absolute top-5 right-5 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">OpsDesk</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
              Sign in to OpsDesk
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Authenticate with your enterprise credentials or pick a seeded demo persona below.
            </p>
          </div>

          {/* Demo persona quick-selector */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              One-Click Dev Role Selector
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acct) => {
                const active = username === acct.username;
                return (
                  <button
                    key={acct.username}
                    type="button"
                    onClick={() => {
                      setUsername(acct.username);
                      setPassword(acct.password);
                    }}
                    className={`rounded-lg border px-2.5 py-2 text-left transition ${
                      active
                        ? "border-indigo-500 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-500/10"
                        : "border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                      {acct.label}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                      {acct.badge}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-500 dark:text-zinc-400">
                      {acct.roleNote}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            action={formAction}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
          >
            {formState.error && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              >
                {formState.error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-xs font-medium text-slate-700 dark:text-zinc-300"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700 dark:text-zinc-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <Lock className="pointer-events-none absolute top-2.5 right-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Signing in…" : "Sign in to workspace"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
