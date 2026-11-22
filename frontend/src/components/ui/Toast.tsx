/**
 * Lifecycle Stage: UI Feedback -> Spring-Animated Global Toast Notification Bus
 * Production Invariant (🔴): Non-blocking toast queue animates via GPU transforms and auto-dismisses cleanly.
 * Trap Prevented (⚠️): Silent mutation failures or disruptive window.alert() popups.
 */
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";
import { SPRING_TACTILE } from "./MotionPrimitives";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastContextValue {
  notify: (kind: ToastKind, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, kind, title, description }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={SPRING_TACTILE}
              className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-zinc-200/90 bg-white/95 p-3.5 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.14)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95"
            >
              {toast.kind === "success" && (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
              )}
              {toast.kind === "error" && (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" strokeWidth={1.75} />
              )}
              {toast.kind === "info" && (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-300" strokeWidth={1.75} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastContextValue {
  const ctx = use(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
