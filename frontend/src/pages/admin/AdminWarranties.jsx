import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, ShieldClose, ShieldQuestion, Search, XCircle,
  Plus, Eye, Trash2, Phone, Calendar, Copy, Hash, SlidersHorizontal,
} from 'lucide-react';
import api from '../../services/api';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminPagination from '../../components/admin/AdminPagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { adminTheme } from '../../components/ui/adminTheme';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { id: '', label: 'Tất cả' },
  { id: 'active', label: 'Còn hiệu lực' },
  { id: 'expired', label: 'Đã hết hạn' },
  { id: 'void', label: 'Đã thu hồi' },
];

const STATUS_META = {
  active: {
    label: 'Còn hiệu lực',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    icon: ShieldCheck,
  },
  expired: {
    label: 'Đã hết hạn',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    icon: ShieldAlert,
  },
  void: {
    label: 'Đã thu hồi',
    className: 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400',
    icon: ShieldClose,
  },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLeft(expiryDate) {
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
}

function copyText(text, label) {
  if (!text) return;
  navigator.clipboard?.writeText(text);
  toast.success(label ? `Đã sao chép ${label}` : 'Đã sao chép');
}

function WarrantyCard({ w, index, onDelete, dark }) {
  const meta = STATUS_META[w.ComputedStatus] || STATUS_META.active;
  const Icon = meta.icon;
  const remain = daysLeft(w.ExpiryDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-lg ${
        dark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold tracking-wide text-slate-800 dark:text-slate-100">
              {w.MaskedCode || w.WarrantyCode}
            </span>
            <button
              type="button"
              onClick={() => copyText(w.WarrantyCode, 'mã phiếu')}
              className="flex h-5 w-5 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
            >
              <Copy size={11} />
            </button>
          </div>
          <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{w.ProductName}</p>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
          <Icon size={12} /> {meta.label}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{w.CustomerName}</span>
        <span className="flex items-center gap-1"><Phone size={11} /> {w.Phone}</span>
      </div>

      <div className={`mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs ${dark ? 'bg-white/5' : 'bg-slate-50'}`}>
        <span className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
          <Calendar size={12} /> Hết hạn {formatDate(w.ExpiryDate)}
        </span>
        {w.ComputedStatus === 'active' && (
          <span className={`font-bold ${remain <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {remain > 0 ? `Còn ${remain} ngày` : 'Hết hạn hôm nay'}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Link
          to={`/admin/warranties/edit/${w.WarrantyId}`}
          state={{ warranty: w }}
          className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition ${
            dark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
          }`}
        >
          <Eye size={13} /> Xem / Sửa
        </Link>
        <button
          type="button"
          onClick={() => onDelete(w)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
            dark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

export default function AdminWarranties() {
  const navigate = useNavigate();
  const { dark } = useTheme();

  const [warranties, setWarranties] = useState([]);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 12 });
    if (search.trim()) q.set('search', search.trim());
    if (status) q.set('status', status);
    api.get(`/warranties?${q}`)
      .then((r) => { setWarranties(r.data || []); setPagination(r.pagination || {}); })
      .catch((e) => toast.error(e.message || 'Không tải được danh sách'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, search, status]);
  useEffect(() => { setPage(1); }, [search, status]);
  useEffect(() => {
    api.get('/warranties/stats').then((r) => setStats(r.data)).catch(() => {});
  }, [warranties.length]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/warranties/${deleteTarget.WarrantyId}`);
      toast.success('Đã xóa phiếu bảo hành');
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e.message || 'Lỗi xóa');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={adminTheme.page}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Theo dõi phiếu bảo hành, thời hạn và trạng thái từng đơn.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/warranties/create')}
          className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition active:scale-[0.98]"
        >
          <Plus size={16} /> Tạo phiếu bảo hành
        </button>
      </div>

      {stats && (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <AdminStatCard
            title="Tổng phiếu"
            value={stats.total}
            icon={Hash}
            color="sky"
            growth={8.4}
            compareLabel="tháng trước"
            sparklineData={[2, 3, 3, 4, 4, 5, stats.total]}
            index={0}
          />
          <AdminStatCard
            title="Còn hiệu lực"
            value={stats.active}
            icon={ShieldCheck}
            color="emerald"
            growth={6.1}
            compareLabel="tháng trước"
            sparklineData={[1, 2, 2, 3, 3, 4, stats.active]}
            index={1}
          />
          <AdminStatCard
            title="Đã hết hạn"
            value={stats.expired}
            icon={ShieldAlert}
            color="amber"
            growth={-4.2}
            compareLabel="tháng trước"
            sparklineData={[0, 1, 1, 0, 1, 0, stats.expired]}
            index={2}
          />
          <AdminStatCard
            title="Đã thu hồi"
            value={stats.voided}
            icon={ShieldClose}
            color="cyan"
            growth={0}
            compareLabel="tháng trước"
            sparklineData={[1, 1, 0, 0, 1, 0, stats.voided]}
            index={3}
          />
        </div>
      )}

      <div className={`${adminTheme.glassCard} mb-5 p-4 sm:p-5`}>
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/5 via-transparent to-violet-500/5 dark:from-sky-500/5 dark:to-violet-500/5" />
        <div className="relative mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
            <SlidersHorizontal size={14} />
          </span>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tìm kiếm &amp; lọc</p>
        </div>
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className={`flex flex-1 items-center gap-3 rounded-xl border px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-sky-400/30 ${
            dark ? 'border-slate-700 bg-slate-950/70 focus-within:border-sky-500/60' : 'border-slate-200 bg-slate-50 focus-within:border-sky-400'
          }`}>
            <Search size={16} className={`shrink-0 ${searchInput ? 'text-sky-500' : 'text-slate-400'}`} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên, SĐT, mã phiếu, sản phẩm..."
              className={`flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal ${
                dark ? 'text-slate-100 placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {searchInput && (
              <button type="button" onClick={() => setSearchInput('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="relative mt-3 flex items-center gap-2 overflow-x-auto pb-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatus(f.id)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                status === f.id
                  ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md shadow-sky-500/25'
                  : dark
                    ? 'border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    : 'border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-48 animate-pulse rounded-2xl ${dark ? 'bg-slate-800/60' : 'bg-slate-100'}`} />
          ))}
        </div>
      ) : warranties.length === 0 ? (
        <AdminEmptyState
          icon={ShieldQuestion}
          title="Chưa có phiếu bảo hành"
          description="Thử đổi bộ lọc hoặc tạo phiếu bảo hành mới"
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {warranties.map((w, i) => (
                <WarrantyCard key={w.WarrantyId} w={w} index={i} onDelete={setDeleteTarget} dark={dark} />
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-6">
            <AdminPagination
              page={page}
              totalPages={pagination.totalPages || 1}
              total={pagination.total}
              onPageChange={setPage}
              alwaysShow
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Xóa phiếu bảo hành"
        message="Xóa vĩnh viễn phiếu bảo hành này? Hành động không thể hoàn tác."
        confirmLabel="Xóa phiếu"
      >
        {deleteTarget && (
          <>
            <p className="font-black text-slate-900 dark:text-white">{deleteTarget.WarrantyCode}</p>
            <p className="mt-1 text-sm text-slate-500">{deleteTarget.CustomerName} · {deleteTarget.ProductName}</p>
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}