/**
 * Lifecycle Stage: Loading State System -> Directional Shimmer & Layout-Matched Skeletons
 * Production Invariant (🔴): Matches target table/shell geometry using GPU transform shimmer rather than spinners.
 * Trap Prevented (⚠️): Cumulative layout shift (CLS) and jarring loading flashes when server data resolves.
 */

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`ops-shimmer relative overflow-hidden rounded-md bg-zinc-200/75 dark:bg-zinc-800/75 ${className}`}
      aria-hidden="true"
    />
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 items-center gap-3 px-4 py-3.5">
          <SkeletonBlock className="col-span-2 h-3.5" />
          <SkeletonBlock className="col-span-4 h-3.5" />
          <SkeletonBlock className="col-span-2 h-5 rounded-full" />
          <SkeletonBlock className="col-span-1 h-4" />
          <SkeletonBlock className="col-span-2 h-3.5" />
          <SkeletonBlock className="col-span-1 h-3.5" />
        </div>
      ))}
    </div>
  );
}

export function ShellHydrationSkeleton() {
  return (
    <div className="flex min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">
      <div className="hidden w-60 flex-col border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:flex">
        <SkeletonBlock className="h-8 w-32" />
        <div className="mt-8 space-y-2.5">
          <SkeletonBlock className="h-8 w-full" />
          <SkeletonBlock className="h-8 w-full" />
          <SkeletonBlock className="h-8 w-4/5" />
          <SkeletonBlock className="h-8 w-3/4" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-6 dark:border-zinc-800">
          <SkeletonBlock className="h-8 w-64" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-8 w-24" />
            <SkeletonBlock className="h-8 w-8" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <SkeletonBlock className="h-7 w-48" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <SkeletonBlock className="h-28 md:col-span-4" />
            <SkeletonBlock className="h-28 md:col-span-8" />
          </div>
          <SkeletonBlock className="h-80 w-full" />
        </div>
      </div>
    </div>
  );
}
