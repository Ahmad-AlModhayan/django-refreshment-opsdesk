export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-zinc-800/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-200 dark:divide-zinc-800">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 items-center gap-3 px-4 py-3">
          <SkeletonBlock className="col-span-2 h-4" />
          <SkeletonBlock className="col-span-4 h-4" />
          <SkeletonBlock className="col-span-2 h-5 rounded-full" />
          <SkeletonBlock className="col-span-1 h-5" />
          <SkeletonBlock className="col-span-2 h-4" />
          <SkeletonBlock className="col-span-1 h-4" />
        </div>
      ))}
    </div>
  );
}
