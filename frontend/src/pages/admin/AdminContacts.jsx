import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Area, AreaChart } from 'recharts';
import {
  Mail, MessageSquare, Search, Trash2, Check, Send,
  Clock, CheckCircle2, MessageCircleReply, Inbox,
  Phone, Calendar, TrendingUp, TrendingDown,
} from 'lucide-react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { adminTheme } from '../../components/ui/adminTheme';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

/* ── Sparkline recharts — y hệt AdminStatCard.jsx của Dashboard ── */
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return <div className="h-9 w-20" />;
  const chartData = data.map((v, i) => ({ i, v }));
  const gradId = `spark-contact-${color.replace('#', '')}`;
  return (
    <AreaChart width={84} height={36} data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.45} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} isAnimationActive />
    </AreaChart>
  );
}

/* ── Animated count-up ── */
function CountUp({ to, duration = 0.8 }) {
  const ref = useRef(null);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const ctrl = animate(count, to, { duration, ease: 'easeOut' });
    return ctrl.stop;
  }, [to]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

/* ── Stat card — cùng COLOR_MAP và cấu trúc với AdminStatCard.jsx của Dashboard ── */
const COLOR_MAP = {
  blue: {
    iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-600',
    glow: 'shadow-blue-500/25',
    ring: 'group-hover:ring-blue-500/30',
    accentBar: 'bg-gradient-to-r from-blue-400 to-indigo-500',
    line: '#3b82f6',
    softBg: 'from-blue-500/[0.07] via-transparent to-transparent',
  },
  sky: {
    iconBg: 'bg-gradient-to-br from-sky-400 to-blue-600',
    glow: 'shadow-sky-500/25',
    ring: 'group-hover:ring-sky-500/30',
    accentBar: 'bg-gradient-to-r from-sky-400 to-blue-500',
    line: '#38bdf8',
    softBg: 'from-sky-500/[0.07] via-transparent to-transparent',
  },
  slate: {
    iconBg: 'bg-gradient-to-br from-slate-400 to-slate-600',
    glow: 'shadow-slate-500/20',
    ring: 'group-hover:ring-slate-500/30',
    accentBar: 'bg-gradient-to-r from-slate-400 to-slate-500',
    line: '#64748b',
    softBg: 'from-slate-500/[0.07] via-transparent to-transparent',
  },
  emerald: {
    iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    glow: 'shadow-emerald-500/25',
    ring: 'group-hover:ring-emerald-500/30',
    accentBar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    line: '#34d399',
    softBg: 'from-emerald-500/[0.07] via-transparent to-transparent',
  },
};

function ContactStatCard({ icon: Icon, label, value, color, trend, sparkData, dark, index = 0 }) {
  const palette = COLOR_MAP[color] || COLOR_MAP.sky;
  const isPositive = trend >= 0;

  const cardBg = dark
    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
    : 'bg-white border-slate-200 hover:border-slate-300';
  const titleColor = dark ? 'text-slate-400' : 'text-slate-500';
  const valueColor = dark ? 'text-white' : 'text-slate-900';
  const growthBg = isPositive
    ? dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
    : dark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <div
        className={`relative overflow-hidden rounded-3xl border p-4 transition-all duration-300 ${cardBg} hover:shadow-xl ${palette.glow} ring-1 ring-transparent ${palette.ring}`}
      >
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${palette.softBg} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
        <div className={`absolute inset-x-0 top-0 h-[3px] ${palette.accentBar} opacity-70`} />

        <div className="relative flex items-start justify-between gap-2">
          <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${titleColor}`}>{label}</p>
          <motion.div
            whileHover={{ rotate: -6, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 350, damping: 15 }}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${palette.iconBg} ${palette.glow}`}
          >
            {Icon && <Icon size={18} />}
          </motion.div>
        </div>

        <p className={`relative mt-3 truncate text-2xl font-black tracking-tight ${valueColor}`}>
          <CountUp to={typeof value === 'number' ? value : 0} />
        </p>

        <div className="relative mt-4 flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            {trend !== undefined && (
              <span className={`inline-flex w-fit items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${growthBg}`}>
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {isPositive ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          <div className="shrink-0 opacity-90">
            <Sparkline data={sparkData} color={palette.line} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Status config ── */
const STATUS_CONFIG = {
  new:     { label: 'Mới',         icon: Clock,               bg: 'bg-sky-100 dark:bg-sky-500/15',          text: 'text-sky-700 dark:text-sky-400',          dot: 'bg-sky-500'     },
  read:    { label: 'Đã đọc',      icon: CheckCircle2,        bg: 'bg-slate-100 dark:bg-white/10',          text: 'text-slate-600 dark:text-slate-400',      dot: 'bg-slate-400'   },
  replied: { label: 'Đã phản hồi', icon: MessageCircleReply,  bg: 'bg-emerald-100 dark:bg-emerald-500/15',  text: 'text-emerald-700 dark:text-emerald-400',  dot: 'bg-emerald-500' },
};

/* ── Status badge ── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

/* ── Avatar initials ── */
function Avatar({ name, dark }) {
  const initials = name
    ? name.split(' ').filter(Boolean).map((n) => n[0]).slice(-2).join('').toUpperCase()
    : '??';
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-inner
      ${dark
        ? 'bg-gradient-to-br from-sky-500/30 to-blue-600/20 text-sky-300 border border-sky-500/20'
        : 'bg-gradient-to-br from-sky-100 to-blue-50 text-sky-700 border border-sky-200'}`}
    >
      {initials}
    </div>
  );
}

export default function AdminContacts() {
  const { dark } = useTheme();
  const [contacts, setContacts]     = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch]         = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus]         = useState('');
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText]   = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* stat counts từ toàn bộ data trả về trong page */
  const newCount     = contacts.filter((c) => c.Status === 'new').length;
  const readCount    = contacts.filter((c) => c.Status === 'read').length;
  const repliedCount = contacts.filter((c) => c.Status === 'replied').length;
  const total        = pagination.total || 0;

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 8 });
    if (searchQuery.trim()) q.set('search', searchQuery.trim());
    if (status) q.set('status', status);
    api.get(`/contacts?${q}`)
      .then((r) => {
        setContacts(r.data || []);
        setPagination(r.pagination || {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, status, searchQuery]);

  const markRead = async (id) => {
    try {
      await api.patch(`/contacts/${id}/read`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const openReply = (c) => {
    setReplyTarget(c);
    setReplyText(c.AdminReply || '');
    if (c.Status === 'new') markRead(c.ContactId);
  };

  const submitReply = async () => {
    if (!replyTarget) return;
    setSubmitting(true);
    try {
      await api.patch(`/contacts/${replyTarget.ContactId}/reply`, { reply: replyText });
      toast.success('Đã lưu phản hồi');
      setReplyTarget(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await api.delete(`/contacts/${deleteTarget.ContactId}`);
      toast.success('Đã xóa liên hệ');
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* mock sparklines */
  const totalSpark   = [2, 4, 3, 6, 5, 7, total];
  const newSpark     = [1, 2, 1, 3, 2, newCount];
  const readSpark    = [0, 1, 2, 2, 3, readCount];
  const repliedSpark = [0, 0, 1, 2, 2, repliedCount];

  /* ── theme shortcuts ── */
  const txt1   = dark ? 'text-slate-100'  : 'text-slate-900';
  const txt3   = dark ? 'text-slate-400'  : 'text-slate-500';
  const txt4   = dark ? 'text-slate-500'  : 'text-slate-400';
  const border = dark ? 'border-white/8'  : 'border-slate-200';

  const filterBtn = (active) => active
    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
    : dark
      ? 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20 hover:text-slate-200'
      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300';

  return (
    <div className={adminTheme.page}>
      {/* ── Header ── */}
      <AdminPageHeader
        hideTitle
        subtitle="Quản lý tin nhắn liên hệ từ khách hàng"
        badge={`${total} liên hệ${newCount ? ` · ${newCount} mới` : ''}`}
      />

      {/* ── Stat cards ── */}
      <div className="mb-6 grid gap-3 grid-cols-2 md:grid-cols-4">
        <ContactStatCard
          icon={Inbox}
          label="Tổng liên hệ"
          value={total}
          color="blue"
          trend={12}
          sparkData={totalSpark}
          dark={dark}
          index={0}
        />
        <ContactStatCard
          icon={Clock}
          label="Chưa đọc"
          value={newCount}
          color="sky"
          trend={-8}
          sparkData={newSpark}
          dark={dark}
          index={1}
        />
        <ContactStatCard
          icon={CheckCircle2}
          label="Đã đọc"
          value={readCount}
          color="slate"
          trend={5}
          sparkData={readSpark}
          dark={dark}
          index={2}
        />
        <ContactStatCard
          icon={MessageCircleReply}
          label="Đã phản hồi"
          value={repliedCount}
          color="emerald"
          trend={24}
          sparkData={repliedSpark}
          dark={dark}
          index={3}
        />
      </div>

      {/* ── Filter toolbar ── */}
      <div className={`${adminTheme.glassCard} mb-5`}>
        {/* Toolbar header */}
        <div className={`flex items-center gap-3 border-b px-5 py-3.5 ${dark ? 'border-white/8 bg-slate-950/40' : 'border-slate-100 bg-slate-50/80'} rounded-t-2xl`}>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${dark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
            <Search size={13} />
          </div>
          <span className={`text-xs font-bold uppercase tracking-[0.15em] ${txt3}`}>Tìm kiếm & Lọc</span>
        </div>

        <div className="p-4 space-y-3">
          <form
            onSubmit={(e) => { e.preventDefault(); setSearchQuery(search.trim()); setPage(1); }}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${txt4}`} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, email, tiêu đề..."
                className={`w-full h-11 pl-11 pr-4 rounded-2xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/40
                  ${dark ? 'border-white/10 bg-slate-900 text-slate-200 placeholder:text-slate-600' : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400'}`}
              />
            </div>
            <Button type="submit" className="h-11 px-5 rounded-2xl shrink-0">Tìm</Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {[
              { id: '', label: 'Tất cả' },
              { id: 'new', label: 'Mới' },
              { id: 'read', label: 'Đã đọc' },
              { id: 'replied', label: 'Đã phản hồi' },
            ].map((f) => (
              <motion.button
                key={f.id}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setStatus(f.id); setPage(1); }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterBtn(status === f.id)}`}
              >
                {f.label}
                {f.id === 'new' && newCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                    {newCount}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-32 animate-pulse rounded-2xl ${dark ? 'bg-white/5' : 'bg-slate-200/80'}`} />
          ))}
        </div>
      ) : contacts.length ? (
        <div className={`${adminTheme.glassCard} overflow-hidden`}>
          {/* Card list header */}
          <div className={`flex items-center justify-between border-b px-5 py-3.5 ${dark ? 'border-white/8 bg-slate-950/40' : 'border-slate-100 bg-slate-50/80'}`}>
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${dark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
                <Mail size={13} />
              </div>
              <span className={`text-xs font-bold uppercase tracking-[0.15em] ${txt3}`}>Hộp thư liên hệ</span>
            </div>
            <span className={`text-xs font-semibold ${txt4}`}>{total} tin nhắn</span>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
            className="divide-y divide-slate-100 dark:divide-white/5"
          >
            {contacts.map((c, i) => {
              const isNew = c.Status === 'new';
              return (
                <motion.div
                  key={c.ContactId}
                  custom={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
                  className={`group relative p-5 transition-colors ${dark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50/80'}`}
                >
                  {/* New indicator stripe */}
                  {isNew && (
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                      className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full bg-sky-500 origin-top"
                    />
                  )}

                  <div className="flex gap-4">
                    {/* Avatar */}
                    <Avatar name={c.FullName} dark={dark} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: name + badge + time */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`font-bold text-base ${isNew ? txt1 : txt3}`}>{c.FullName}</span>
                        <StatusBadge status={c.Status} />
                        <span className={`ml-auto text-xs ${txt4} hidden sm:block`}>
                          {formatDateTime(c.CreatedAt)}
                        </span>
                      </div>

                      {/* Row 2: contact info */}
                      <div className={`flex flex-wrap gap-x-4 gap-y-0.5 text-xs ${txt4} mb-2`}>
                        <span className="flex items-center gap-1">
                          <Mail size={10} />{c.Email}
                        </span>
                        {c.Phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} />{c.Phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1 sm:hidden">
                          <Calendar size={10} />{formatDateTime(c.CreatedAt)}
                        </span>
                      </div>

                      {/* Subject */}
                      <p className={`font-semibold text-sm mb-1 ${txt1}`}>{c.Subject}</p>

                      {/* Message preview */}
                      <p className={`text-sm line-clamp-2 leading-relaxed ${txt3}`}>{c.Message}</p>

                      {/* Admin reply preview */}
                      {c.AdminReply && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className={`mt-2.5 flex gap-2 rounded-xl p-3 text-sm
                            ${dark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}
                        >
                          <MessageCircleReply size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                          <p className={`line-clamp-2 ${dark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                            {c.AdminReply}
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {isNew && (
                        <motion.button
                          type="button"
                          onClick={() => markRead(c.ContactId)}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          title="Đánh dấu đã đọc"
                          className={`grid h-8 w-8 place-items-center rounded-xl transition-colors
                            ${dark ? 'bg-sky-500/15 text-sky-400 hover:bg-sky-500/25' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}
                        >
                          <Check size={14} />
                        </motion.button>
                      )}
                      <motion.button
                        type="button"
                        onClick={() => openReply(c)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        title="Phản hồi"
                        className={`grid h-8 w-8 place-items-center rounded-xl transition-colors
                          ${dark ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                      >
                        <Send size={14} />
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => setDeleteTarget(c)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        title="Xóa"
                        className={`grid h-8 w-8 place-items-center rounded-xl transition-colors
                          ${dark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'}`}
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <div className={`border-t ${border}`}>
            <AdminPagination
              page={page}
              totalPages={pagination.totalPages || 1}
              total={pagination.total}
              onPageChange={setPage}
              alwaysShow
            />
          </div>
        </div>
      ) : (
        <AdminEmptyState
          icon={MessageSquare}
          title="Chưa có liên hệ"
          description="Tin nhắn từ form liên hệ sẽ hiện tại đây"
        />
      )}

      {/* ══ Modal phản hồi ══ */}
      <Modal
        open={!!replyTarget}
        onClose={() => setReplyTarget(null)}
        title="Phản hồi khách hàng"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setReplyTarget(null)}>Hủy</Button>
            <Button onClick={submitReply} loading={submitting} className="gap-2">
              <Send size={14} /> Lưu phản hồi
            </Button>
          </div>
        }
      >
        {replyTarget && (
          <div className="space-y-4">
            {/* Customer info */}
            <div className={`flex items-center gap-3 rounded-2xl border p-3.5
              ${dark ? 'border-white/8 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}
            >
              <Avatar name={replyTarget.FullName} dark={dark} />
              <div className="min-w-0">
                <p className={`font-bold text-sm ${txt1}`}>{replyTarget.FullName}</p>
                <p className={`text-xs ${txt4}`}>{replyTarget.Email}</p>
              </div>
              <StatusBadge status={replyTarget.Status} />
            </div>

            {/* Original message */}
            <div className={`rounded-2xl border p-4 ${dark ? 'border-white/8 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
              <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${txt4}`}>Nội dung gốc</p>
              <p className={`font-semibold text-sm mb-1 ${txt1}`}>{replyTarget.Subject}</p>
              <p className={`text-sm leading-relaxed ${txt3}`}>{replyTarget.Message}</p>
            </div>

            {/* Reply textarea */}
            <div>
              <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${txt3}`}>
                Nội dung phản hồi
              </label>
              <textarea
                rows={5}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập nội dung phản hồi gửi tới khách hàng..."
                className={`w-full rounded-2xl border px-4 py-3 text-sm leading-relaxed resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/40
                  ${dark ? 'border-white/10 bg-slate-900 text-slate-200 placeholder:text-slate-600' : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400'}`}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Confirm Delete ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={submitting}
        title="Xóa liên hệ?"
        message={`Xóa vĩnh viễn tin nhắn từ "${deleteTarget?.FullName}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
      />
    </div>
  );
}