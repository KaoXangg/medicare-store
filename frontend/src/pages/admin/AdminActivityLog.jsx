import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Search, ShoppingCart, Eye, LogIn, LogOut,
  PackageCheck, Clock, Users, Users2, TrendingUp, XCircle, ChevronLeft, ChevronRight,
  Flame, Sparkles, CalendarDays, LayoutList, ChevronDown,
} from 'lucide-react';
import api from '../../services/api';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { adminTheme } from '../../components/ui/adminTheme';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const ACTION_META = {
  page_view: { label: 'Xem trang', icon: Eye, color: 'sky' },
  search: { label: 'Tìm kiếm', icon: Search, color: 'violet' },
  product_view: { label: 'Xem sản phẩm', icon: Eye, color: 'cyan' },
  add_to_cart: { label: 'Thêm giỏ hàng', icon: ShoppingCart, color: 'amber' },
  buy_now: { label: 'Mua ngay', icon: ShoppingCart, color: 'orange' },
  order_placed: { label: 'Đặt hàng', icon: PackageCheck, color: 'emerald' },
  login: { label: 'Đăng nhập', icon: LogIn, color: 'purple' },
  logout: { label: 'Đăng xuất', icon: LogOut, color: 'rose' },
};

const COLOR_CLASS = {
  sky: { bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500/20', dot: 'bg-sky-500' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500/20', dot: 'bg-violet-500' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', ring: 'ring-cyan-500/20', dot: 'bg-cyan-500' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20', dot: 'bg-amber-500' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-500/20', dot: 'bg-orange-500' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20', dot: 'bg-emerald-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500/20', dot: 'bg-purple-500' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500/20', dot: 'bg-rose-500' },
};

const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-fuchsia-500 to-purple-600',
];

// Format ngày theo LOCAL time (không dùng toISOString vì hàm đó trả về theo UTC,
// gây lệch 1 ngày ở múi giờ Việt Nam +7 — đây chính là nguyên nhân bug không lướt được tới hôm nay).
function formatLocalDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function todayStr() {
  return formatLocalDate(new Date());
}

function shiftDateStr(str, delta) {
  const d = new Date(`${str}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return formatLocalDate(d);
}

function dateHeading(str) {
  const today = todayStr();
  const yest = shiftDateStr(today, -1);
  if (str === today) return 'Hôm nay';
  if (str === yest) return 'Hôm qua';
  const d = new Date(`${str}T00:00:00`);
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatExactTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatHM(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  const diffSec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 45) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  return `${Math.floor(diffSec / 86400)} ngày trước`;
}

function describeDetail(log) {
  const d = log.ActionDetail;
  switch (log.ActionType) {
    case 'search': return d?.keyword ? `"${d.keyword}"${d.resultCount != null ? ` · ${d.resultCount} kết quả` : ''}` : '';
    case 'product_view':
    case 'add_to_cart':
    case 'buy_now': return d?.productName || '';
    case 'order_placed': return d?.orderId ? `Đơn #${d.orderId}${d?.total ? ` · ${Number(d.total).toLocaleString('vi-VN')}đ` : ''}` : '';
    case 'page_view': return d?.title || log.PageUrl || '';
    case 'click': return d?.label || d?.target || '';
    default: return '';
  }
}

function ActorAvatar({ name, userId, avatarUrl, size = 32 }) {
  const [imgError, setImgError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const seed = userId ?? (name ? name.charCodeAt(0) : 0);
  const grad = AVATAR_GRADIENTS[seed % AVATAR_GRADIENTS.length];

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'avatar'}
        onError={() => setImgError(true)}
        className="shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/5"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} font-bold text-white shadow-sm`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

function ActivityRow({ log, dark, delay = 0 }) {
  const meta = ACTION_META[log.ActionType] || { label: log.ActionType, icon: Activity, color: 'sky' };
  const Icon = meta.icon;
  const t = COLOR_CLASS[meta.color];
  const isFresh = (Date.now() - new Date(log.CreatedAt).getTime()) / 1000 < 300;
  const detail = describeDetail(log);
  const RowWrap = log.UserId ? Link : 'div';
  const rowProps = log.UserId ? { to: `/admin/users/${log.UserId}` } : {};

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay, duration: 0.25 }}
      className={`group relative flex gap-3 rounded-2xl px-2.5 py-3 transition-all duration-200 ${dark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}
    >
      <div className="relative z-[1] flex shrink-0 flex-col items-center">
        <span className={`flex h-[42px] w-[42px] items-center justify-center rounded-2xl ${t.bg} ${t.text} ring-4 transition-transform duration-200 group-hover:scale-[1.04] ${dark ? 'ring-slate-900' : 'ring-white'}`}>
          <Icon size={17} />
        </span>
        {isFresh && (
          <span className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full ${t.dot} ring-2 ${dark ? 'ring-slate-900' : 'ring-white'}`}>
            <span className={`absolute inset-0 animate-ping rounded-full ${t.dot} opacity-60`} />
          </span>
        )}
      </div>

      <RowWrap {...rowProps} className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <ActorAvatar name={log.FullName} userId={log.UserId} avatarUrl={log.Avatar} size={20} />
              <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                {log.FullName || 'Ẩn danh'}
              </span>
              <span className="truncate text-xs text-slate-400">{log.Email}</span>
            </div>
            <div className={`mt-0.5 flex flex-wrap items-center gap-x-2 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className={`font-semibold ${t.text}`}>{meta.label}</span>
              {detail && (
                <>
                  <span className={dark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                  <span className="truncate">{detail}</span>
                </>
              )}
              {log.Duration != null && (
                <>
                  <span className={dark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                  <span className="inline-flex items-center gap-1"><Clock size={11} />{log.Duration}s</span>
                </>
              )}
            </div>
          </div>
          <span title={formatExactTime(log.CreatedAt)} className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-slate-400">
            {timeAgo(log.CreatedAt)}
          </span>
        </div>
      </RowWrap>
    </motion.div>
  );
}

function MiniCalendar({ selectedDate, onSelect, onClose, dark, style, innerRef }) {
  const [viewDate, setViewDate] = useState(() => new Date(`${selectedDate}T00:00:00`));
  const today = todayStr();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayStr = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = viewDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <motion.div
      ref={innerRef}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'fixed', zIndex: 200, ...style }}
      className={`w-72 rounded-2xl border p-3 shadow-2xl ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${dark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <ChevronLeft size={14} />
        </button>
        <span className={`text-sm font-bold capitalize ${dark ? 'text-white' : 'text-slate-800'}`}>{monthLabel}</span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${dark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((w) => (
          <span key={w} className={`text-center text-[10px] font-bold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const ds = dayStr(d);
          const isFuture = ds > today;
          const isSelected = ds === selectedDate;
          const isToday = ds === today;
          return (
            <button
              key={i}
              type="button"
              disabled={isFuture}
              onClick={() => { onSelect(ds); onClose(); }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                isSelected
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : isFuture
                    ? dark ? 'cursor-not-allowed text-slate-700' : 'cursor-not-allowed text-slate-300'
                    : isToday
                      ? dark ? 'text-sky-400 ring-1 ring-sky-500/50' : 'text-sky-600 ring-1 ring-sky-400'
                      : dark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => { onSelect(today); onClose(); }}
        className={`mt-3 w-full rounded-xl py-2 text-xs font-bold transition ${dark ? 'bg-slate-800 text-sky-400 hover:bg-slate-700' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}
      >
        Hôm nay
      </button>
    </motion.div>
  );
}

function UserActivityGroup({ userId, items, dark, expanded, onToggle }) {
  const first = items[0];
  const lastAction = items[0];
  const actionCounts = useMemo(() => {
    const map = {};
    items.forEach((l) => { map[l.ActionType] = (map[l.ActionType] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [items]);

  return (
    <div className={`overflow-hidden rounded-2xl border transition-shadow duration-200 hover:shadow-md ${dark ? 'border-slate-800 hover:shadow-black/20' : 'border-slate-100'}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${dark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}
      >
        <span className={`rounded-full ring-2 ${dark ? 'ring-slate-800' : 'ring-white'} shadow-sm`}>
          <ActorAvatar name={first.FullName} userId={userId} avatarUrl={first.Avatar} size={38} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            {userId ? (
              <Link
                to={`/admin/users/${userId}`}
                onClick={(e) => e.stopPropagation()}
                className={`text-sm font-bold hover:underline ${dark ? 'text-white' : 'text-slate-900'}`}
              >
                {first.FullName || 'Ẩn danh'}
              </Link>
            ) : (
              <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{first.FullName || 'Ẩn danh'}</span>
            )}
            <span className="truncate text-xs text-slate-400">{first.Email}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {actionCounts.slice(0, 4).map(([type, count]) => {
              const meta = ACTION_META[type] || { label: type, color: 'sky' };
              const t = COLOR_CLASS[meta.color];
              return (
                <span key={type} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.bg} ${t.text}`}>
                  {meta.label} × {count}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className={`text-lg font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{items.length}</p>
            <p className="text-[10px] font-semibold text-slate-400">hành động</p>
          </div>
          <span title={formatExactTime(lastAction.CreatedAt)} className="hidden text-[11px] font-semibold text-slate-400 sm:block">
            {timeAgo(lastAction.CreatedAt)}
          </span>
          <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className={`space-y-0.5 border-t px-3 pb-2 pt-1 ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
              {items.map((log) => {
                const meta = ACTION_META[log.ActionType] || { label: log.ActionType, icon: Activity, color: 'sky' };
                const Icon = meta.icon;
                const t = COLOR_CLASS[meta.color];
                const detail = describeDetail(log);
                return (
                  <div key={log.LogId} className="flex items-center gap-2.5 py-1.5 pl-[46px] text-xs">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${t.bg} ${t.text}`}>
                      <Icon size={12} />
                    </span>
                    <span className={`font-semibold ${t.text}`}>{meta.label}</span>
                    {detail && <span className="truncate text-slate-400">· {detail}</span>}
                    <span className="ml-auto shrink-0 font-semibold text-slate-400">{formatHM(log.CreatedAt)}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RankPanel({ icon: Icon, title, tone, dark, items, renderLabel }) {
  const t = COLOR_CLASS[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`${adminTheme.glassCard} p-4`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${t.bg} ${t.text}`}>
          <Icon size={15} />
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {items?.length ? items.slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className={`truncate font-semibold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{renderLabel(item)}</span>
            <span className={`shrink-0 font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{item.cnt}</span>
          </div>
        )) : (
          <p className="text-xs text-slate-400">Chưa có dữ liệu</p>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminActivityLog() {
  const { dark } = useTheme();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionType, setActionType] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [view, setView] = useState('timeline');
  const [expandedUsers, setExpandedUsers] = useState(() => new Set());
  const [byUserGroups, setByUserGroups] = useState([]);
  const [byUserLoading, setByUserLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarPos, setCalendarPos] = useState(null);
  const calendarRef = useRef(null);
  const calendarPopoverRef = useRef(null);

  const openCalendar = () => {
    const rect = calendarRef.current?.getBoundingClientRect();
    if (rect) setCalendarPos({ top: rect.bottom + 8, left: rect.left });
    setShowCalendar(true);
  };

  useEffect(() => {
    if (!showCalendar) return;
    const onClickOutside = (e) => {
      const insideTrigger = calendarRef.current && calendarRef.current.contains(e.target);
      const insidePopover = calendarPopoverRef.current && calendarPopoverRef.current.contains(e.target);
      if (!insideTrigger && !insidePopover) setShowCalendar(false);
    };
    const onScrollOrResize = () => setShowCalendar(false);
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [showCalendar]);

  const isTodaySelected = selectedDate === todayStr();

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', p);
      params.set('limit', 20);
      params.set('date', selectedDate);
      if (search.trim()) params.set('search', search.trim());
      if (actionType) params.set('actionType', actionType);
      const res = await api.get(`/activity?${params.toString()}`);
      setLogs(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      toast.error(err.message || 'Không tải được nhật ký');
    } finally {
      setLoading(false);
    }
  }, [page, search, actionType, selectedDate]);

  useEffect(() => {
    api.get(`/activity/stats?date=${selectedDate}`).then((r) => setStats(r.data)).catch(() => {});
  }, [selectedDate]);

  useEffect(() => { load(1); setPage(1); setExpandedUsers(new Set()); }, [search, actionType, selectedDate]);
  useEffect(() => { load(page); }, [page]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadByUser = useCallback(async () => {
    setByUserLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('date', selectedDate);
      if (search.trim()) params.set('search', search.trim());
      if (actionType) params.set('actionType', actionType);
      const res = await api.get(`/activity/by-user?${params.toString()}`);
      setByUserGroups(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Không tải được dữ liệu theo khách hàng');
    } finally {
      setByUserLoading(false);
    }
  }, [search, actionType, selectedDate]);

  useEffect(() => {
    if (view === 'byUser') loadByUser();
  }, [view, loadByUser]);

  // Lưu ý: gộp nhóm "Theo khách hàng" giờ lấy từ endpoint /activity/by-user (toàn bộ ngày),
  // không còn gộp client-side từ 20 kết quả của trang timeline nữa (xem loadByUser ở trên).

  const toggleUser = (key) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        hideTitle
        subtitle="Theo dõi hành vi khách hàng đã đăng nhập trên website, chia theo từng ngày."
        actions={
          isTodaySelected && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Trực tiếp
            </span>
          )
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <AdminStatCard
          title="Hoạt động"
          value={stats?.actionsToday ?? 0}
          icon={Activity}
          color="sky"
          index={0}
        />
        <AdminStatCard
          title="Khách hoạt động"
          value={stats?.activeUsers24h ?? 0}
          icon={Users}
          color="emerald"
          index={1}
        />
        <RankPanel
          icon={Flame}
          title="Hành động phổ biến"
          tone="amber"
          dark={dark}
          items={stats?.topActions}
          renderLabel={(a) => ACTION_META[a.ActionType]?.label || a.ActionType}
        />
        <RankPanel
          icon={Sparkles}
          title="Sản phẩm xem nhiều"
          tone="violet"
          dark={dark}
          items={stats?.topProducts}
          renderLabel={(p) => p.productName || '—'}
        />
      </div>

      <div className={`${adminTheme.glassCard} p-4 sm:p-5`}>
        <div className={`pointer-events-none absolute inset-0 rounded-2xl ${dark ? 'bg-gradient-to-r from-sky-500/5 via-transparent to-violet-500/5' : 'bg-gradient-to-r from-sky-50/60 via-transparent to-indigo-50/40'}`} />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex shrink-0 items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={() => setSelectedDate((d) => shiftDateStr(d, -1))}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${dark ? 'border-slate-700 bg-slate-950/70 text-slate-300 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <ChevronLeft size={16} />
            </motion.button>

            <div ref={calendarRef} className="relative">
              <button
                type="button"
                onClick={() => (showCalendar ? setShowCalendar(false) : openCalendar())}
                className={`flex h-10 items-center gap-2 rounded-xl border px-3 transition ${dark ? 'border-slate-700 bg-slate-950/70 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
              >
                <CalendarDays size={15} className="text-sky-500" />
                <span className={`whitespace-nowrap text-xs font-bold ${dark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {dateHeading(selectedDate)}
                </span>
                <ChevronDown size={13} className={`transition-transform ${showCalendar ? 'rotate-180' : ''} ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
              </button>
              {showCalendar && calendarPos && createPortal(
                <AnimatePresence>
                  <MiniCalendar
                    innerRef={calendarPopoverRef}
                    selectedDate={selectedDate}
                    onSelect={setSelectedDate}
                    onClose={() => setShowCalendar(false)}
                    dark={dark}
                    style={{ top: calendarPos.top, left: calendarPos.left }}
                  />
                </AnimatePresence>,
                document.body
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              disabled={isTodaySelected}
              onClick={() => setSelectedDate((d) => shiftDateStr(d, 1))}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition disabled:opacity-40 ${dark ? 'border-slate-700 bg-slate-950/70 text-slate-300 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <ChevronRight size={16} />
            </motion.button>
          </div>

          <div className={`hidden sm:block h-8 w-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />

          <div className="flex flex-1 items-center gap-3">
            <div className={`flex flex-1 items-center gap-3 rounded-xl border px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-sky-400/30 ${dark ? 'border-slate-700 bg-slate-950/70 focus-within:border-sky-500/60' : 'border-slate-200 bg-slate-50 focus-within:border-sky-400'}`}>
              <Search size={16} className={`shrink-0 ${searchInput ? (dark ? 'text-sky-400' : 'text-sky-500') : 'text-slate-400'}`} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên, email, từ khóa..."
                className={`flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal ${dark ? 'text-slate-100 placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'}`}
              />
              {searchInput && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  type="button"
                  onClick={() => setSearchInput('')}
                  className={dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}
                >
                  <XCircle size={15} />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        <div className="relative mt-3 flex items-center gap-2 overflow-x-auto pb-0.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setActionType('')}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              actionType === ''
                ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md shadow-sky-500/25'
                : dark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border border-slate-200'
            }`}
          >
            <TrendingUp size={12} /> Tất cả
          </motion.button>
          {Object.entries(ACTION_META).map(([key, m]) => {
            const Icon = m.icon;
            const active = actionType === key;
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setActionType(active ? '' : key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md shadow-sky-500/25'
                    : dark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border border-slate-200'
                }`}
              >
                <Icon size={12} /> {m.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className={`relative flex gap-1 rounded-2xl p-1 ${dark ? 'bg-slate-900' : 'bg-slate-100/80'}`}>
        {[
          { key: 'timeline', label: 'Dòng thời gian', icon: LayoutList },
          { key: 'byUser', label: 'Theo khách hàng', icon: Users2 },
        ].map((t) => (
          <motion.button
            key={t.key}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setView(t.key)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all ${
              view === t.key
                ? dark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                : dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </motion.button>
        ))}
      </div>

      <div className={adminTheme.glassCard}>
        {view === 'timeline' ? (
          loading ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl p-3">
                  <div className={`h-9 w-9 shrink-0 animate-pulse rounded-full ${dark ? 'bg-white/5' : 'bg-slate-100'}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-3 w-1/3 animate-pulse rounded-full ${dark ? 'bg-white/5' : 'bg-slate-100'}`} />
                    <div className={`h-2.5 w-2/3 animate-pulse rounded-full ${dark ? 'bg-white/5' : 'bg-slate-100'}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <motion.span
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${dark ? 'bg-white/5 text-slate-600' : 'bg-slate-100 text-slate-300'}`}
              >
                <Activity size={26} />
              </motion.span>
              <p className={`font-bold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Không có hoạt động nào trong ngày này</p>
              <p className="text-xs text-slate-400">Thử chọn ngày khác hoặc bỏ bớt bộ lọc</p>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="relative">
                <div className={`pointer-events-none absolute bottom-2 left-[21px] top-2 w-px ${dark ? 'bg-white/5' : 'bg-slate-100'}`} />
                <AnimatePresence initial={false} mode="popLayout">
                  {logs.map((log, i) => (
                    <ActivityRow key={log.LogId} log={log} dark={dark} delay={i * 0.02} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )
        ) : byUserLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl p-3">
                <div className={`h-9 w-9 shrink-0 animate-pulse rounded-full ${dark ? 'bg-white/5' : 'bg-slate-100'}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-3 w-1/3 animate-pulse rounded-full ${dark ? 'bg-white/5' : 'bg-slate-100'}`} />
                  <div className={`h-2.5 w-2/3 animate-pulse rounded-full ${dark ? 'bg-white/5' : 'bg-slate-100'}`} />
                </div>
              </div>
            ))}
          </div>
        ) : byUserGroups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <motion.span
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${dark ? 'bg-white/5 text-slate-600' : 'bg-slate-100 text-slate-300'}`}
            >
              <Activity size={26} />
            </motion.span>
            <p className={`font-bold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Không có hoạt động nào trong ngày này</p>
            <p className="text-xs text-slate-400">Thử chọn ngày khác hoặc bỏ bớt bộ lọc</p>
          </div>
        ) : (
          <div className="space-y-2 p-3 sm:p-4">
            {byUserGroups.map((g) => (
              <UserActivityGroup
                key={g.key}
                userId={g.UserId}
                items={g.logs}
                dark={dark}
                expanded={expandedUsers.has(g.key)}
                onToggle={() => toggleUser(g.key)}
              />
            ))}
          </div>
        )}
      </div>

      {view === 'timeline' && totalPages > 1 && (
        <div className={`${adminTheme.glassCard} flex items-center justify-center gap-1 p-1.5 mx-auto w-fit`}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-30 ${dark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={`px-3 text-sm font-bold ${dark ? 'text-slate-200' : 'text-slate-700'}`}>Trang {page}/{totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-30 ${dark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}