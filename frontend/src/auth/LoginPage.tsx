/**
 * Lifecycle Stage: Authentication Entry -> Asymmetric Split-Screen Sign-In with React 19 useActionState
 * Production Invariant (🔴): Uses min-h-[100dvh], layoutId persona switcher, MagneticButton CTA, and useActionState.
 * Trap Prevented (⚠️): Centered hero clichés, purple gradients, or duplicate form submission races.
 */
import { motion } from "framer-motion";
import { ArrowRight, Check, Lock, Moon, ShieldCheck, Sun, Terminal } from "lucide-react";
import { useActionState, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { extractApiError } from "../api/client";
import {
  LivePulseDot,
  MagneticButton,
  SPRING_TACTILE,
} from "../components/ui/MotionPrimitives";
import { useAuth } from "./AuthContext";

interface LoginActionState {
  error: string | null;
}

const DEMO_ACCOUNTS = [
  {
    label: "Admin",
    roleNote: "Full RBAC + Approvals",
    username: "admin",
    password: "AdminPassword123!",
    badge: "superuser",
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
    roleNote: "Author-Only (IDOR Demo)",
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
    <div className="grid min-h-[100dvh] grid-cols-1 bg-zinc-50 dark:bg-zinc-950 lg:grid-cols-12">
      {/* Left Architectural Identity Panel */}
      <div className="ops-dot-grid relative hidden flex-col justify-between border-r border-zinc-800 bg-zinc-950 p-10 text-zinc-100 lg:col-span-5 lg:flex">
        <div className="space-y-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-zinc-50">OpsDesk</p>
                <p className="font-mono text-[10px] text-zinc-500">django-refreshment</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 font-mono text-[10px] text-zinc-300">
              <LivePulseDot tone="emerald" />
              PG17 Ready
            </span>
          </div>

          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-emerald-400">
              <Terminal className="h-3.5 w-3.5" strokeWidth={1.75} />
              IT Operations & Approval Plane
            </span>
            <h1 className="text-3xl font-semibold tracking-tighter text-zinc-50 xl:text-4xl xl:leading-[1.1]">
              Deterministic change governance built for zero query waste.
            </h1>
            <p className="max-w-[46ch] text-sm leading-relaxed text-zinc-400">
              Inspect live SQL query telemetry, PostgreSQL row-locked state transitions, and
              single-flight JWT rotation directly from the workspace.
            </p>
          </div>

          <ul className="divide-y divide-zinc-800/80 border-y border-zinc-800/80 text-xs text-zinc-300">
            {[
              "Single-flight JWT rotation & server-side refresh blacklisting",
              "Row-locked select_for_update(of=('self',)) atomic transitions",
              "Constant O(1) SQL queries verified by assertNumQueries CI gates",
              "Built-in Study Mode Engineering Inspector for architecture recall",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 py-3">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
          <span>Django 6.1 • React 19 • PostgreSQL 17</span>
          <span>OpenAPI 3</span>
        </div>
      </div>

      {/* Right Workspace Sign-In Surface */}
      <div className="relative flex items-center justify-center px-4 py-10 sm:px-10 lg:col-span-7">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          title="Toggle Light / Dark mode"
          className="absolute top-5 right-5 rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {darkMode ? (
            <Sun className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>

        <div className="w-full max-w-md space-y-7">
          <div className="space-y-1.5">
            <div className="mb-3 flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-emerald-400 dark:bg-emerald-500/15">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold tracking-tight">OpsDesk</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Sign in to workspace
            </h2>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Authenticate with enterprise credentials or select a seeded role below.
            </p>
          </div>

          {/* Segmented Tactile Dev Role Selector */}
          <div className="space-y-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Demo Role Preset
            </p>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-zinc-200/90 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/90">
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
                    className="relative rounded-lg px-2.5 py-2 text-left transition active:scale-[0.98]"
                  >
                    {active && (
                      <motion.span
                        layoutId="demo-persona-active"
                        transition={SPRING_TACTILE}
                        className="absolute inset-0 rounded-lg border border-zinc-200/90 bg-white shadow-2xs dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    )}
                    <div className="relative z-10">
                      <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100">
                        {acct.label}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                        {acct.badge}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                        {acct.roleNote}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            action={formAction}
            className="space-y-4 rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            {formState.error && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              >
                {formState.error}
              </div>
            )}

            <div className="grid gap-1.5">
              <label
                htmlFor="username"
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
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
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Seeded personas: <code className="font-mono">admin</code>,{" "}
                <code className="font-mono">manager</code>, or{" "}
                <code className="font-mono">requester</code>.
              </p>
            </div>

            <div className="grid gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
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
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-9 text-sm text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <Lock
                  className="pointer-events-none absolute top-2.5 right-3 h-4 w-4 text-zinc-400"
                  strokeWidth={1.75}
                />
              </div>
            </div>

            <MagneticButton
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <span>{isPending ? "Verifying session…" : "Sign in to control plane"}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </MagneticButton>
          </form>
        </div>
      </div>
    </div>
  );
}
