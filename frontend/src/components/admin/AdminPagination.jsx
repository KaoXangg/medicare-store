import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminPagination({
  page,
  totalPages = 1,
  total,
  onPageChange,
  className = '',
  alwaysShow = true,
}) {
  const pages = Math.max(1, totalPages || 1);
  if (!alwaysShow && pages <= 1) return null;

  const getPageNumbers = () => {
    const nums = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i += 1) {
      nums.push(i);
    }
    return nums;
  };

  return (
    <div className={`flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 ${className}`}>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Trang {page} / {pages}
        {total != null && (
          <span className="hidden sm:inline text-slate-400"> · {total} mục</span>
        )}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-9 w-9 rounded-xl text-sm font-bold transition-all ${
              page === p
                ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
