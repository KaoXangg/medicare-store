import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Building2, X, Upload, Search,
  XCircle, RefreshCw, Layers,
} from 'lucide-react';
import api, { getImageUrl } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminPanel from '../../components/admin/AdminPanel';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { adminTheme } from '../../components/ui/adminTheme';
import toast from 'react-hot-toast';


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
  points[points.length - 1] = value; // luôn kết thúc đúng bằng giá trị hiện tại
  return points;
}

function computeGrowth(points) {
  const first = points[0] || 0;
  const last = points[points.length - 1] || 0;
  if (!first) return 0;
  return Math.round(((last - first) / first) * 100);
}

const emptyForm = { name: '', slug: '', description: '', logoUrl: '' };


function BrandLogo({ brand, size = 56 }) {
  const [imgError, setImgError] = useState(false);
  const src = brand?.Logo ? getImageUrl(brand.Logo) : null;
  const sz = `${size}px`;

  if (src && !imgError) {
    return (
      <div
        className="relative shrink-0 rounded-2xl ring-2 ring-white/80 dark:ring-slate-800 shadow-md overflow-hidden bg-white flex items-center justify-center"
        style={{ width: sz, height: sz }}
      >
        <img
          src={src}
          alt={brand?.Name}
          className="h-full w-full object-contain p-1.5"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 ring-2 ring-white/80 dark:ring-slate-800 shadow-md flex items-center justify-center"
      style={{ width: sz, height: sz }}
    >
      <Building2 size={size * 0.4} className="text-white" />
    </div>
  );
}


function StatusDot({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
      active
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
    }`}>
      <span className="relative flex h-1.5 w-1.5">
        {active && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      </span>
      {active ? 'Hiện' : 'Ẩn'}
    </span>
  );
}


function CardSkeleton({ dark }) {
  return (
    <div className={`animate-pulse rounded-2xl border p-5 ${dark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-4">
        <div className={`h-14 w-14 shrink-0 rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
        <div className="flex-1 space-y-2 pt-1">
          <div className={`h-4 w-3/4 rounded-lg ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
          <div className={`h-3 w-1/2 rounded-lg ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className={`h-9 flex-1 rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
        <div className={`h-9 w-9 rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
        <div className={`h-9 w-9 rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
      </div>
    </div>
  );
}


function BrandCard({ b, dark, actionLoading, onEdit, onToggle, onDelete }) {
  const card = dark
    ? 'border-slate-800 bg-slate-900/60 hover:border-sky-500/30'
    : 'border-slate-200 bg-white hover:border-indigo-200/60';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-xl ${card} ${!b.IsActive ? 'opacity-70' : ''}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-indigo-500/4 to-violet-500/4" />

      <div className="relative">
        <div className="flex items-start gap-4">
          <BrandLogo brand={b} size={56} />
          <div className="min-w-0 flex-1">
            <p className={`font-bold truncate ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{b.Name}</p>
            <p className={`truncate text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>/{b.Slug}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <StatusDot active={b.IsActive} />
        </div>

        {b.Description && (
          <p className={`mt-2.5 line-clamp-2 text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            {b.Description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.93 }}
            type="button"
            onClick={() => onEdit(b)}
            title="Sửa"
            className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl text-xs font-bold transition ${
              dark
                ? 'bg-sky-500/15 text-sky-400 hover:bg-sky-500/25'
                : 'bg-sky-100 text-sky-600 hover:bg-sky-200'
            }`}
          >
            <Pencil size={14} /> Sửa
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.93 }}
            type="button"
            disabled={actionLoading === b.BrandId}
            onClick={() => onToggle(b)}
            title={b.IsActive ? 'Ẩn' : 'Hiện'}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition disabled:opacity-50 ${
              b.IsActive
                ? dark ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                : dark ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
            }`}
          >
            {actionLoading === b.BrandId ? (
              <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : b.IsActive ? <EyeOff size={15} /> : <Eye size={15} />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.93 }}
            type="button"
            onClick={() => onDelete(b)}
            title="Xóa"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition ${
              dark ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25' : 'bg-rose-100 text-rose-500 hover:bg-rose-200'
            }`}
          >
            <Trash2 size={15} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}


function EmptyState({ icon: Icon, title, desc, onRefresh, dark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center gap-5 rounded-2xl border border-dashed py-20 text-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}
    >
      <div className={`grid h-20 w-20 place-items-center rounded-2xl ${dark ? 'bg-white/5' : 'bg-gradient-to-br from-slate-100 to-slate-200'}`}>
        <Icon size={36} className={dark ? 'text-slate-500' : 'text-slate-400'} />
      </div>
      <div>
        <p className={`font-bold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</p>
        <p className="mt-1 text-sm text-slate-400">{desc}</p>
      </div>
      {onRefresh && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90 transition"
        >
          <RefreshCw size={15} /> Tải lại
        </motion.button>
      )}
    </motion.div>
  );
}


export default function AdminBrands() {
  const { dark } = useTheme();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/brands?active=false');
      setBrands(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Không tải được danh sách thương hiệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = brands.length;
    const active = brands.filter((b) => b.IsActive).length;
    const hidden = brands.filter((b) => !b.IsActive).length;

    const totalSpark = buildSparkline('total-brands', total);
    const activeSpark = buildSparkline('active-brands', active);
    const hiddenSpark = buildSparkline('hidden-brands', hidden);

    return {
      total, active, hidden,
      totalSpark, activeSpark, hiddenSpark,
      totalGrowth: computeGrowth(totalSpark),
      activeGrowth: computeGrowth(activeSpark),
      hiddenGrowth: computeGrowth(hiddenSpark),
    };
  }, [brands]);

  const filteredBrands = useMemo(() => {
    const kw = search.toLowerCase().trim();
    return brands.filter((b) => {
      const matchKw = !kw || b.Name?.toLowerCase().includes(kw);
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && b.IsActive) ||
        (filterStatus === 'hidden' && !b.IsActive);
      return matchKw && matchStatus;
    });
  }, [brands, search, filterStatus]);

  const openCreate = () => {
    setEditingBrand(null);
    setForm(emptyForm);
    setLogoFile(null);
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditingBrand(b);
    setForm({
      name: b.Name || '',
      slug: b.Slug || '',
      description: b.Description || '',
      logoUrl: b.Logo || '',
    });
    setLogoFile(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', form.name.trim());
    if (form.slug.trim()) fd.append('slug', form.slug.trim());
    if (form.description.trim()) fd.append('description', form.description.trim());
    if (logoFile) {
      fd.append('logo', logoFile);
    } else if (form.logoUrl.trim()) {
      fd.append('logoUrl', form.logoUrl.trim());
    }
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên thương hiệu');
    setSubmitting(true);
    try {
      if (editingBrand) {
        await api.put(`/brands/${editingBrand.BrandId}`, buildFormData());
        toast.success('Đã cập nhật thương hiệu');
      } else {
        await api.post('/brands', buildFormData());
        toast.success('Đã thêm thương hiệu mới');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVisibility = async (b) => {
    const show = !b.IsActive;
    setActionLoading(b.BrandId);
    try {
      await api.patch(`/brands/${b.BrandId}/visibility`, { isActive: show });
      toast.success(show ? 'Đã hiện thương hiệu' : 'Đã ẩn thương hiệu');
      load();
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/brands/${deleteTarget.BrandId}`);
      toast.success('Đã xóa thương hiệu');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Không thể xóa thương hiệu');
    } finally {
      setDeleting(false);
    }
  };

  const pg = dark ? 'bg-slate-950' : 'bg-slate-50';
  const txt3 = dark ? 'text-slate-400' : 'text-slate-500';
  const txt4 = dark ? 'text-slate-500' : 'text-slate-400';

  const filterBtnCls = (active) => active
    ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md shadow-sky-500/25'
    : dark
      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border border-slate-200';

  return (
    <div className={`${pg} min-h-screen px-4 sm:px-6 pb-12 space-y-8 transition-colors duration-300`}>

      {/* ══ HEADER ══ */}
      <AdminPageHeader
        hideTitle
        subtitle="Quản lý thương hiệu thiết bị y tế đang kinh doanh."
        badge={`${stats.total} thương hiệu`}
        actions={
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40 active:scale-95"
          >
            <Plus size={18} />
            Thêm thương hiệu
          </motion.button>
        }
      />

      {/* ══ STAT CARDS ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminStatCard
          title="Tổng Thương Hiệu"
          value={stats.total}
          icon={Layers}
          color="sky"
          growth={stats.totalGrowth}
          compareLabel="hiện tại"
          sparklineData={stats.totalSpark}
          index={0}
          to="/admin/brands"
        />
        <AdminStatCard
          title="Đang Hiển Thị"
          value={stats.active}
          icon={Eye}
          color="emerald"
          growth={stats.activeGrowth}
          compareLabel="hiện tại"
          sparklineData={stats.activeSpark}
          index={1}
          to="/admin/brands"
        />
        <AdminStatCard
          title="Đang Ẩn"
          value={stats.hidden}
          icon={EyeOff}
          color="orange"
          growth={stats.hiddenGrowth}
          compareLabel="hiện tại"
          sparklineData={stats.hiddenSpark}
          index={2}
          to="/admin/brands"
        />
      </div>

      {/* ══ SEARCH + FILTER ══ */}
      <div className={`${adminTheme.glassCard} p-4 sm:p-5`}>
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className={`flex flex-1 items-center gap-3 rounded-xl border px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-sky-400/30 ${
            dark ? 'border-slate-700 bg-slate-950/70 focus-within:border-sky-500/60' : 'border-slate-200 bg-slate-50 focus-within:border-sky-400'
          }`}>
            <Search size={16} className={`shrink-0 transition-colors ${search ? (dark ? 'text-sky-400' : 'text-sky-500') : txt4}`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm thương hiệu..."
              className={`flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal ${dark ? 'text-slate-100 placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'}`}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className={`shrink-0 rounded-lg p-0.5 transition ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                <XCircle size={15} />
              </button>
            )}
          </div>

          <div className={`hidden sm:block h-8 w-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />

          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'active', label: 'Hiện' },
              { key: 'hidden', label: 'Ẩn' },
            ].map((f) => (
              <motion.button
                whileTap={{ scale: 0.96 }}
                key={f.key}
                type="button"
                onClick={() => setFilterStatus(f.key)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${filterBtnCls(filterStatus === f.key)}`}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      
      <AdminPanel
        title="Danh Sách Thương Hiệu"
        subtitle="Thêm, sửa, ẩn/hiện thương hiệu thiết bị y tế"
        action={
          <span className={adminTheme.chip}>
            {filteredBrands.length} thương hiệu
          </span>
        }
      >
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} dark={dark} />)}
          </div>
        ) : filteredBrands.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <AnimatePresence>
              {filteredBrands.map((b) => (
                <BrandCard
                  key={b.BrandId}
                  b={b}
                  dark={dark}
                  actionLoading={actionLoading}
                  onEdit={openEdit}
                  onToggle={toggleVisibility}
                  onDelete={setDeleteTarget}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            dark={dark}
            icon={Building2}
            title={search || filterStatus !== 'all' ? 'Không tìm thấy thương hiệu' : 'Chưa có thương hiệu nào'}
            desc={search || filterStatus !== 'all' ? 'Thử đổi bộ lọc hoặc từ khóa tìm kiếm' : 'Bấm "Thêm thương hiệu" để bắt đầu'}
            onRefresh={search || filterStatus !== 'all' ? () => { setSearch(''); setFilterStatus('all'); } : undefined}
          />
        )}
      </AdminPanel>

      
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-[24px] border shadow-2xl p-6 sm:p-8 ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
                  {editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${dark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] ${txt3}`}>
                    Tên thương hiệu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="VD: Omron, Beurer, Philips..."
                    required
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 ${
                      dark ? 'border-slate-700 bg-slate-950/60 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] ${txt3}`}>
                    Slug (để trống sẽ tự tạo)
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="VD: omron"
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 ${
                      dark ? 'border-slate-700 bg-slate-950/60 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] ${txt3}`}>
                    Mô tả
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả ngắn về thương hiệu..."
                    className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 ${
                      dark ? 'border-slate-700 bg-slate-950/60 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] ${txt3}`}>
                    Logo thương hiệu
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={form.logoUrl}
                      onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                      placeholder="URL logo (tùy chọn)"
                      disabled={!!logoFile}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 disabled:opacity-50 ${
                        dark ? 'border-slate-700 bg-slate-950/60 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                      }`}
                    />
                    <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-sm transition hover:border-sky-400 hover:text-sky-500 ${
                      dark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'
                    }`}>
                      <Upload size={15} />
                      {logoFile ? logoFile.name.slice(0, 14) : 'Upload file'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  {(logoFile || form.logoUrl) && (
                    <div className={`mt-3 flex h-16 w-16 items-center justify-center rounded-2xl border overflow-hidden ${dark ? 'border-slate-700 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                      <img
                        src={logoFile ? URL.createObjectURL(logoFile) : getImageUrl(form.logoUrl)}
                        alt="preview"
                        className="h-full w-full object-contain p-1.5"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition ${
                      dark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Hủy
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? 'Đang lưu...' : editingBrand ? 'Lưu thay đổi' : 'Thêm thương hiệu'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Xóa thương hiệu"
        message="Bạn có chắc muốn xóa vĩnh viễn thương hiệu này? Nếu thương hiệu đang được gắn cho sản phẩm, thao tác sẽ bị từ chối."
        confirmLabel="Xóa vĩnh viễn"
      >
        {deleteTarget && (
          <div className="flex items-center gap-3 mt-2">
            <BrandLogo brand={deleteTarget} size={44} />
            <p className={`font-bold break-words ${dark ? 'text-white' : 'text-slate-900'}`}>{deleteTarget.Name}</p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}