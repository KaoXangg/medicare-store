import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Area, AreaChart } from 'recharts';
import {
  Plus, Pencil, Trash2, Ticket, Eye, EyeOff,
  Tag, Percent, DollarSign, TrendingUp, TrendingDown, Clock,
  CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { formatDate, formatPrice } from '../../utils/format';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import {
  AdminMobileActionButton,
  AdminMobileActions,
  AdminMobileCard,
} from '../../components/admin/AdminListToolbar';
import AdminMobilePagination from '../../components/admin/AdminMobilePagination';
import { adminTheme } from '../../components/ui/adminTheme';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const PAGE_SIZE = 8;

const toLocalInput = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  minOrderAmount: '0',
  maxDiscount: '',
  usageLimit: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

/* ── Sparkline recharts — y hệt AdminStatCard.jsx của Dashboard ── */
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return <div className="h-9 w-20" />;
  const chartData = data.map((v, i) => ({ i, v }));
  const gradId = `spark-coupon-${color.replace('#', '')}`;
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
  emerald: {
    iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    glow: 'shadow-emerald-500/25',
    ring: 'group-hover:ring-emerald-500/30',
    accentBar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    line: '#34d399',
    softBg: 'from-emerald-500/[0.07] via-transparent to-transparent',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    glow: 'shadow-amber-500/25',
    ring: 'group-hover:ring-amber-500/30',
    accentBar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    line: '#fbbf24',
    softBg: 'from-amber-500/[0.07] via-transparent to-transparent',
  },
  violet: {
    iconBg: 'bg-gradient-to-br from-violet-400 to-purple-600',
    glow: 'shadow-violet-500/25',
    ring: 'group-hover:ring-violet-500/30',
    accentBar: 'bg-gradient-to-r from-violet-400 to-purple-500',
    line: '#a78bfa',
    softBg: 'from-violet-500/[0.07] via-transparent to-transparent',
  },
};

function CouponStatCard({ icon: Icon, label, value, color, trend, sparkData, dark, index = 0 }) {
  const palette = COLOR_MAP[color] || COLOR_MAP.blue;
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

/* ── Badge trạng thái ── */
function CouponBadge({ active, expired }) {
  if (active && !expired) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
      <CheckCircle size={11} /> Hoạt động
    </span>
  );
  if (active && expired) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
      <AlertCircle size={11} /> Hết hạn
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
      <XCircle size={11} /> Đã ẩn
    </span>
  );
}

/* ── Progress bar sử dụng ── */
function UsageBar({ used, limit, dark }) {
  if (!limit) return (
    <span className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
      {used} <span className="opacity-50">/ ∞</span>
    </span>
  );
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 90 ? 'bg-rose-500' : pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-xs font-semibold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
        {used} / {limit}
      </span>
      <div className={`h-1.5 w-20 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-slate-200'}`}>
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function AdminCoupons() {
  const { dark } = useTheme();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/coupons').then((r) => setCoupons(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const totalPages = Math.max(1, Math.ceil(coupons.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return coupons.slice(start, start + PAGE_SIZE);
  }, [coupons, page]);

  /* ── derived stats ── */
  const activeCount  = coupons.filter((c) => (c.IsActive === true || c.IsActive === 1) && new Date(c.EndDate) >= new Date()).length;
  const expiredCount = coupons.filter((c) => (c.IsActive === true || c.IsActive === 1) && new Date(c.EndDate) < new Date()).length;
  const totalUsed    = coupons.reduce((s, c) => s + (c.UsedCount || 0), 0);

  /* mock sparklines dựa trên dữ liệu thực */
  const totalSpark   = [2, 3, 3, 4, 5, 4, coupons.length];
  const activeSpark  = [1, 2, 2, 3, activeCount - 1, activeCount];
  const expiredSpark = [0, 0, 1, 1, 2, expiredCount];
  const usedSpark    = [0, Math.round(totalUsed * 0.2), Math.round(totalUsed * 0.45), Math.round(totalUsed * 0.7), Math.round(totalUsed * 0.9), totalUsed];

  const openCreate = () => {
    setEditing(null);
    const now = new Date();
    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 1);
    setForm({ ...emptyForm, startDate: toLocalInput(now), endDate: toLocalInput(end) });
    setModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code:           c.Code || '',
      description:    c.Description || '',
      discountType:   c.DiscountType || 'percent',
      discountValue:  String(c.DiscountValue ?? ''),
      minOrderAmount: String(c.MinOrderAmount ?? 0),
      maxDiscount:    c.MaxDiscount != null ? String(c.MaxDiscount) : '',
      usageLimit:     c.UsageLimit != null ? String(c.UsageLimit) : '',
      startDate:      toLocalInput(c.StartDate),
      endDate:        toLocalInput(c.EndDate),
      isActive:       c.IsActive === true || c.IsActive === 1,
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      code:           form.code.trim().toUpperCase(),
      discountValue:  Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscount:    form.maxDiscount !== '' ? Number(form.maxDiscount) : null,
      usageLimit:     form.usageLimit !== '' ? Number(form.usageLimit) : null,
      startDate:      new Date(form.startDate).toISOString(),
      endDate:        new Date(form.endDate).toISOString(),
    };
    try {
      if (editing) {
        await api.put(`/coupons/${editing.CouponId}`, payload);
        toast.success('Đã cập nhật mã giảm giá');
      } else {
        await api.post('/coupons', payload);
        toast.success('Đã tạo mã giảm giá');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (c) => {
    const active = c.IsActive === true || c.IsActive === 1;
    try {
      await api.put(`/coupons/${c.CouponId}`, { isActive: !active });
      toast.success(active ? 'Đã ẩn mã' : 'Đã kích hoạt mã');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/coupons/${deleteTarget.CouponId}`);
      toast.success('Đã xóa mã giảm giá');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const discountLabel = (c) =>
    c.DiscountType === 'percent'
      ? `${c.DiscountValue}%${c.MaxDiscount ? ` (≤${formatPrice(c.MaxDiscount)})` : ''}`
      : formatPrice(c.DiscountValue);

  /* ── theme shortcuts ── */
  const txt1  = dark ? 'text-slate-100'  : 'text-slate-900';
  const txt3  = dark ? 'text-slate-400'  : 'text-slate-500';
  const txt4  = dark ? 'text-slate-500'  : 'text-slate-400';
  const card  = dark ? 'border-white/8 bg-slate-900/80' : 'border-slate-200 bg-white';
  const thead = dark ? 'border-white/10 text-slate-400' : 'border-slate-200/80 text-slate-500';
  const trow  = dark ? 'border-white/5 hover:bg-white/[0.025]' : 'border-slate-100 hover:bg-slate-50/80';

  return (
    <div className={adminTheme.page}>
      {/* ── Header ── */}
      <AdminPageHeader
        hideTitle
        subtitle="Tạo và quản lý coupon khuyến mãi cho khách hàng"
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus size={18} /> Tạo mã mới
          </Button>
        }
      />

      {/* ── Stat cards ── */}
      {!loading && (
        <div className="mb-6 grid gap-3 grid-cols-2 md:grid-cols-4">
          <CouponStatCard
            icon={Ticket}
            label="Tổng mã"
            value={coupons.length}
            color="blue"
            trend={8}
            sparkData={totalSpark}
            dark={dark}
            index={0}
          />
          <CouponStatCard
            icon={CheckCircle}
            label="Đang hoạt động"
            value={activeCount}
            color="emerald"
            trend={12}
            sparkData={activeSpark}
            dark={dark}
            index={1}
          />
          <CouponStatCard
            icon={Clock}
            label="Hết hạn"
            value={expiredCount}
            color="amber"
            trend={-5}
            sparkData={expiredSpark}
            dark={dark}
            index={2}
          />
          <CouponStatCard
            icon={TrendingUp}
            label="Tổng lượt dùng"
            value={totalUsed}
            color="violet"
            trend={28}
            sparkData={usedSpark}
            dark={dark}
            index={3}
          />
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading ? (
        <div className="space-y-3">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-28 rounded-2xl animate-pulse ${dark ? 'bg-white/5' : 'bg-slate-200/80'}`} />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-16 rounded-2xl animate-pulse ${dark ? 'bg-white/5' : 'bg-slate-200/80'}`} />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <AdminEmptyState
          icon={Ticket}
          title="Chưa có mã giảm giá"
          description="Tạo mã để khách áp dụng khi thanh toán"
          action={
            <Button onClick={openCreate} className="gap-2">
              <Plus size={16} /> Tạo mã đầu tiên
            </Button>
          }
        />
      ) : (
        <>
          {/* ── Mobile cards ── */}
          <div className="space-y-3 md:hidden">
            {pageItems.map((c, i) => {
              const active  = c.IsActive === true || c.IsActive === 1;
              const expired = new Date(c.EndDate) < new Date();
              return (
                <motion.div
                  key={c.CouponId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <AdminMobileCard>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 px-2.5 py-1 mb-1">
                          <Tag size={11} className="text-primary-600 dark:text-primary-400" />
                          <span className="font-black text-sm text-primary-600 dark:text-primary-400 tracking-widest">
                            {c.Code}
                          </span>
                        </div>
                        {c.Description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{c.Description}</p>
                        )}
                      </div>
                      <CouponBadge active={active} expired={expired} />
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <Percent size={12} className="text-slate-400 shrink-0" />
                        <span className={`font-bold ${txt1}`}>{discountLabel(c)}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Đơn tối thiểu {formatPrice(c.MinOrderAmount)} · Đã dùng {c.UsedCount}
                        {c.UsageLimit ? `/${c.UsageLimit}` : ''}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(c.StartDate)} → {formatDate(c.EndDate)}
                      </p>
                    </div>
                    <AdminMobileActions>
                      <AdminMobileActionButton variant="primary" onClick={() => openEdit(c)}>
                        <Pencil size={14} /> Sửa
                      </AdminMobileActionButton>
                      <AdminMobileActionButton variant="warning" onClick={() => toggleActive(c)}>
                        {active ? <EyeOff size={15} /> : <Eye size={15} />}
                      </AdminMobileActionButton>
                      <AdminMobileActionButton variant="danger" onClick={() => setDeleteTarget(c)}>
                        <Trash2 size={15} />
                      </AdminMobileActionButton>
                    </AdminMobileActions>
                  </AdminMobileCard>
                </motion.div>
              );
            })}
            <AdminMobilePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>

          {/* ── Desktop table ── */}
          <div className={`${adminTheme.glassCard} hidden overflow-hidden md:block`}>
            {/* Table header bar */}
            <div className={`flex items-center justify-between border-b px-5 py-3.5 ${dark ? 'border-white/8 bg-slate-950/40' : 'border-slate-100 bg-slate-50/80'}`}>
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${dark ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600'}`}>
                  <Ticket size={13} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-[0.15em] ${txt3}`}>
                  Danh sách mã giảm giá
                </span>
              </div>
              <span className={`text-xs font-semibold ${txt4}`}>{coupons.length} mã</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className={`border-b text-left text-[11px] font-bold uppercase tracking-wider ${thead}`}>
                    <th className="px-5 py-3.5">Mã / Mô tả</th>
                    <th className="px-5 py-3.5">Giảm giá</th>
                    <th className="px-5 py-3.5">Đơn tối thiểu</th>
                    <th className="px-5 py-3.5">Lượt dùng</th>
                    <th className="px-5 py-3.5">Hiệu lực</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((c, i) => {
                    const active  = c.IsActive === true || c.IsActive === 1;
                    const expired = new Date(c.EndDate) < new Date();
                    return (
                      <motion.tr
                        key={c.CouponId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 24 }}
                        className={`border-b transition-colors ${trow}`}
                      >
                        {/* Code + description */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${dark ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-100 text-primary-600'}`}>
                              <Tag size={13} />
                            </div>
                            <div className="min-w-0">
                              <p className={`font-black tracking-wider ${dark ? 'text-primary-400' : 'text-primary-600'}`}>
                                {c.Code}
                              </p>
                              {c.Description && (
                                <p className={`text-xs line-clamp-1 ${txt4}`}>{c.Description}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Discount */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {c.DiscountType === 'percent'
                              ? <Percent size={12} className={txt4} />
                              : <DollarSign size={12} className={txt4} />
                            }
                            <span className={`font-bold ${txt1}`}>{discountLabel(c)}</span>
                          </div>
                        </td>

                        {/* Min order */}
                        <td className={`px-5 py-3.5 font-medium ${txt3}`}>
                          {formatPrice(c.MinOrderAmount)}
                        </td>

                        {/* Usage */}
                        <td className="px-5 py-3.5">
                          <UsageBar used={c.UsedCount} limit={c.UsageLimit} dark={dark} />
                        </td>

                        {/* Dates */}
                        <td className="px-5 py-3.5">
                          <div className={`text-xs space-y-0.5 ${txt3}`}>
                            <p>{formatDate(c.StartDate)}</p>
                            <p className="flex items-center gap-1">
                              <span className="opacity-50">→</span>
                              <span className={expired ? 'text-rose-500 font-semibold' : ''}>
                                {formatDate(c.EndDate)}
                              </span>
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <CouponBadge active={active} expired={expired} />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            <motion.button
                              type="button"
                              onClick={() => toggleActive(c)}
                              title={active ? 'Ẩn mã' : 'Kích hoạt'}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${dark ? 'hover:bg-white/10 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'}`}
                            >
                              {active ? <EyeOff size={15} /> : <Eye size={15} />}
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => openEdit(c)}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${dark ? 'hover:bg-primary-900/40 text-primary-400' : 'hover:bg-primary-50 text-primary-600'}`}
                            >
                              <Pencil size={15} />
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => setDeleteTarget(c)}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${dark ? 'hover:bg-rose-900/30 text-rose-400' : 'hover:bg-rose-50 text-rose-600'}`}
                            >
                              <Trash2 size={15} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} alwaysShow />
        </>
      )}

      {/* ══ Modal tạo / sửa ══ */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
      >
        {/* Modal header accent */}
        <div className={`-mx-6 -mt-2 mb-5 flex items-center gap-3 border-b px-6 pb-4 ${dark ? 'border-white/8' : 'border-slate-100'}`}>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${dark ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600'}`}>
            <Ticket size={16} />
          </div>
          <div>
            <p className={`text-sm font-bold ${txt1}`}>
              {editing ? `Sửa mã: ${editing.Code}` : 'Mã giảm giá mới'}
            </p>
            <p className={`text-xs ${txt4}`}>Điền thông tin bên dưới rồi lưu</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Code + Description */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${txt3}`}>Mã coupon *</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
                required
              />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${txt3}`}>Mô tả</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Giảm 10% cho đơn đầu tiên"
              />
            </div>
          </div>

          {/* Discount type + value */}
          <div className={`rounded-2xl border p-4 ${dark ? 'border-white/8 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/60'}`}>
            <p className={`mb-3 text-[11px] font-bold uppercase tracking-wider ${txt4}`}>Cấu hình giảm giá</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={`mb-1.5 block text-xs font-bold ${txt3}`}>Loại giảm *</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className={`w-full rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${dark ? 'border-white/10 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-800'}`}
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (đ)</option>
                </select>
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-bold ${txt3}`}>
                  Giá trị giảm * {form.discountType === 'percent' ? '(%)' : '(đ)'}
                </label>
                <Input
                  type="number"
                  min="1"
                  step="any"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className={`rounded-2xl border p-4 ${dark ? 'border-white/8 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/60'}`}>
            <p className={`mb-3 text-[11px] font-bold uppercase tracking-wider ${txt4}`}>Điều kiện áp dụng</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={`mb-1.5 block text-xs font-bold ${txt3}`}>Đơn tối thiểu (đ)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                />
              </div>
              {form.discountType === 'percent' && (
                <div>
                  <label className={`mb-1.5 block text-xs font-bold ${txt3}`}>Giảm tối đa (đ)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder="Để trống = không giới hạn"
                  />
                </div>
              )}
              <div>
                <label className={`mb-1.5 block text-xs font-bold ${txt3}`}>Giới hạn lượt dùng</label>
                <Input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="Không giới hạn"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className={`rounded-2xl border p-4 ${dark ? 'border-white/8 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/60'}`}>
            <p className={`mb-3 text-[11px] font-bold uppercase tracking-wider ${txt4}`}>Thời gian hiệu lực</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={`mb-1.5 block text-xs font-bold ${txt3}`}>Bắt đầu *</label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-bold ${txt3}`}>Kết thúc *</label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Active toggle */}
          <label className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition-colors ${dark ? 'border-white/8 hover:bg-white/[0.025]' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="relative">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="sr-only"
              />
              <div className={`h-5 w-9 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : dark ? 'bg-white/20' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <div>
              <p className={`text-sm font-bold ${txt1}`}>Kích hoạt ngay</p>
              <p className={`text-xs ${txt4}`}>Mã sẽ có hiệu lực ngay sau khi tạo</p>
            </div>
          </label>

          {/* Footer actions */}
          <div className={`flex justify-end gap-2 pt-2 border-t ${dark ? 'border-white/8' : 'border-slate-100'}`}>
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mã'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Delete ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Xóa mã giảm giá?"
        message={`Xóa vĩnh viễn mã "${deleteTarget?.Code}"? Đơn hàng đã dùng mã vẫn giữ số tiền giảm, chỉ gỡ liên kết mã.`}
      />
    </div>
  );
}