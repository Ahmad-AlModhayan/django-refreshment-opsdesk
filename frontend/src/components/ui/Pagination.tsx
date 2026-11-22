import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  isFetching?: boolean;
  onPageChange: (nextPage: number) => void;
}

export function Pagination({
  page,
  pageSize,
  totalCount,
  hasPrevious,
  hasNext,
  isFetching,
  onPageChange,
}: PaginationProps) {
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      <div className="flex items-center gap-2 font-mono">
        <span>
          {start}–{end} of {totalCount}
        </span>
        {isFetching && (
          <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            syncing
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="mr-2 font-mono text-[11px]">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          Prev
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
