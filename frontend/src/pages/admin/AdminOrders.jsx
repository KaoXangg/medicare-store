import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Trash2,
  ShoppingBag,
  PackageCheck,
  Truck,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

import api from '../../services/api';
import { formatPrice, formatDate, getOrderPaymentInfo, paymentStatusLabel } from '../../utils/format';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { adminTheme } from '../../components/ui/adminTheme';
import toast from 'react-hot-toast';

import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminListToolbar, {
  AdminFilterPill,
  AdminMobileCard,
  AdminMobileActions,
  AdminMobileActionButton,
} from '../../components/admin/AdminListToolbar';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminMobilePagination from '../../components/admin/AdminMobilePagination';

const statuses = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];

const statusConfig = {
  pending: {
    label: 'Chờ xác nhận',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    dot: 'bg-amber-500',
    gradient: 'from-amber-400 to-orange-500',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
    dot: 'bg-sky-500',
    gradient: 'from-sky-500 to-blue-600',
  },
  shipping: {
    label: 'Đang giao',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    dot: 'bg-violet-500',
    gradient: 'from-violet-500 to-purple-600',
  },
  completed: {
    label: 'Hoàn thành',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    dot: 'bg-red-500',
    gradient: 'from-red-500 to-rose-600',
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  const load = () =>
    api.get('/orders?limit=500').then((r) => setOrders(r.data));

  useEffect(() => { load(); }, []);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success('Cập nhật trạng thái thành công');
      load();
    } catch (e) {
      toast.error(e.message || 'Lỗi cập nhật');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/orders/${deleteTarget.OrderId}`);
      toast.success('Đã xóa đơn hàng');
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e.message || 'Lỗi xóa');
    } finally {
      setDeleting(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const keyword = search.toLowerCase();
      const matchSearch =
        o.OrderCode?.toLowerCase().includes(keyword) ||
        o.CustomerName?.toLowerCase().includes(keyword) ||
        o.CustomerPhone?.toLowerCase().includes(keyword);
      const matchStatus = statusFilter === 'all' ? true : o.Status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.Status === 'pending').length,
    shipping: orders.filter((o) => o.Status === 'shipping').length,
    completed: orders.filter((o) => o.Status === 'completed').length,
    revenue: orders
      .filter((o) => o.Status === 'completed')
      .reduce((acc, cur) => acc + Number(cur.TotalAmount), 0),
  };

  return (
    <div className={adminTheme.page}>
      {/* HEADER */}
      <AdminPageHeader
        hideTitle
        subtitle="Theo dõi và quản lý đơn hàng của khách hàng"
        badge={`Tổng đơn hàng: ${stats.total}`}
      />

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <AdminStatCard
          title="Tổng đơn"
          value={stats.total}
          icon={ShoppingBag}
          color="sky"
          index={0}
          growth={8.5}
          compareLabel="tháng trước"
          sparklineData={[15, 20, 18, 25, 22, 28, stats.total]}
        />
        <AdminStatCard
          title="Chờ xác nhận"
          value={stats.pending}
          icon={Wallet}
          color="amber"
          index={1}
          growth={-12.5}
          compareLabel="hôm qua"
          sparklineData={[5, 8, 4, 6, 3, 5, stats.pending]}
        />
        <AdminStatCard
          title="Đang giao"
          value={stats.shipping}
          icon={Truck}
          color="violet"
          index={2}
          growth={15.3}
          compareLabel="hôm qua"
          sparklineData={[1, 3, 2, 4, 3, 2, stats.shipping]}
        />
        <AdminStatCard
          title="Hoàn thành"
          value={stats.completed}
          icon={PackageCheck}
          color="emerald"
          index={3}
          growth={18.2}
          compareLabel="tháng trước"
          sparklineData={[6, 9, 7, 10, 8, 12, stats.completed]}
        />
      </div>

      {/* FILTER */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
        <AdminListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Tìm mã đơn, khách hàng, số điện thoại..."
          filters={
            <>
              <AdminFilterPill
                active={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
              >
                Tất cả ({stats.total})
              </AdminFilterPill>
              {statuses.map((s) => (
                <AdminFilterPill
                  key={s}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                >
                  {statusConfig[s].label} ({orders.filter((o) => o.Status === s).length})
                </AdminFilterPill>
              ))}
            </>
          }
        />
      </motion.div>

      {/* MOBILE CARDS */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5} className="space-y-3 md:hidden">
        {paginatedOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900/80">
            <ShoppingBag size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">Không có đơn hàng</p>
          </div>
        ) : (
          paginatedOrders.map((o) => {
            const st = statusConfig[o.Status] || statusConfig.pending;
            const pay = getOrderPaymentInfo(o);
            return (
              <AdminMobileCard key={o.OrderId}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-black text-sky-600 dark:text-sky-400">#{o.OrderCode}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">{o.CustomerName}</p>
                    <p className="text-xs text-slate-500">{o.CustomerPhone}</p>
                  </div>
                  <span className={`shrink-0 rounded-xl px-2.5 py-1 text-[10px] font-bold ${st.className}`}>
                    {st.label}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-black text-emerald-600">{formatPrice(o.TotalAmount)}</span>
                  <span className="text-xs text-slate-500">{formatDate(o.CreatedAt)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {pay.type === 'cod' ? 'COD' : 'Online'}
                  {pay.providerLabel && pay.type !== 'cod' ? ` · ${pay.providerLabel}` : ''}
                </p>
                <AdminMobileActions>
                  <AdminMobileActionButton variant="primary" onClick={() => navigate(`/admin/orders/${o.OrderId}`, { state: { order: o } })}>
                    <Eye size={14} /> Chi tiết
                  </AdminMobileActionButton>
                  <div className="relative min-w-0 flex-1">
                    <select
                      value={o.Status}
                      onChange={(e) => updateStatus(o.OrderId, e.target.value)}
                      className="w-full h-10 pl-3 pr-7 rounded-xl border border-slate-200 bg-white text-xs font-semibold dark:border-slate-700 dark:bg-slate-900 appearance-none cursor-pointer"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {statusConfig[s].label}
                        </option>
                      ))}
                    </select>
                    <ChevronRight size={11} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                  </div>
                  <AdminMobileActionButton variant="danger" onClick={() => setDeleteTarget(o)}>
                    <Trash2 size={15} />
                  </AdminMobileActionButton>
                </AdminMobileActions>
              </AdminMobileCard>
            );
          })
        )}
        <AdminMobilePagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </motion.div>

      {/* TABLE — desktop */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5} className="hidden md:block">
        <div className={adminTheme.glassCard}>
          <div className="overflow-x-auto">
            <table className={adminTheme.table}>
              <thead>
                <tr className={adminTheme.tableHead}>
                  {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map((h) => (
                    <th key={h} className={adminTheme.tableHeadCell}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {paginatedOrders.map((o, i) => {
                  const st = statusConfig[o.Status] || statusConfig.pending;
                  const pay = getOrderPaymentInfo(o);
                  const paySt = paymentStatusLabel[o.PaymentStatus] || paymentStatusLabel.unpaid;
                  return (
                    <motion.tr
                      key={o.OrderId}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={i * 0.2 + 7}
                      className={adminTheme.tableRow}
                    >
                      <td className={adminTheme.tableCell}>
                        <span className="font-black text-sky-600 dark:text-sky-400 text-sm">
                          #{o.OrderCode}
                        </span>
                      </td>

                      <td className={adminTheme.tableCell}>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {o.CustomerName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          {o.CustomerPhone}
                        </p>
                      </td>

                      <td className={adminTheme.tableCell}>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatPrice(o.TotalAmount)}
                        </span>
                      </td>

                      <td className={adminTheme.tableCell}>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {pay.type === 'cod' ? 'COD' : 'Online'}
                        </p>
                        {pay.providerLabel && pay.type !== 'cod' && (
                          <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">{pay.providerLabel}</p>
                        )}
                        <span className={`inline-flex mt-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${paySt.color}`}>
                          {paySt.label}
                        </span>
                      </td>

                      <td className={adminTheme.tableCell}>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${st.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>

                      <td className={adminTheme.tableCell}>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(o.CreatedAt)}
                        </span>
                      </td>

                      <td className={adminTheme.tableCell}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/orders/${o.OrderId}`, { state: { order: o } })}
                            className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>

                          <div className="relative">
                            <select
                              value={o.Status}
                              onChange={(e) => updateStatus(o.OrderId, e.target.value)}
                              className="h-9 pl-3 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50 appearance-none cursor-pointer"
                            >
                              {statuses.map((s) => (
                                <option key={s} value={s}>
                                  {statusConfig[s].label}
                                </option>
                              ))}
                            </select>
                            <ChevronRight size={11} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                          </div>

                          <button
                            onClick={() => setDeleteTarget(o)}
                            className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 flex items-center justify-center transition-all"
                            title="Xóa đơn"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}

                {paginatedOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <ShoppingBag size={28} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">Không có đơn hàng</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Thử thay đổi bộ lọc tìm kiếm</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <AdminPagination
            page={currentPage}
            totalPages={totalPages}
            total={filteredOrders.length}
            onPageChange={setCurrentPage}
            alwaysShow={false}
          />
        </div>
      </motion.div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Xóa đơn hàng"
        message="Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa đơn"
      >
        <p className="font-black text-red-600 dark:text-red-400">#{deleteTarget?.OrderCode}</p>
        <p className="text-sm text-slate-500 mt-1">{deleteTarget?.CustomerName} · {formatPrice(deleteTarget?.TotalAmount)}</p>
      </ConfirmDialog>
    </div>
  );
}