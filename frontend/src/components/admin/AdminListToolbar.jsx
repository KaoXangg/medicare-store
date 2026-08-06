import { Search } from 'lucide-react';


export default function AdminListToolbar({
  search,
  onSearchChange,
  placeholder = 'Tìm kiếm...',
  filters,
  actions,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder={placeholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-sky-500"
          />
        </div>
        {actions && <div className="flex shrink-0 flex-col gap-2 sm:flex-row">{actions}</div>}
      </div>
      {filters && (
        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {filters}
        </div>
      )}
    </div>
  );
}

export function AdminFilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-[0.98] sm:px-4 ${
        active
          ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  );
}

/** Thẻ mobile chuẩn */
export function AdminMobileCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 ${className}`}
    >
      {children}
    </div>
  );
}

/** Hàng nút thao tác full-width trên mobile */
export function AdminMobileActions({ children }) {
  return <div className="mt-3 flex flex-wrap gap-2">{children}</div>;
}

export function AdminMobileActionButton({ variant = 'primary', className = '', children, ...props }) {
  const variants = {
    primary:
      'flex-1 min-w-[calc(50%-0.25rem)] inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2.5 text-xs font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    secondary:
      'flex-1 min-w-[calc(50%-0.25rem)] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900',
    danger: 'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10',
    warning:
      'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10',
    success:
      'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10',
  };
  return (
    <button type="button" className={`${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
