import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Clock, Search, X, ArrowUp, ArrowDown, Trash2,
  Save, Package, Tag, Check,
} from 'lucide-react';
import api, { getImageUrl } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { adminTheme } from '../../components/ui/adminTheme';
import toast from 'react-hot-toast';

function SectionCard({ icon: Icon, title, subtitle, children, dark }) {
  return (
    <div className={`${adminTheme.glassCard} p-6 sm:p-8`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl
          ${dark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
          <Icon size={18} />
        </div>
        <div>
          <h2 className={`text-sm font-bold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h2>
          {subtitle && <p className={`text-xs mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// datetime-local input yêu cầu chuỗi local "YYYY-MM-DDTHH:mm", không phải ISO UTC
function toLocalInputValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CountdownPreview({ endTime, dark }) {
  const calc = () => {
    if (!endTime) return null;
    const diff = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
    return {
      d: Math.floor(diff / 86400),
      h: Math.floor((diff % 86400) / 3600),
      m: Math.floor((diff % 3600) / 60),
      s: diff % 60,
    };
  };
  const [time, setTime] = useState(calc());

  useEffect(() => {
    setTime(calc());
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [endTime]);

  if (!time) return null;

  return (
    <div className="flex gap-2">
      {[['Ngày', time.d], ['Giờ', time.h], ['Phút', time.m], ['Giây', time.s]].map(([label, value]) => (
        <div key={label} className={`rounded-2xl px-4 py-3 text-center ${dark ? 'bg-white/10' : 'bg-slate-900/90'}`}>
          <p className="text-xl font-black text-white">{String(value).padStart(2, '0')}</p>
          <p className="text-[10px] font-bold text-slate-300">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminFlashSale() {
  const { dark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [endTime, setEndTime] = useState('');
  const [items, setItems] = useState([]);
  const [savingEnd, setSavingEnd] = useState(false);
  const [savingItems, setSavingItems] = useState(false);

  const [search, setSearch] = useState('');
  const [productPool, setProductPool] = useState([]);
  const [poolLoading, setPoolLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(24);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/flash-sale');
      setEndTime(res.data?.endTime || '');
      setItems(res.data?.items || []);
    } catch {
      toast.error('Không tải được cấu hình Flash Sale');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Tải sẵn nhiều sản phẩm để duyệt & bấm chọn — không bắt buộc phải gõ tìm kiếm
  // Nếu có từ khóa thì lọc theo tên (debounce 350ms), không thì hiện danh sách mặc định
  useEffect(() => {
    setPoolLoading(true);
    const q = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
    const t = setTimeout(() => {
      api.get(`/admin/products?limit=100${q}`)
        .then((r) => { setProductPool(Array.isArray(r.data) ? r.data : []); setVisibleCount(24); })
        .catch(() => setProductPool([]))
        .finally(() => setPoolLoading(false));
    }, search.trim() ? 350 : 0);
    return () => clearTimeout(t);
  }, [search]);

  const pinnedIds = useMemo(() => new Set(items.map((i) => i.ProductId)), [items]);

  const addItem = (p) => {
    if (pinnedIds.has(p.ProductId)) return toast.error('Sản phẩm đã được ghim');
    setItems((prev) => [...prev, {
      ProductId: p.ProductId,
      Name: p.Name,
      Slug: p.Slug,
      Price: p.Price,
      SalePrice: p.SalePrice,
      PrimaryImage: p.primaryImage || p.PrimaryImage || p.images?.[0],
    }]);
    setSearch('');
    setSearchResults([]);
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.ProductId !== productId));
  };

  // Bấm vào ô sản phẩm trong lưới duyệt: chưa ghim thì ghim, đã ghim thì bỏ ghim luôn — khỏi phải nhớ thêm thao tác nào khác
  const toggleItem = (p) => {
    if (pinnedIds.has(p.ProductId)) {
      removeItem(p.ProductId);
    } else {
      setItems((prev) => [...prev, {
        ProductId: p.ProductId,
        Name: p.Name,
        Slug: p.Slug,
        Price: p.Price,
        SalePrice: p.SalePrice,
        PrimaryImage: p.primaryImage || p.PrimaryImage || p.images?.[0],
      }]);
    }
  };

  const moveItem = (index, dir) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const saveEndTime = async () => {
    if (!endTime) return toast.error('Vui lòng chọn thời gian kết thúc');
    setSavingEnd(true);
    try {
      await api.put('/admin/flash-sale/end', { endTime: new Date(endTime).toISOString() });
      toast.success('Đã lưu thời gian Flash Sale');
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setSavingEnd(false);
    }
  };

  const saveItems = async () => {
    setSavingItems(true);
    try {
      await api.put('/admin/flash-sale/items', { productIds: items.map((i) => i.ProductId) });
      toast.success('Đã lưu danh sách sản phẩm Flash Sale');
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setSavingItems(false);
    }
  };

  const pg = dark ? 'bg-slate-950' : 'bg-slate-50';
  const txt1 = dark ? 'text-slate-100' : 'text-slate-900';
  const txt3 = dark ? 'text-slate-400' : 'text-slate-500';

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${pg}`}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          <p className={`text-sm ${txt3}`}>Đang tải cấu hình Flash Sale...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${pg} min-h-screen px-4 sm:px-6 pb-12 space-y-6 transition-colors duration-300`}>
      <div className="pt-2">
        <AdminPageHeader
          hideTitle
          subtitle='Cài đặt thời gian đếm ngược và chọn sản phẩm hiển thị ở khu vực "Deal hôm nay" trang chủ.'
        />
      </div>

      {/* ══ Thời gian kết thúc ══ */}
      <SectionCard icon={Clock} title="Thời gian kết thúc Flash Sale" subtitle="Đồng hồ đếm ngược trên trang chủ sẽ chạy đến thời điểm này" dark={dark}>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col justify-center gap-3">
            <input
              type="datetime-local"
              value={toLocalInputValue(endTime)}
              onChange={(e) => setEndTime(e.target.value)}
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/30
                ${dark ? 'border-slate-700 bg-slate-950/60 text-slate-100 focus:border-sky-500' : 'border-slate-200 bg-white text-slate-900 focus:border-sky-500'}`}
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={saveEndTime}
              disabled={savingEnd}
              className="inline-flex w-fit items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 active:scale-95 disabled:opacity-60"
            >
              <Save size={15} />
              {savingEnd ? 'Đang lưu...' : 'Lưu thời gian'}
            </motion.button>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-primary-600 via-blue-600 to-slate-950 p-6 flex flex-col justify-center items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-100">Xem trước đếm ngược</p>
            <CountdownPreview endTime={endTime} dark={dark} />
          </div>
        </div>
      </SectionCard>

      {/* ══ Chọn sản phẩm ══ */}
      <SectionCard icon={Zap} title="Sản phẩm Flash Sale" subtitle="Tìm và ghim sản phẩm, kéo thứ tự bằng nút mũi tên" dark={dark}>
        {/* Thanh lọc nhanh (không bắt buộc) */}
        <div className="relative mb-5">
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-sky-400/30
            ${dark ? 'border-slate-700 bg-slate-950/70 focus-within:border-sky-500/60' : 'border-slate-200 bg-slate-50 focus-within:border-sky-400'}`}>
            <Search size={16} className={dark ? 'text-slate-500' : 'text-slate-400'} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Lọc theo tên (không bắt buộc) — hoặc bấm chọn trực tiếp bên dưới..."
              className={`flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal ${dark ? 'text-slate-100 placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'}`}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className={dark ? 'text-slate-500' : 'text-slate-400'}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Lưới duyệt sản phẩm — bấm để ghim, bấm lại để bỏ ghim */}
        <div className="mb-8">
          <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${txt3}`}>
            {search.trim() ? 'Kết quả lọc' : 'Tất cả sản phẩm'} — bấm để ghim / bỏ ghim
          </p>

          {poolLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`h-[132px] animate-pulse rounded-2xl border ${dark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-100'}`} />
              ))}
            </div>
          ) : productPool.length === 0 ? (
            <div className={`flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
              <Package size={24} className={dark ? 'text-slate-600' : 'text-slate-300'} />
              <p className={`text-sm ${txt3}`}>Không tìm thấy sản phẩm phù hợp</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {productPool.slice(0, visibleCount).map((p) => {
                  const pinned = pinnedIds.has(p.ProductId);
                  const img = p.primaryImage || p.PrimaryImage || p.images?.[0];
                  return (
                    <button
                      key={p.ProductId}
                      type="button"
                      onClick={() => toggleItem(p)}
                      className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition
                        ${pinned
                          ? 'border-sky-500 ring-2 ring-sky-500/30'
                          : dark ? 'border-slate-800 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className={`relative aspect-square w-full overflow-hidden ${dark ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
                        {img ? (
                          <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><Package size={20} className="text-slate-400" /></div>
                        )}
                        {pinned && (
                          <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className={`flex flex-1 flex-col gap-0.5 p-2.5 ${dark ? 'bg-slate-900/60' : 'bg-white'}`}>
                        <p className={`line-clamp-2 text-xs font-semibold leading-snug ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{p.Name}</p>
                        <p className="text-xs font-bold text-sky-500">
                          {Number(p.SalePrice || p.Price).toLocaleString('vi-VN')}₫
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {visibleCount < productPool.length && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((v) => v + 24)}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-bold transition
                      ${dark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Xem thêm sản phẩm ({productPool.length - visibleCount} sản phẩm nữa)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pinned list */}
        {items.length === 0 ? (
          <div className={`flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
            <Tag size={28} className={dark ? 'text-slate-600' : 'text-slate-300'} />
            <div>
              <p className={`font-bold ${txt1}`}>Chưa ghim sản phẩm nào</p>
              <p className={`mt-1 text-sm ${txt3}`}>Trang chủ sẽ tự động hiện sản phẩm đang giảm giá nhiều nhất</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {items.map((it, i) => (
                <motion.div
                  key={it.ProductId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${dark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black
                    ${dark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
                    {i + 1}
                  </span>
                  <div className={`h-11 w-11 shrink-0 rounded-xl overflow-hidden border ${dark ? 'border-slate-700 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                    {it.PrimaryImage ? (
                      <img src={getImageUrl(it.PrimaryImage)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><Package size={14} className="text-slate-400" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-semibold text-sm ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{it.Name}</p>
                    <p className={`text-xs ${txt3}`}>
                      {Number(it.SalePrice || it.Price).toLocaleString('vi-VN')}₫
                      {it.SalePrice && <span className="ml-1.5 line-through opacity-60">{Number(it.Price).toLocaleString('vi-VN')}₫</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" disabled={i === 0} onClick={() => moveItem(i, -1)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-30
                        ${dark ? 'border-slate-700 text-slate-400 hover:text-slate-100' : 'border-slate-200 text-slate-500 hover:text-slate-900'}`}>
                      <ArrowUp size={13} />
                    </button>
                    <button type="button" disabled={i === items.length - 1} onClick={() => moveItem(i, 1)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-30
                        ${dark ? 'border-slate-700 text-slate-400 hover:text-slate-100' : 'border-slate-200 text-slate-500 hover:text-slate-900'}`}>
                      <ArrowDown size={13} />
                    </button>
                    <button type="button" onClick={() => removeItem(it.ProductId)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition
                        ${dark ? 'text-rose-400 hover:bg-rose-500/15' : 'text-rose-500 hover:bg-rose-100'}`}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={saveItems}
          disabled={savingItems}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:opacity-90 active:scale-95 disabled:opacity-60"
        >
          <Save size={15} />
          {savingItems ? 'Đang lưu...' : 'Lưu danh sách sản phẩm'}
        </motion.button>
      </SectionCard>
    </div>
  );
}