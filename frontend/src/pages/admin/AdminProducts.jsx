import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Package,
  ChevronLeft, ChevronRight, AlertTriangle, ShoppingBag, TrendingUp, Tag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

import api, { getImageUrl } from '../../services/api';
import { formatPrice } from '../../utils/format';
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

/* ── animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  }),
};

const PRODUCTS_PER_PAGE = 8;

/* ════════════════════════════════════════
   MAIN
════════════════════════════════════════ */
export default function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch]               = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [tab, setTab]                     = useState('all'); // 'all' | 'bestseller' | 'sale'

  /* ── fetch ── */
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products');
      setProducts(res.data || []);
    } catch {
      toast.error('Không tải được sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, tab]);

  /* ── derived ── */
  const searchFiltered = useMemo(() => {
    const kw = search.toLowerCase().trim();
    if (!kw) return products;
    return products.filter(
      (p) => p.Name?.toLowerCase().includes(kw) || p.BrandName?.toLowerCase().includes(kw),
    );
  }, [products, search]);

  const isOnSale = (p) => p.SalePrice != null && Number(p.SalePrice) < Number(p.Price);

  const tabCounts = useMemo(() => ({
    all: searchFiltered.length,
    bestseller: searchFiltered.filter((p) => p.IsPopular).length,
    sale: searchFiltered.filter(isOnSale).length,
  }), [searchFiltered]);

  const filteredProducts = useMemo(() => {
    if (tab === 'bestseller') return searchFiltered.filter((p) => p.IsPopular);
    if (tab === 'sale') return searchFiltered.filter(isOnSale);
    return searchFiltered;
  }, [searchFiltered, tab]);

  const totalPages   = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex   = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const currentItems = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  const stats = useMemo(() => {
    const active   = products.filter((p) => p.IsActive).length;
    const hidden   = products.filter((p) => !p.IsActive).length;
    const lowStock = products.filter((p) => p.Stock <= 5).length;
    return { total: products.length, active, hidden, lowStock };
  }, [products]);

  /* build mini sparkline from stock data for visual variety */
  const sparklines = useMemo(() => {
    const base = (seed) =>
      Array.from({ length: 7 }, (_, i) => Math.max(1, Math.round(seed + Math.sin(i + seed) * (seed * 0.3))));
    return {
      total:    base(stats.total   || 10),
      active:   base(stats.active  || 8),
      hidden:   base(stats.hidden  || 3),
      lowStock: base(stats.lowStock|| 2),
    };
  }, [stats]);

  /* ── actions ── */
  const openCreate = () => navigate('/admin/products/create');
  const openEdit   = (p) => navigate(`/admin/products/edit/${p.ProductId}`);

  const toggleVisibility = async (p) => {
    const show = !p.IsActive;
    setActionLoading(p.ProductId);
    try {
      const res = await api.patch(`/products/${p.ProductId}/visibility`, { isActive: show });
      toast.success(res.message || (show ? 'Đã hiện sản phẩm' : 'Đã ẩn sản phẩm'));
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/products/${deleteTarget.ProductId}`);
      toast.success(res.message || 'Đã xóa sản phẩm');
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e.message || 'Không thể xóa sản phẩm');
    } finally {
      setDeleting(false);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.push(i);
    }
    return pages;
  };

  /* ── skeleton ── */
  if (loading) return <ProductsSkeleton />;

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="space-y-8 px-4 sm:px-6 pb-12 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="pt-2">
        <AdminPageHeader
          hideTitle
          subtitle="Quản lý danh sách sản phẩm, trạng thái hiển thị và tồn kho."
          badge={`${stats.total} sản phẩm`}
        />
      </motion.div>

      {/* ══ STAT CARDS (AdminStatCard — identical to Dashboard) ══ */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="visible" custom={1}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <AdminStatCard
          index={0}
          title="Đang Bán"
          value={stats.active}
          icon={ShoppingBag}
          color="green"
          growth={2.1}
          compareLabel="tháng trước"
          sparklineData={sparklines.active}
          to="/admin/products?filter=active"
        />
        <AdminStatCard
          index={1}
          title="Đã Ẩn"
          value={stats.hidden}
          icon={EyeOff}
          color="amber"
          growth={-0.5}
          compareLabel="tháng trước"
          sparklineData={sparklines.hidden}
        />
        <AdminStatCard
          index={2}
          title="Tồn Kho Thấp"
          value={stats.lowStock}
          icon={AlertTriangle}
          color="orange"
          growth={-6.8}
          compareLabel="ngày trước"
          sparklineData={sparklines.lowStock}
          to="/admin/products?filter=lowstock"
        />
        <AdminStatCard
          index={3}
          title="Tổng Sản Phẩm"
          value={stats.total}
          icon={Package}
          color="purple"
          growth={1.4}
          compareLabel="tháng trước"
          sparklineData={sparklines.total}
        />
      </motion.div>

      {/* ══ TOOLBAR ══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
        <AdminListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Tìm sản phẩm, thương hiệu..."
          actions={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40 active:scale-95 sm:w-auto"
            >
              <Plus size={18} />
              Thêm sản phẩm
            </button>
          }
        />
      </motion.div>

      {/* ══ FILTER TABS: Tất cả / Bán chạy nhất / Đang sale ══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2.5} className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tất cả sản phẩm', icon: Package },
          { key: 'bestseller', label: 'Bán chạy nhất', icon: TrendingUp },
          { key: 'sale', label: 'Đang sale', icon: Tag },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all ${
                active
                  ? 'border-transparent bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05]'
              }`}
            >
              <t.icon size={15} />
              {t.label}
              <span
                className={`rounded-lg px-1.5 py-0.5 text-[10px] font-black ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400'
                }`}
              >
                {tabCounts[t.key]}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ══ MOBILE CARDS ══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="space-y-3 md:hidden">
        {currentItems.length === 0 ? (
          <EmptyState />
        ) : (
          currentItems.map((p, i) => (
            <motion.div key={p.ProductId} variants={fadeUp} initial="hidden" animate="visible" custom={i * 0.3 + 3}>
              <AdminMobileCard className={!p.IsActive ? 'opacity-60' : ''}>
                <div className="flex gap-3">
                  <img
                    src={getImageUrl(p.PrimaryImage)}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl border border-slate-200/80 dark:border-white/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-bold text-slate-900 dark:text-white">{p.Name}</p>
                    {p.BrandName && <p className="text-xs text-slate-500 dark:text-slate-400">{p.BrandName}</p>}
                    <p className="mt-1 font-black text-sky-500">{formatPrice(p.SalePrice || p.Price)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StockLabel stock={p.Stock} />
                      <StatusBadge active={p.IsActive} />
                    </div>
                  </div>
                </div>
                <AdminMobileActions>
                  <AdminMobileActionButton variant="primary" onClick={() => openEdit(p)}>
                    <Pencil size={14} /> Sửa
                  </AdminMobileActionButton>
                  <AdminMobileActionButton
                    variant="warning"
                    disabled={actionLoading === p.ProductId}
                    onClick={() => toggleVisibility(p)}
                  >
                    {p.IsActive ? <EyeOff size={15} /> : <Eye size={15} />}
                  </AdminMobileActionButton>
                  <AdminMobileActionButton variant="danger" onClick={() => setDeleteTarget(p)}>
                    <Trash2 size={15} />
                  </AdminMobileActionButton>
                </AdminMobileActions>
              </AdminMobileCard>
            </motion.div>
          ))
        )}
        <AdminMobilePagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </motion.div>

      {/* ══ DESKTOP TABLE ══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="hidden md:block">
        <div className="admin-card overflow-hidden rounded-[24px] bg-white/90 dark:bg-[#111827]/70 border border-slate-200/60 dark:border-white/[0.08] shadow-xl shadow-slate-100 dark:shadow-black/40 backdrop-blur-xl">

          {/* panel header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Danh Sách Sản Phẩm</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {filteredProducts.length} sản phẩm{search ? ` khớp "${search}"` : ''}
              </p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              {currentPage} / {totalPages || 1}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-500">
                  {['Sản phẩm', 'Giá', 'Kho', 'Trạng thái', 'Thao tác'].map((h, i) => (
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
                  currentItems.map((p, i) => (
                    <motion.tr
                      key={p.ProductId}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={i * 0.15 + 0.5}
                      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.03] ${!p.IsActive ? 'opacity-55' : ''}`}
                    >
                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={getImageUrl(p.PrimaryImage)}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-2xl border border-slate-200/80 dark:border-white/10 object-cover shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">{p.Name}</p>
                            {p.BrandName && (
                              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{p.BrandName}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-sky-500">{formatPrice(p.SalePrice || p.Price)}</p>
                        {p.SalePrice && (
                          <p className="mt-0.5 text-xs line-through text-slate-400">{formatPrice(p.Price)}</p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4">
                        <StockLabel stock={p.Stock} />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge active={p.IsActive} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <ActionBtn
                            onClick={() => openEdit(p)}
                            title="Sửa"
                            cls="bg-sky-100/90 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-200/80 dark:hover:bg-sky-500/20 border-sky-100 dark:border-sky-500/20"
                          >
                            <Pencil size={15} />
                          </ActionBtn>

                          <ActionBtn
                            onClick={() => toggleVisibility(p)}
                            disabled={actionLoading === p.ProductId}
                            title={p.IsActive ? 'Ẩn' : 'Hiện'}
                            cls={p.IsActive
                              ? 'bg-amber-100/90 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-200/80 dark:hover:bg-amber-500/20 border-amber-100 dark:border-amber-500/20'
                              : 'bg-emerald-100/90 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200/80 dark:hover:bg-emerald-500/20 border-emerald-100 dark:border-emerald-500/20'}
                          >
                            {actionLoading === p.ProductId ? (
                              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            ) : p.IsActive ? (
                              <EyeOff size={15} />
                            ) : (
                              <Eye size={15} />
                            )}
                          </ActionBtn>

                          <ActionBtn
                            onClick={() => setDeleteTarget(p)}
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
                Hiển thị {startIndex + 1}–{Math.min(startIndex + PRODUCTS_PER_PAGE, filteredProducts.length)} / {filteredProducts.length}
              </p>
              <div className="flex items-center gap-1.5">
                <PageBtn
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </PageBtn>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 rounded-xl text-sm font-bold transition-all ${
                      currentPage === page
                        ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30'
                        : 'border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <PageBtn
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </PageBtn>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ══ CONFIRM DELETE ══ */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Xóa sản phẩm"
        message="Bạn có chắc muốn xóa vĩnh viễn sản phẩm này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa vĩnh viễn"
      >
        <p className="font-bold text-slate-900 dark:text-white break-words">{deleteTarget?.Name}</p>
      </ConfirmDialog>
    </div>
  );
}

/* ── SmartCountUp (mirrors AdminStatCard's SmartCountUp) ── */
function SmartCountUp({ value, duration = 1.0 }) {
  const ref   = useRef(null);
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => Math.round(v).toLocaleString('vi-VN'));

  useEffect(() => {
    if (!value) return;
    const ctrl = animate(count, value, { duration, ease: 'easeOut' });
    return ctrl.stop;
  }, [value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ── sub-components ── */
function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold ${
      active
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
    }`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {active ? 'Đang bán' : 'Đã ẩn'}
    </span>
  );
}

function StockLabel({ stock }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${
      stock <= 5 ? 'text-red-500 dark:text-red-400' : stock <= 20 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
    }`}>
      {stock}
      {stock <= 5 && (
        <span className="text-[10px] rounded-md px-1.5 py-0.5 font-semibold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
          Thấp
        </span>
      )}
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
        <Package size={28} className="text-slate-300 dark:text-slate-600" />
      </div>
      <div className="text-center">
        <p className="font-bold text-slate-700 dark:text-slate-300">Không tìm thấy sản phẩm</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Thử tìm kiếm với từ khóa khác</p>
      </div>
    </div>
  );
}

function ProductsSkeleton() {
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