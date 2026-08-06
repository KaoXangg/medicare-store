import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check, EyeOff, Filter, MessageSquare, Search, Star, Trash2,
} from 'lucide-react';
import api, { getImageUrl } from '../../services/api';
import { formatDateTime } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { adminTheme } from '../../components/ui/adminTheme';
import toast from 'react-hot-toast';

/* ── Sinh sparkline dao động nhẹ quanh giá trị hiện tại (deterministic theo seed) ── */
function buildSparkline(seed, value) {
  if (!value) return Array(7).fill(0);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 1000;

  const points = [];
  for (let i = 0; i < 7; i++) {
    const noise = ((hash * (i + 5)) % 13) - 6;
    const wobble = Math.sin((hash + i) * 0.9) * Math.max(1, value * 0.12);
    points.push(Math.max(0, Math.round(value + wobble + noise * 0.05)));
  }
  points[points.length - 1] = value;
  return points;
}

function computeGrowth(points) {
  const first = points[0] || 0;
  const last = points[points.length - 1] || 0;
  if (!first) return 0;
  return Math.round(((last - first) / first) * 100);
}

const STATUS_FILTERS = [
  { id: '', label: 'Tất cả' },
  { id: 'approved', label: 'Đã duyệt' },
  { id: 'hidden', label: 'Đang ẩn' },
];

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 8, sort: 'newest' });
    if (searchQuery.trim()) q.set('search', searchQuery.trim());
    if (status) q.set('status', status);
    if (rating) q.set('rating', rating);
    api.get(`/reviews?${q}`)
      .then((r) => {
        setReviews(r.data || []);
        setPagination(r.pagination || {});
        setSelected([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, status, rating, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(search.trim());
    setPage(1);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelected(selected.length === reviews.length ? [] : reviews.map((r) => r.ReviewId));
  };

  const bulkAction = async (action) => {
    if (!selected.length) return toast.error('Chưa chọn đánh giá');
    setSubmitting(true);
    try {
      await api.patch('/reviews/bulk', { ids: selected, action });
      toast.success('Đã cập nhật hàng loạt');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    setSubmitting(true);
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Đã xóa đánh giá');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleApproval = async (id, isApproved) => {
    try {
      await api.patch(`/reviews/${id}`, { isApproved });
      toast.success(isApproved ? 'Đã duyệt' : 'Đã ẩn');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const stats = useMemo(() => {
    const total = pagination.total || reviews.length;
    const approved = reviews.filter((r) => r.IsApproved).length;
    const hidden = reviews.filter((r) => !r.IsApproved).length;

    const totalSpark = buildSparkline('total-reviews', total);
    const approvedSpark = buildSparkline('approved-reviews', approved);
    const hiddenSpark = buildSparkline('hidden-reviews', hidden);

    return {
      total, approved, hidden,
      totalSpark, approvedSpark, hiddenSpark,
      totalGrowth: computeGrowth(totalSpark),
      approvedGrowth: computeGrowth(approvedSpark),
      hiddenGrowth: computeGrowth(hiddenSpark),
    };
  }, [reviews, pagination.total]);

  return (
    <div className={adminTheme.page}>
      <AdminPageHeader
        hideTitle
        subtitle="Duyệt, ẩn và xóa đánh giá khách hàng"
        badge={`${pagination.total || 0} đánh giá`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <AdminStatCard
          title="Đánh giá"
          value={stats.total}
          icon={MessageSquare}
          color="sky"
          growth={stats.totalGrowth}
          compareLabel="hiện tại"
          sparklineData={stats.totalSpark}
          index={0}
        />
        <AdminStatCard
          title="Đã duyệt"
          value={stats.approved}
          icon={Check}
          color="emerald"
          growth={stats.approvedGrowth}
          compareLabel="hiện tại"
          sparklineData={stats.approvedSpark}
          index={1}
        />
        <AdminStatCard
          title="Đang ẩn"
          value={stats.hidden}
          icon={EyeOff}
          color="orange"
          growth={stats.hiddenGrowth}
          compareLabel="hiện tại"
          sparklineData={stats.hiddenSpark}
          index={2}
        />
      </div>

      <div className={`${adminTheme.glassCard} p-5 mb-4 space-y-4`}>
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo sản phẩm, khách hàng, nội dung..."
              className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200/80 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-white/10 dark:bg-slate-900"
            />
          </div>
          <Button type="submit" className="h-12 rounded-2xl px-6">Tìm kiếm</Button>
        </form>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Filter size={14} /> Trạng thái
            </span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => { setStatus(f.id); setPage(1); }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  status === f.id
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sao</span>
            <button
              type="button"
              onClick={() => { setRating(''); setPage(1); }}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!rating ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-white/5'}`}
            >
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setRating(String(s)); setPage(1); }}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  rating === String(s) ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'
                }`}
              >
                {s} <Star size={12} fill="currentColor" />
              </button>
            ))}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200/80 dark:border-white/10">
            <span className="text-sm font-semibold text-slate-500 self-center">{selected.length} đã chọn</span>
            <Button variant="secondary" onClick={() => bulkAction('approve')} loading={submitting}><Check size={16} /> Duyệt</Button>
            <Button variant="secondary" onClick={() => bulkAction('hide')} loading={submitting}><EyeOff size={16} /> Ẩn</Button>
            <Button variant="secondary" onClick={() => bulkAction('delete')} loading={submitting} className="text-rose-600"><Trash2 size={16} /> Xóa</Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-white/5" />
          ))}
        </div>
      ) : reviews.length ? (
        <div className={`${adminTheme.glassCard} overflow-hidden`}>
        <div className="space-y-3 p-5 pb-0">
          <label className="flex items-center gap-2 text-sm font-semibold px-1">
            <input type="checkbox" checked={selected.length === reviews.length && reviews.length > 0} onChange={toggleAll} />
            Chọn tất cả trang này
          </label>
          {reviews.map((r, i) => (
            <motion.div
              key={r.ReviewId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`${adminTheme.glassCard} p-5`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <input type="checkbox" checked={selected.includes(r.ReviewId)} onChange={() => toggleSelect(r.ReviewId)} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-bold">{r.FullName}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-sm text-slate-500">{r.ProductName}</span>
                    <AdminStatusBadge label={r.IsApproved ? 'Đã duyệt' : 'Đang ẩn'} variant={r.IsApproved ? 'active' : 'inactive'} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(r.Rating)].map((_, idx) => (
                        <Star key={idx} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      {formatDateTime(r.CreatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{r.Comment}</p>
                  {r.images?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ảnh khách hàng</p>
                      <div className="flex flex-wrap gap-2">
                        {r.images.map((url, idx) => (
                          <a key={idx} href={getImageUrl(url)} target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/10">
                            <img src={getImageUrl(url)} alt="" className="h-20 w-20 object-cover transition group-hover:scale-105" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!r.IsApproved && (
                    <button type="button" onClick={() => toggleApproval(r.ReviewId, true)} className={`${adminTheme.actionBtn} bg-emerald-100/90 text-emerald-600`} title="Duyệt"><Check size={16} /></button>
                  )}
                  {r.IsApproved && (
                    <button type="button" onClick={() => toggleApproval(r.ReviewId, false)} className={`${adminTheme.actionBtn} bg-amber-100/90 text-amber-600`} title="Ẩn"><EyeOff size={16} /></button>
                  )}
                  <button type="button" onClick={() => setDeleteTarget(r)} className={`${adminTheme.actionBtn} bg-rose-100/90 text-rose-600`} title="Xóa"><Trash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
          <AdminPagination
            page={page}
            totalPages={pagination.totalPages || 1}
            total={pagination.total}
            onPageChange={setPage}
            alwaysShow
          />
        </div>
      ) : (
        <AdminEmptyState icon={MessageSquare} title="Không có đánh giá" description="Thử đổi bộ lọc hoặc từ khóa tìm kiếm" />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => remove(deleteTarget?.ReviewId)}
        loading={submitting}
        title="Xóa đánh giá"
        message="Xóa vĩnh viễn đánh giá này? Hành động không thể hoàn tác."
        confirmLabel="Xóa đánh giá"
      >
        <p className="font-bold">{deleteTarget?.FullName}</p>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{deleteTarget?.Comment}</p>
      </ConfirmDialog>
    </div>
  );
}