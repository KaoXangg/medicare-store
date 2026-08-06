import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ChevronRight, Trash2, User, Phone, MapPin, Calendar,
  BadgeDollarSign, ShoppingBag, PackageCheck, Truck, Wallet,
  CheckCircle2, XCircle, StickyNote, Copy, Printer, Hash,
} from 'lucide-react';
import api from '../../services/api';
import { formatPrice, formatDate, getOrderPaymentInfo, paymentStatusLabel } from '../../utils/format';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { adminTheme } from '../../components/ui/adminTheme';
import toast from 'react-hot-toast';

const statuses = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];

const statusConfig = {
  pending: {
    label: 'Chờ xác nhận',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    dot: 'bg-amber-500',
    gradient: 'from-amber-400 to-orange-500',
    icon: Wallet,
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
    dot: 'bg-sky-500',
    gradient: 'from-sky-500 to-blue-600',
    icon: CheckCircle2,
  },
  shipping: {
    label: 'Đang giao',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    dot: 'bg-violet-500',
    gradient: 'from-violet-500 to-purple-600',
    icon: Truck,
  },
  completed: {
    label: 'Hoàn thành',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
    icon: PackageCheck,
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    dot: 'bg-red-500',
    gradient: 'from-red-500 to-rose-600',
    icon: XCircle,
  },
};

const STEPS = ['pending', 'confirmed', 'shipping', 'completed'];

function copyText(text, label) {
  if (!text) return;
  navigator.clipboard?.writeText(text);
  toast.success(label ? `Đã sao chép ${label}` : 'Đã sao chép');
}

function StatusStepper({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 dark:border-red-500/20 dark:bg-red-500/10">
        <XCircle size={19} className="shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-bold text-red-600 dark:text-red-400">Đơn hàng đã bị hủy</p>
          <p className="text-xs text-red-500/80 dark:text-red-400/70">Đơn sẽ không tiếp tục xử lý</p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status);
  const progressPct = STEPS.length > 1 ? (currentIndex / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="relative">
      <div className="absolute left-[18px] right-[18px] top-[18px] h-0.5 -translate-y-1/2 bg-slate-200 dark:bg-slate-800" />
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `calc(${progressPct}% - ${progressPct > 0 ? 0 : 0}px)` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-[18px] top-[18px] h-0.5 -translate-y-1/2 bg-gradient-to-r from-emerald-400 to-emerald-500"
        style={{ maxWidth: 'calc(100% - 36px)' }}
      />

      <div className="relative flex items-start justify-between">
        {STEPS.map((s, i) => {
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          const done = i < currentIndex;
          const active = i === currentIndex;
          const reached = i <= currentIndex;
          return (
            <div key={s} className="flex flex-col items-center gap-2">
              <motion.div
                animate={active ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.6, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border-2 transition-colors ${
                  reached
                    ? `bg-gradient-to-br ${cfg.gradient} border-transparent text-white shadow-lg`
                    : 'border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-700'
                }`}
              >
                {done ? <CheckCircle2 size={16} /> : <Icon size={15} />}
              </motion.div>
              <span className={`text-center text-[10px] font-bold leading-tight ${reached ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-700'}`}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, tone = 'slate', action, children, delay = 0 }) {
  const toneMap = {
    slate: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneMap[tone]}`}>
            <Icon size={15} />
          </span>
          <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-44 rounded-3xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(!location.state?.order && !order);
    api.get(`/orders/${id}`)
      .then((r) => { setOrder(r.data); setNotFound(false); })
      .catch(() => { if (!location.state?.order) setNotFound(true); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success('Cập nhật trạng thái thành công');
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (e) {
      toast.error(e.message || 'Lỗi cập nhật');
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Đã xóa đơn hàng');
      navigate('/admin/orders');
    } catch (e) {
      toast.error(e.message || 'Lỗi xóa');
    } finally {
      setDeleting(false);
    }
  };

  const itemCount = order?.items?.reduce((a, it) => a + (it.Quantity || 0), 0) || 0;

  return (
    <div className={adminTheme.page}>
      <div className="mx-auto max-w-6xl">
        <div className="sticky top-0 z-30 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85 sm:-mx-6 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <div className="hidden items-center gap-1.5 text-[11px] font-semibold text-slate-400 sm:flex">
                <Link to="/admin/orders" className="hover:underline">Đơn hàng</Link>
                <ChevronRight size={11} />
                <span>Chi tiết</span>
              </div>
              <h1 className="truncate text-sm font-black text-slate-900 dark:text-white sm:text-base">
                {order ? `#${order.OrderCode}` : 'Chi tiết đơn hàng'}
              </h1>
            </div>
          </div>

          {order && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:flex"
              >
                <Printer size={13} /> In
              </button>
              <select
                value={order.Status}
                disabled={updating}
                onChange={(e) => updateStatus(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{statusConfig[s].label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Xóa</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <PageSkeleton />
        ) : notFound || !order ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <ShoppingBag size={32} className="text-slate-300 dark:text-slate-600" />
            <p className="mt-3 font-bold text-slate-600 dark:text-slate-300">Không tìm thấy đơn hàng</p>
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="mt-4 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700"
            >
              Quay lại danh sách
            </button>
          </div>
        ) : (() => {
            const pay = getOrderPaymentInfo(order);
            const paySt = paymentStatusLabel[order.PaymentStatus] || paymentStatusLabel.unpaid;
            const st = statusConfig[order.Status] || statusConfig.pending;

            return (
              <div className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 sm:p-8"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${st.gradient} opacity-[0.06]`} />
                  <div className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${st.gradient} opacity-[0.12] blur-3xl`} />

                  <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${st.gradient} text-white shadow-xl`}>
                        <ShoppingBag size={24} />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white">#{order.OrderCode}</h2>
                          <button
                            type="button"
                            onClick={() => copyText(order.OrderCode, 'mã đơn')}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                          >
                            <Copy size={12} />
                          </button>
                          <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold ${st.className}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} /> {st.label}
                          </span>
                        </div>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(order.CreatedAt)}</span>
                          <span className="flex items-center gap-1"><Hash size={12} /> {itemCount} sản phẩm</span>
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-5 py-3 dark:bg-white/5 lg:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng giá trị đơn</p>
                      <p className="text-3xl font-black text-sky-600 dark:text-sky-400">{formatPrice(order.TotalAmount)}</p>
                    </div>
                  </div>

                  <div className="relative mt-7 max-w-xl">
                    <StatusStepper status={order.Status} />
                  </div>
                </motion.div>

                <div className="grid gap-5 lg:grid-cols-3">
                  <div className="space-y-5 lg:col-span-2">
                    <InfoCard icon={User} title="Thông tin khách hàng" tone="sky" delay={0.05}>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          {order.UserId ? (
                            <Link to={`/admin/users/${order.UserId}`} className="flex items-center gap-3 hover:underline">
                              <User size={16} className="shrink-0 text-slate-400" />
                              <span className="font-semibold text-sky-600 dark:text-sky-400">{order.CustomerName}</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3"><User size={16} className="shrink-0 text-slate-400" /><span className="font-semibold">{order.CustomerName}</span></div>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <Phone size={16} className="shrink-0 text-slate-400" />
                            <span className="font-semibold">{order.CustomerPhone}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyText(order.CustomerPhone, 'số điện thoại')}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                            <span className="font-semibold leading-relaxed">{order.ShippingAddress}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyText(order.ShippingAddress, 'địa chỉ')}
                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        {order.Note && (
                          <p className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                            <StickyNote size={15} className="mt-0.5 shrink-0 text-slate-400" />
                            <span><span className="font-bold">Ghi chú:</span> {order.Note}</span>
                          </p>
                        )}
                      </div>
                    </InfoCard>

                    <InfoCard icon={ShoppingBag} title={`Sản phẩm (${order.items?.length || 0})`} delay={0.1}>
                      <div className="space-y-2.5">
                        {order.items?.map((item, i) => (
                          <motion.div
                            key={item.OrderDetailId}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.03 }}
                            className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/60 p-3 transition hover:border-sky-200 hover:bg-sky-50/40 dark:border-slate-700/40 dark:bg-slate-800/40 dark:hover:border-sky-500/20 dark:hover:bg-sky-500/5"
                          >
                            <div className="relative shrink-0">
                              <img src={item.ProductImage || item.Image || 'https://via.placeholder.com/64'} alt="" className="h-16 w-16 rounded-xl object-cover" />
                              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                                {item.Quantity}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-bold text-slate-800 dark:text-slate-100">{item.ProductName}</p>
                              <p className="mt-1 text-xs text-slate-500">{formatPrice(item.Price)} / sản phẩm</p>
                            </div>
                            <p className="shrink-0 text-sm font-black text-sky-600 dark:text-sky-400">
                              {formatPrice(item.Total || item.Price * item.Quantity)}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </InfoCard>
                  </div>

                  <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
                    <InfoCard icon={Wallet} title="Thanh toán" tone="emerald" delay={0.05}>
                      <div className="space-y-3">
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hình thức</p>
                          <p className="mt-1 font-black text-slate-900 dark:text-white">{pay.typeLabel}</p>
                          {pay.providerLabel && pay.type !== 'cod' && (
                            <p className="mt-1 text-sm font-semibold text-sky-600">{pay.providerLabel}</p>
                          )}
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trạng thái TT</p>
                          <span className={`mt-1 inline-flex rounded-xl px-3 py-1 text-xs font-bold ${paySt.color}`}>{paySt.label}</span>
                        </div>
                      </div>
                    </InfoCard>

                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50 p-5 dark:border-sky-500/20 dark:from-sky-500/10 dark:to-indigo-500/10"
                    >
                      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                        <BadgeDollarSign size={16} /> Tóm tắt thanh toán
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Tạm tính</span><span className="font-semibold text-slate-700 dark:text-slate-200">{formatPrice(order.SubTotal)}</span></div>
                        {order.DiscountAmount > 0 && (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Giảm giá</span><span>-{formatPrice(order.DiscountAmount)}</span></div>
                        )}
                        <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Phí ship</span><span className="font-semibold text-slate-700 dark:text-slate-200">{formatPrice(order.ShippingFee)}</span></div>
                        <div className="flex items-center justify-between border-t border-sky-200/80 pt-3 dark:border-sky-500/20">
                          <span className="font-bold text-slate-800 dark:text-white">Tổng cộng</span>
                          <span className="text-xl font-black text-sky-600 dark:text-sky-400">{formatPrice(order.TotalAmount)}</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            );
          })()}

        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={confirmDelete}
          loading={deleting}
          title="Xóa đơn hàng"
          message="Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác."
          confirmLabel="Xóa đơn"
        >
          {order && (
            <>
              <p className="font-black text-red-600 dark:text-red-400">#{order.OrderCode}</p>
              <p className="mt-1 text-sm text-slate-500">{order.CustomerName} · {formatPrice(order.TotalAmount)}</p>
            </>
          )}
        </ConfirmDialog>
      </div>
    </div>
  );
}