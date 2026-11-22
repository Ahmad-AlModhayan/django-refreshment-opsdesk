import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
