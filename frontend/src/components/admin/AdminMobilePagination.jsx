import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminMobilePagination({
  page,
  totalPages = 1,
  onPageChange,
  className = '',
}) {
  const pages = Math.max(1, totalPages || 1);
  if (pages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 md:hidden ${className}`}
    >
      <span className="font-medium text-slate-500 dark:text-slate-400">
        Trang {page}/{pages}
      </span>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white transition active:scale-95 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
          aria-label="Trang trước"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white transition active:scale-95 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
          aria-label="Trang sau"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
