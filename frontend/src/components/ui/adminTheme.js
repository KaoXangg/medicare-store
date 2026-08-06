/** Design tokens thống nhất cho toàn bộ khu vực Admin */
export const adminTheme = {
  page: 'admin-page space-y-6 lg:space-y-8',
  pageTitle:
    'text-2xl font-black tracking-tight text-slate-800 dark:text-white md:text-3xl',
  pageSubtitle: 'mt-1 text-sm text-slate-500 dark:text-slate-400 md:text-base',
  glassCard:
    'admin-card relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111827]/70 dark:shadow-2xl dark:shadow-black/40 hover:border-slate-300/80 dark:hover:border-white/[0.15] hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-300',
  panelCard:
    'admin-card relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111827]/70 dark:shadow-2xl dark:shadow-black/40 hover:border-slate-300/80 dark:hover:border-white/[0.15] hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-300',
  searchInput:
    'w-full rounded-2xl border border-slate-200/80 bg-white/80 py-3 pl-11 pr-4 text-slate-800 outline-none backdrop-blur-md transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-slate-950/40 dark:text-slate-200',
  select:
    'rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-slate-800 outline-none backdrop-blur-md transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-slate-950/40 dark:text-slate-200',
  tableWrap: 'overflow-x-auto -mx-1 px-1',
  table: 'w-full min-w-[640px]',
  tableHead:
    'border-b border-slate-200/80 bg-slate-50/50 backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-950/40',
  tableHeadCell:
    'px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 lg:px-6',
  tableRow:
    'border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-white/[0.04] dark:hover:bg-white/[0.02]',
  tableCell: 'px-5 py-4 align-middle text-slate-700 dark:text-slate-300 lg:px-6 lg:py-5',
  actionBtn:
    'inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:scale-105 disabled:opacity-40',
  badge: 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
  chip:
    'inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/50 px-4 py-2 text-sm font-bold text-slate-700 dark:border-white/[0.08] dark:bg-gradient-to-r dark:from-white/5 dark:to-white/[0.02] dark:text-slate-200 shadow-sm',
  emptyState:
    'admin-card rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-white/10 dark:bg-slate-950/20',
  sectionTitle: 'text-lg font-black text-slate-800 dark:text-white lg:text-xl',
  sectionSubtitle: 'text-sm text-slate-500 dark:text-slate-400',
};

/** Màu icon thống nhất — icon nền gradient đặc, chữ trắng */
export const adminAccent = {
  emerald: {
    icon: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
    glow: 'bg-emerald-400/20',
    bar: 'from-emerald-400 to-teal-500',
    label: 'text-emerald-600 dark:text-emerald-400',
  },
  sky: {
    icon: 'from-sky-500 to-blue-600 shadow-sky-500/30',
    glow: 'bg-sky-400/20',
    bar: 'from-sky-400 to-blue-500',
    label: 'text-sky-600 dark:text-sky-400',
  },
  amber: {
    icon: 'from-amber-500 to-orange-500 shadow-amber-500/30',
    glow: 'bg-amber-400/20',
    bar: 'from-amber-400 to-orange-500',
    label: 'text-amber-600 dark:text-amber-400',
  },
  violet: {
    icon: 'from-violet-500 to-purple-600 shadow-violet-500/30',
    glow: 'bg-violet-400/20',
    bar: 'from-violet-400 to-purple-500',
    label: 'text-violet-600 dark:text-violet-400',
  },
  orange: {
    icon: 'from-orange-500 to-amber-600 shadow-orange-500/30',
    glow: 'bg-orange-400/20',
    bar: 'from-orange-400 to-amber-500',
    label: 'text-orange-600 dark:text-orange-400',
  },
  cyan: {
    icon: 'from-cyan-500 to-primary-600 shadow-cyan-500/30',
    glow: 'bg-cyan-400/20',
    bar: 'from-cyan-400 to-primary-500',
    label: 'text-cyan-600 dark:text-cyan-400',
  },
};

/** @deprecated — dùng adminAccent */
export const adminIconColors = {
  blue: 'from-sky-400/20 to-sky-600/20 text-sky-600 dark:text-sky-400',
  green: 'from-emerald-400/20 to-emerald-600/20 text-emerald-600 dark:text-emerald-400',
  red: 'from-rose-400/20 to-rose-600/20 text-rose-600 dark:text-rose-400',
  purple: 'from-violet-400/20 to-violet-600/20 text-violet-600 dark:text-violet-400',
  orange: 'from-orange-400/20 to-orange-600/20 text-orange-600 dark:text-orange-400',
  yellow: 'from-amber-400/20 to-amber-600/20 text-amber-600 dark:text-amber-400',
};

export const adminStatusStyles = {
  active: 'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  inactive: 'bg-slate-200/90 text-slate-600 dark:bg-white/10 dark:text-slate-400',
  locked: 'bg-rose-100/90 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  pending: 'bg-amber-100/90 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  confirmed: 'bg-sky-100/90 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  shipping: 'bg-violet-100/90 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  completed: 'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  cancelled: 'bg-rose-100/90 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};
