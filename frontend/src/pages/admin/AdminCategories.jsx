import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Layers, ImageOff,
  Image as ImageIcon, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

import api, { getImageUrl } from '../../services/api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AdminListToolbar, {
  AdminMobileActionButton,
  AdminMobileActions,
  AdminMobileCard,
} from '../../components/admin/AdminListToolbar';
import AdminMobilePagination from '../../components/admin/AdminMobilePagination';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import toast from 'react-hot-toast';

/* ── animation variants (mirrors AdminProducts) ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  }),
};

const CATEGORIES_PER_PAGE = 8;

const isCatActive = (c) => c.IsActive !== false && c.IsActive !== 0;

/* ════════════════════════════════════════
   MAIN
════════════════════════════════════════ */
export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [visibilityTarget, setVisibilityTarget]           = useState(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ── fetch ── */
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories?active=false');
      setCategories(res.data || []);
    } catch {
      toast.error('Không tải được danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  /* ── derived ── */
  const filtered = useMemo(
    () => categories.filter((c) => c.Name?.toLowerCase().includes(search.toLowerCase().trim())),
    [categories, search],
  );

  const totalPages   = Math.max(1, Math.ceil(filtered.length / CATEGORIES_PER_PAGE));
  const startIndex   = (page - 1) * CATEGORIES_PER_PAGE;
  const currentItems = filtered.slice(startIndex, startIndex + CATEGORIES_PER_PAGE);

  const stats = useMemo(() => {
    const active  = categories.filter(isCatActive).length;
    const noImage = categories.filter((c) => !c.Image).length;
    return { total: categories.length, active, hidden: categories.length - active, noImage };
  }, [categories]);

  /* build mini sparklines for visual variety, mirrors AdminProducts */
  const sparklines = useMemo(() => {
    const base = (seed) =>
      Array.from({ length: 7 }, (_, i) => Math.max(1, Math.round(seed + Math.sin(i + seed) * (seed * 0.3))));
    return {
      total:   base(stats.total   || 10),
      active:  base(stats.active  || 8),
      hidden:  base(stats.hidden  || 3),
      noImage: base(stats.noImage || 2),
    };
  }, [stats]);

  /* ── navigation helpers ── */
  const openCreate = () => navigate('/admin/categories/create');
  const openEdit = (c) => navigate(`/admin/categories/edit/${c.CategoryId}`);

  /* ── actions ── */
  const confirmToggleVisibility = async () => {
    if (!visibilityTarget) return;
    setActionLoading(true);
    try {
      const nextActive = !isCatActive(visibilityTarget);
      await api.patch(`/categories/${visibilityTarget.CategoryId}/visibility`, { isActive: nextActive });
      toast.success(nextActive ? 'Đã hiện danh mục' : 'Đã ẩn danh mục');
      setVisibilityTarget(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmPermanentDelete = async () => {
    if (!permanentDeleteTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/categories/${permanentDeleteTarget.CategoryId}`);
      toast.success('Đã xóa vĩnh viễn danh mục');
      setPermanentDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      pages.push(i);
    }
    return pages;
  };

  /* ── skeleton ── */
  if (loading) return <CategoriesSkeleton />;

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="space-y-8 px-4 sm:px-6 pb-12 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="pt-2">
        <AdminPageHeader
          hideTitle
          subtitle="Quản lý danh sách danh mục, trạng thái hiển thị và hình ảnh đại diện."
          badge={`${stats.total} danh mục`}
        />
      </motion.div>

      {/* ══ STAT CARDS (AdminStatCard — identical to Products/Dashboard) ══ */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="visible" custom={1}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <AdminStatCard
          index={0}
          title="Đang Hiển Thị"
          value={stats.active}
          icon={Eye}
          color="green"
          growth={1.8}
          compareLabel="tháng trước"
          sparklineData={sparklines.active}
        />
        <AdminStatCard
          index={1}
          title="Đã Ẩn"
          value={stats.hidden}
          icon={EyeOff}
          color="amber"
          growth={-0.4}
          compareLabel="tháng trước"
          sparklineData={sparklines.hidden}
        />
        <AdminStatCard
          index={2}
          title="Thiếu Ảnh"
          value={stats.noImage}
          icon={ImageOff}
          color="orange"
          growth={-3.2}
          compareLabel="tháng trước"
          sparklineData={sparklines.noImage}
        />
        <AdminStatCard
          index={3}
          title="Tổng Danh Mục"
          value={stats.total}
          icon={Layers}
          color="purple"
          growth={2.6}
          compareLabel="tháng trước"
          sparklineData={sparklines.total}
        />
      </motion.div>

      {/* ══ TOOLBAR ══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
        <AdminListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Tìm kiếm danh mục..."
          actions={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40 active:scale-95 sm:w-auto"
            >
              <Plus size={18} />
              Thêm danh mục
            </button>
          }
        />
      </motion.div>

      {/* ══ MOBILE CARDS ══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="space-y-3 md:hidden">
        {currentItems.length === 0 ? (
          <EmptyState />
        ) : (
          currentItems.map((c, i) => (
            <motion.div key={c.CategoryId} variants={fadeUp} initial="hidden" animate="visible" custom={i * 0.3 + 3}>
              <AdminMobileCard className={!isCatActive(c) ? 'opacity-60' : ''}>
                <div className="flex gap-3">
                  <img
                    src={getImageUrl(c.Image)}
                    alt=""
                    className="h-16 w-20 shrink-0 rounded-xl border border-slate-200/80 dark:border-white/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-bold text-slate-900 dark:text-white">{c.Name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{c.Description || '—'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">#{c.SortOrder}</span>
                      <StatusBadge active={isCatActive(c)} />
                    </div>
                  </div>
                </div>
                <AdminMobileActions>
                  <AdminMobileActionButton variant="primary" onClick={() => openEdit(c)}>
                    <Pencil size={14} /> Sửa
                  </AdminMobileActionButton>
                  <AdminMobileActionButton variant="warning" onClick={() => setVisibilityTarget(c)}>
                    {isCatActive(c) ? <EyeOff size={15} /> : <Eye size={15} />}
                  </AdminMobileActionButton>
                  <AdminMobileActionButton variant="danger" onClick={() => setPermanentDeleteTarget(c)}>
                    <Trash2 size={15} />
                  </AdminMobileActionButton>
                </AdminMobileActions>
              </AdminMobileCard>
            </motion.div>
          ))
        )}
        <AdminMobilePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </motion.div>

      {/* ══ DESKTOP TABLE ══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="hidden md:block">
        <div className="admin-card overflow-hidden rounded-[24px] bg-white/90 dark:bg-[#111827]/70 border border-slate-200/60 dark:border-white/[0.08] shadow-xl shadow-slate-100 dark:shadow-black/40 backdrop-blur-xl">

          {/* panel header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Danh Sách Danh Mục</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {filtered.length} danh mục{search ? ` khớp "${search}"` : ''}
              </p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              {page} / {totalPages || 1}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-500">
                  {['Danh mục', 'Slug', 'Thứ tự', 'Trạng thái', 'Thao tác'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] ${i === 4 ? 'text-center' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <EmptyState inline />
                    </td>
                  </tr>
                ) : (
                  currentItems.map((c, i) => (
                    <motion.tr
                      key={c.CategoryId}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={i * 0.15 + 0.5}
                      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.03] ${!isCatActive(c) ? 'opacity-55' : ''}`}
                    >
                      {/* Category */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={getImageUrl(c.Image)}
                            alt=""
                            className="h-14 w-20 shrink-0 rounded-2xl border border-slate-200/80 dark:border-white/10 object-cover shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">{c.Name}</p>
                            <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                              {c.Description || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-6 py-4">
                        <code className="text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg">
                          {c.Slug}
                        </code>
                      </td>

                      {/* Sort order */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">#{c.SortOrder}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge active={isCatActive(c)} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <ActionBtn
                            onClick={() => openEdit(c)}
                            title="Sửa"
                            cls="bg-sky-100/90 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-200/80 dark:hover:bg-sky-500/20 border-sky-100 dark:border-sky-500/20"
                          >
                            <Pencil size={15} />
                          </ActionBtn>

                          <ActionBtn
                            onClick={() => setVisibilityTarget(c)}
                            title={isCatActive(c) ? 'Ẩn' : 'Hiện'}
                            cls={isCatActive(c)
                              ? 'bg-amber-100/90 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-200/80 dark:hover:bg-amber-500/20 border-amber-100 dark:border-amber-500/20'
                              : 'bg-emerald-100/90 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200/80 dark:hover:bg-emerald-500/20 border-emerald-100 dark:border-emerald-500/20'}
                          >
                            {isCatActive(c) ? <EyeOff size={15} /> : <Eye size={15} />}
                          </ActionBtn>

                          <ActionBtn
                            onClick={() => setPermanentDeleteTarget(c)}
                            title="Xóa"
                            cls="bg-rose-100/90 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-200/80 dark:hover:bg-rose-500/20 border-rose-100 dark:border-rose-500/20"
                          >
                            <Trash2 size={15} />
                          </ActionBtn>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/[0.06]">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Hiển thị {startIndex + 1}–{Math.min(startIndex + CATEGORIES_PER_PAGE, filtered.length)} / {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <PageBtn onClick={() => setPage(page - 1)} disabled={page === 1}>
                  <ChevronLeft size={16} />
                </PageBtn>

                {getPageNumbers().map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-9 w-9 rounded-xl text-sm font-bold transition-all ${
                      page === p
                        ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30'
                        : 'border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <PageBtn onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                  <ChevronRight size={16} />
                </PageBtn>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ══ CONFIRM TOGGLE VISIBILITY ══ */}
      <ConfirmDialog
        open={!!visibilityTarget}
        onClose={() => setVisibilityTarget(null)}
        onConfirm={confirmToggleVisibility}
        loading={actionLoading}
        title={visibilityTarget && isCatActive(visibilityTarget) ? 'Ẩn danh mục' : 'Hiện danh mục'}
        message={visibilityTarget && isCatActive(visibilityTarget)
          ? 'Danh mục sẽ được ẩn khỏi cửa hàng. Bạn có thể bật lại bất cứ lúc nào.'
          : 'Danh mục sẽ hiển thị lại trên cửa hàng.'}
        confirmLabel={visibilityTarget && isCatActive(visibilityTarget) ? 'Ẩn danh mục' : 'Hiện danh mục'}
      >
        <p className="font-bold text-slate-900 dark:text-white break-words">{visibilityTarget?.Name}</p>
      </ConfirmDialog>

      {/* ══ CONFIRM DELETE ══ */}
      <ConfirmDialog
        open={!!permanentDeleteTarget}
        onClose={() => setPermanentDeleteTarget(null)}
        onConfirm={confirmPermanentDelete}
        loading={actionLoading}
        title="Xóa vĩnh viễn danh mục"
        message="Danh mục sẽ bị xóa hoàn toàn khỏi hệ thống. Chỉ xóa khi danh mục không còn sản phẩm."
        confirmLabel="Xóa vĩnh viễn"
      >
        <p className="font-bold text-slate-900 dark:text-white break-words">{permanentDeleteTarget?.Name}</p>
      </ConfirmDialog>
    </div>
  );
}

/* ── SmartCountUp (mirrors AdminStatCard's SmartCountUp) ── */
function SmartCountUp({ value, duration = 1.0 }) {
  const ref     = useRef(null);
  const count   = useMotionValue(0);
  const display = useTransform(count, (v) => Math.round(v).toLocaleString('vi-VN'));

  useEffect(() => {
    if (!value) return;
    const ctrl = animate(count, value, { duration, ease: 'easeOut' });
    return ctrl.stop;
  }, [value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ── sub-components (mirror AdminProducts' style) ── */
function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold ${
      active
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
    }`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {active ? 'Hiển thị' : 'Đã ẩn'}
    </span>
  );
}

function ActionBtn({ children, onClick, disabled, title, cls }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all disabled:opacity-40 ${cls}`}
    >
      {children}
    </button>
  );
}

function PageBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {children}
    </button>
  );
}

function EmptyState({ inline = false }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${!inline ? 'rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-10' : ''}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-white/[0.05]">
        <Layers size={28} className="text-slate-300 dark:text-slate-600" />
      </div>
      <div className="text-center">
        <p className="font-bold text-slate-700 dark:text-slate-300">Không tìm thấy danh mục</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Thử tìm kiếm với từ khóa khác</p>
      </div>
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="animate-pulse space-y-8 px-4 sm:px-6 pb-12 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col gap-2 pt-2">
        <div className="h-10 w-56 rounded-2xl bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-40 rounded-2xl bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 rounded-[24px] bg-slate-200 dark:bg-white/10" />
        ))}
      </div>
      <div className="h-[520px] rounded-[24px] bg-slate-200 dark:bg-white/10" />
    </div>
  );
}