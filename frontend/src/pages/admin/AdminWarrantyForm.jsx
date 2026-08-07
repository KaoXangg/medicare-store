import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronRight, ChevronLeft, ChevronDown, Search, Phone, User,
  Package, ShoppingBag, CheckCircle2, StickyNote, Save, ShieldOff, ShieldCheck,
  Calendar, Loader2, PackageSearch, History, Store,
} from 'lucide-react';
import api, { getImageUrl } from '../../services/api';
import { formatPrice } from '../../utils/format';
import { adminTheme } from '../../components/ui/adminTheme';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(dateStr, months) {
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function DateField({ label, value, onChange, min, icon: Icon = Calendar }) {
  const { dark } = useTheme();
  const today = new Date();
  const currentYear = today.getFullYear();
  const years = [];
  for (let y = currentYear + 5; y >= currentYear - 15; y--) years.push(y);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [viewYear, setViewYear] = useState(() => (value ? new Date(`${value}T00:00:00`).getFullYear() : currentYear));
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(`${value}T00:00:00`).getMonth() : today.getMonth()));
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const openPicker = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 8, left: rect.left });
    if (value) {
      const d = new Date(`${value}T00:00:00`);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      const insideBtn = btnRef.current && btnRef.current.contains(e.target);
      const insidePop = popRef.current && popRef.current.contains(e.target);
      if (!insideBtn && !insidePop) setOpen(false);
    };
    const onScrollOrResize = () => setOpen(false);
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const dayStr = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const shiftMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const selectDay = (d) => {
    onChange(dayStr(d));
    setOpen(false);
  };

  const displayLabel = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</label>
      <div className="relative">
        <Icon size={15} className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400" />
        <button
          ref={btnRef}
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          className={`h-11 w-full rounded-xl border pl-10 pr-4 text-left text-sm font-semibold transition ${
            dark ? 'border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-600' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300'
          } focus:outline-none focus:ring-2 focus:ring-sky-400/30`}
        >
          {displayLabel || <span className="text-slate-400">Chọn ngày</span>}
        </button>
      </div>

      {open && pos && createPortal(
        <motion.div
          ref={popRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          style={{ position: 'fixed', zIndex: 200, top: pos.top, left: pos.left }}
          className={`w-72 rounded-2xl border p-3 shadow-2xl ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <button type="button" onClick={() => shiftMonth(-1)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">
              <ChevronLeft size={14} />
            </button>
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className={`h-7 flex-1 min-w-0 rounded-lg border px-1 text-xs font-bold focus:outline-none ${dark ? 'border-slate-700 bg-slate-950 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}
            >
              {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>Tháng {i + 1}</option>)}
            </select>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className={`h-7 rounded-lg border px-1 text-xs font-bold focus:outline-none ${dark ? 'border-slate-700 bg-slate-950 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" onClick={() => shiftMonth(1)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((w) => (
              <span key={w} className="text-center text-[10px] font-bold text-slate-400">{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <span key={i} />;
              const ds = dayStr(d);
              const disabled = min ? ds < min : false;
              const isSelected = ds === value;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(d)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                      : disabled
                        ? 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}

function WarrantyCertificateCard({ productName, code, customerName, expiryDate, status = 'pending' }) {
  const remain = expiryDate ? Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const statusMeta = {
    active: { label: 'Còn hiệu lực', dot: 'bg-emerald-400' },
    expired: { label: 'Đã hết hạn', dot: 'bg-amber-400' },
    void: { label: 'Đã thu hồi', dot: 'bg-slate-400' },
    pending: { label: 'Còn hiệu lực', dot: 'bg-emerald-400' },
  }[status] || { label: 'Còn hiệu lực', dot: 'bg-emerald-400' };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 p-6 text-white shadow-2xl shadow-blue-900/30">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15">
            <ShieldCheck size={16} strokeWidth={2.4} />
          </span>
          <span className="text-base font-black tracking-tight">MediCare</span>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full border border-white/30">
          <ShieldCheck size={17} />
        </span>
      </div>

      <p className="relative mt-6 truncate text-sm font-bold uppercase tracking-wide text-sky-100">
        {productName || 'Tên sản phẩm'}
      </p>
      <p className="relative mt-1 break-all font-mono text-xl font-black tracking-wider">
        {code || 'MC-WR-••••••••'}
      </p>
      <p className="relative mt-1 text-sm font-semibold text-sky-100">{customerName || 'Tên khách hàng'}</p>

      <div className="relative mt-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-200/80">Hết hạn</p>
          <p className="text-base font-black">
            {expiryDate ? new Date(`${expiryDate}T00:00:00`).toLocaleDateString('vi-VN') : '--/--/----'}
          </p>
          {remain != null && (
            <p className="text-xs font-semibold text-sky-100">
              {remain > 0 ? `Còn ${remain} ngày` : remain === 0 ? 'Hết hạn hôm nay' : 'Đã hết hạn'}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-200/80">Trạng thái</p>
          <p className="flex items-center justify-end gap-1.5 text-sm font-black">
            <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </p>
        </div>
      </div>
    </div>
  );
}

function SourceTabs({ mode, setMode, dark }) {
  const tabs = [
    { key: 'purchased', label: 'Khách đã mua', icon: History },
    { key: 'catalog', label: 'Kho sản phẩm', icon: Store },
  ];
  return (
    <div className={`flex gap-1 rounded-2xl p-1 ${dark ? 'bg-slate-900' : 'bg-slate-100/80'}`}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setMode(t.key)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all ${
            mode === t.key
              ? dark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
              : dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <t.icon size={15} /> {t.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminWarrantyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { dark } = useTheme();
  const isEdit = !!id;
  const existing = location.state?.warranty || null;

  const [saving, setSaving] = useState(false);
  const [createdWarranty, setCreatedWarranty] = useState(null);
  const [sourceMode, setSourceMode] = useState('purchased');

  const [phoneQuery, setPhoneQuery] = useState(existing?.Phone || '');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState([]);

  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogResults, setCatalogResults] = useState([]);

  const [form, setForm] = useState({
    customerName: existing?.CustomerName || '',
    phone: existing?.Phone || '',
    productId: existing?.ProductId || null,
    productName: existing?.ProductName || '',
    orderId: existing?.OrderId || null,
    purchaseDate: existing?.PurchaseDate ? String(existing.PurchaseDate).slice(0, 10) : '',
    expiryDate: existing?.ExpiryDate ? String(existing.ExpiryDate).slice(0, 10) : '',
    notes: existing?.Notes || '',
  });

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    if (isEdit && !existing) {
      toast.error('Không có dữ liệu phiếu — vui lòng vào từ danh sách bảo hành');
    }
  }, []);

  const lookupPurchases = async () => {
    const trimmed = phoneQuery.replace(/[^\d]/g, '');
    if (trimmed.length < 8) {
      toast.error('Nhập số điện thoại hợp lệ');
      return;
    }
    setLookupLoading(true);
    setLookupDone(false);
    try {
      const res = await api.get('/orders?limit=500');
      const matched = (res.data || []).filter((o) => (o.CustomerPhone || '').replace(/[^\d]/g, '') === trimmed);
      const items = [];
      matched.forEach((o) => {
        (o.items || []).forEach((it) => {
          items.push({
            key: `${o.OrderId}-${it.ProductId || it.OrderDetailId}`,
            orderId: o.OrderId,
            orderCode: o.OrderCode,
            purchaseDate: o.CreatedAt,
            productId: it.ProductId || null,
            productName: it.ProductName,
            image: it.ProductImage || it.Image,
            customerName: o.CustomerName,
          });
        });
      });
      items.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
      setPurchasedItems(items);
      if (items.length && !form.customerName) {
        setForm((f) => ({ ...f, customerName: matched[0].CustomerName, phone: phoneQuery }));
      } else {
        setForm((f) => ({ ...f, phone: phoneQuery }));
      }
      if (!items.length) toast('Không tìm thấy đơn hàng nào với số này', { icon: 'ℹ️' });
    } catch (e) {
      toast.error(e.message || 'Lỗi tra cứu');
    } finally {
      setLookupLoading(false);
      setLookupDone(true);
    }
  };

  const pickPurchasedItem = (item) => {
    setForm((f) => ({
      ...f,
      customerName: item.customerName || f.customerName,
      phone: phoneQuery || f.phone,
      productId: item.productId,
      productName: item.productName,
      orderId: item.orderId,
      purchaseDate: item.purchaseDate ? String(item.purchaseDate).slice(0, 10) : f.purchaseDate,
      expiryDate: f.expiryDate || addMonths(String(item.purchaseDate).slice(0, 10), 12),
    }));
    toast.success('Đã chọn sản phẩm');
  };

  useEffect(() => {
    if (sourceMode !== 'catalog' || !catalogQuery.trim()) { setCatalogResults([]); return; }
    setCatalogLoading(true);
    const t = setTimeout(() => {
      api.get(`/products?search=${encodeURIComponent(catalogQuery.trim())}&limit=10`)
        .then((r) => setCatalogResults(r.data || []))
        .catch(() => setCatalogResults([]))
        .finally(() => setCatalogLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [catalogQuery, sourceMode]);

  const pickCatalogProduct = (p) => {
    setForm((f) => ({
      ...f,
      productId: p.ProductId,
      productName: p.Name,
      orderId: null,
      purchaseDate: f.purchaseDate || todayStr(),
      expiryDate: f.expiryDate || addMonths(f.purchaseDate || todayStr(), 12),
    }));
    toast.success('Đã chọn sản phẩm');
  };

  const canSubmit = form.customerName.trim() && form.phone.trim() && form.productName.trim() && form.purchaseDate && form.expiryDate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/warranties/${id}`, {
          customerName: form.customerName,
          phone: form.phone,
          productName: form.productName,
          purchaseDate: form.purchaseDate,
          expiryDate: form.expiryDate,
          notes: form.notes,
        });
        toast.success('Đã cập nhật phiếu bảo hành');
      } else {
        const res = await api.post('/warranties', {
          customerName: form.customerName,
          phone: form.phone,
          productId: form.productId,
          productName: form.productName,
          orderId: form.orderId,
          purchaseDate: form.purchaseDate,
          expiryDate: form.expiryDate,
          notes: form.notes,
        });
        toast.success('Đã tạo phiếu bảo hành');
        setCreatedWarranty(res.data || {
          ProductName: form.productName,
          CustomerName: form.customerName,
          ExpiryDate: form.expiryDate,
        });
        return; // dừng ở đây để hiện modal phiếu, không điều hướng ngay
      }
      navigate('/admin/warranties');
    } catch (e2) {
      toast.error(e2.message || 'Lỗi lưu phiếu bảo hành');
    } finally {
      setSaving(false);
    }
  };

  const toggleVoid = async () => {
    if (!isEdit) return;
    const nextStatus = existing?.Status === 'void' ? 'active' : 'void';
    setSaving(true);
    try {
      await api.put(`/warranties/${id}`, { status: nextStatus });
      toast.success(nextStatus === 'void' ? 'Đã thu hồi phiếu bảo hành' : 'Đã khôi phục phiếu bảo hành');
      navigate('/admin/warranties');
    } catch (e) {
      toast.error(e.message || 'Lỗi cập nhật trạng thái');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={adminTheme.page}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/warranties')}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition ${
              dark ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Link to="/admin/warranties" className="hover:underline">Bảo hành</Link>
              <ChevronRight size={12} />
              <span>{isEdit ? 'Sửa phiếu' : 'Tạo phiếu'}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {isEdit ? `Sửa phiếu bảo hành #${existing?.WarrantyCode || ''}` : 'Tạo phiếu bảo hành mới'}
            </h1>
          </div>
        </div>

        {isEdit && !existing ? (
          <div className={`flex flex-col items-center justify-center rounded-3xl border py-16 text-center ${dark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
            <PackageSearch size={30} className="text-slate-300 dark:text-slate-600" />
            <p className="mt-3 font-bold text-slate-600 dark:text-slate-300">Thiếu dữ liệu phiếu bảo hành</p>
            <p className="mt-1 max-w-sm text-sm text-slate-400">Vui lòng quay lại danh sách và bấm "Xem / Sửa" trên đúng phiếu cần chỉnh sửa.</p>
            <Link to="/admin/warranties" className="mt-4 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700">
              Về danh sách bảo hành
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isEdit && (
              <div className={`rounded-2xl border p-5 ${dark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                    <PackageSearch size={15} />
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white">Chọn sản phẩm cho phiếu bảo hành</h3>
                </div>

                <SourceTabs mode={sourceMode} setMode={setSourceMode} dark={dark} />

                {sourceMode === 'purchased' ? (
                  <div className="mt-4">
                    <div className="flex gap-2">
                      <div className={`flex flex-1 items-center gap-2 rounded-xl border px-3.5 ${dark ? 'border-slate-700 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                        <Phone size={15} className="shrink-0 text-slate-400" />
                        <input
                          value={phoneQuery}
                          onChange={(e) => setPhoneQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), lookupPurchases())}
                          placeholder="Nhập số điện thoại khách hàng..."
                          className={`h-11 flex-1 bg-transparent text-sm font-semibold outline-none ${dark ? 'text-slate-100 placeholder:text-slate-600' : 'text-slate-800 placeholder:text-slate-400'}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={lookupPurchases}
                        disabled={lookupLoading}
                        className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-60"
                      >
                        {lookupLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                        Tìm
                      </button>
                    </div>

                    {lookupDone && (
                      <div className="mt-4">
                        {purchasedItems.length ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {purchasedItems.map((item) => {
                              const selected = form.productId === item.productId && form.orderId === item.orderId;
                              return (
                                <button
                                  type="button"
                                  key={item.key}
                                  onClick={() => pickPurchasedItem(item)}
                                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                                    selected
                                      ? 'border-sky-400 bg-sky-50 dark:border-sky-500/50 dark:bg-sky-500/10'
                                      : dark ? 'border-slate-700 hover:border-slate-600 hover:bg-white/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <img
                                    src={getImageUrl(item.image)}
                                    alt=""
                                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{item.productName}</p>
                                    <p className="text-xs text-slate-400">Đơn #{item.orderCode} · {new Date(item.purchaseDate).toLocaleDateString('vi-VN')}</p>
                                  </div>
                                  {selected && <CheckCircle2 size={16} className="shrink-0 text-sky-500" />}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={`rounded-xl border border-dashed p-6 text-center text-sm font-semibold ${dark ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                            Không tìm thấy đơn hàng nào — thử chuyển sang "Kho sản phẩm" để chọn thủ công
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className={`flex items-center gap-2 rounded-xl border px-3.5 ${dark ? 'border-slate-700 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                      <Search size={15} className="shrink-0 text-slate-400" />
                      <input
                        value={catalogQuery}
                        onChange={(e) => setCatalogQuery(e.target.value)}
                        placeholder="Tìm sản phẩm trong kho..."
                        className={`h-11 flex-1 bg-transparent text-sm font-semibold outline-none ${dark ? 'text-slate-100 placeholder:text-slate-600' : 'text-slate-800 placeholder:text-slate-400'}`}
                      />
                      {catalogLoading && <Loader2 size={15} className="shrink-0 animate-spin text-slate-400" />}
                    </div>

                    {catalogResults.length > 0 && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {catalogResults.map((p) => {
                          const selected = form.productId === p.ProductId;
                          return (
                            <button
                              type="button"
                              key={p.ProductId}
                              onClick={() => pickCatalogProduct(p)}
                              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                                selected
                                  ? 'border-sky-400 bg-sky-50 dark:border-sky-500/50 dark:bg-sky-500/10'
                                  : dark ? 'border-slate-700 hover:border-slate-600 hover:bg-white/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <img
                                src={getImageUrl(p.primaryImage)}
                                alt=""
                                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{p.Name}</p>
                                <p className="text-xs text-slate-400">{formatPrice(p.Price)}</p>
                              </div>
                              {selected && <CheckCircle2 size={16} className="shrink-0 text-sky-500" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {form.productName && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckCircle2 size={16} className="shrink-0" />
                    Đã chọn: {form.productName}
                  </div>
                )}
              </div>
            )}

            <div className={`rounded-2xl border p-5 ${dark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                  <User size={15} />
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white">Thông tin phiếu bảo hành</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Khách hàng *</label>
                  <input
                    value={form.customerName}
                    onChange={(e) => set('customerName')(e.target.value)}
                    placeholder="Tên khách hàng"
                    className={`h-11 w-full rounded-xl border px-4 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-sky-400/30 ${
                      dark ? 'border-slate-700 bg-slate-950/70 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Số điện thoại *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => set('phone')(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className={`h-11 w-full rounded-xl border px-4 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-sky-400/30 ${
                      dark ? 'border-slate-700 bg-slate-950/70 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sản phẩm *</label>
                  <div className={`flex h-11 items-center gap-2 rounded-xl border px-4 ${dark ? 'border-slate-700 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                    <Package size={15} className="shrink-0 text-slate-400" />
                    <input
                      value={form.productName}
                      onChange={(e) => set('productName')(e.target.value)}
                      placeholder="Tên sản phẩm"
                      className={`h-full flex-1 bg-transparent text-sm font-semibold outline-none ${dark ? 'text-slate-100' : 'text-slate-800'}`}
                    />
                  </div>
                </div>

                <DateField label="Ngày mua *" value={form.purchaseDate} onChange={set('purchaseDate')} icon={ShoppingBag} />
                <DateField label="Hết hạn bảo hành *" value={form.expiryDate} onChange={set('expiryDate')} min={form.purchaseDate} />

                <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Đặt nhanh:</span>
                  {[6, 12, 24, 36].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set('expiryDate')(addMonths(form.purchaseDate || todayStr(), m))}
                      disabled={!form.purchaseDate}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${
                        dark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      +{m} tháng
                    </button>
                  ))}
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ghi chú</label>
                  <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 ${dark ? 'border-slate-700 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                    <StickyNote size={15} className="mt-0.5 shrink-0 text-slate-400" />
                    <textarea
                      value={form.notes}
                      onChange={(e) => set('notes')(e.target.value)}
                      rows={3}
                      placeholder="Ghi chú thêm về phiếu bảo hành (nếu có)..."
                      className={`flex-1 resize-none bg-transparent text-sm font-medium outline-none ${dark ? 'text-slate-100' : 'text-slate-800'}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {isEdit ? (
                <button
                  type="button"
                  onClick={toggleVoid}
                  disabled={saving}
                  className={`flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-bold transition disabled:opacity-60 ${
                    existing?.Status === 'void'
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400'
                  }`}
                >
                  {existing?.Status === 'void' ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                  {existing?.Status === 'void' ? 'Khôi phục phiếu' : 'Thu hồi phiếu'}
                </button>
              ) : <span />}

              <button
                type="submit"
                disabled={saving || !canSubmit}
                className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isEdit ? 'Lưu thay đổi' : 'Tạo phiếu bảo hành'}
              </button>
            </div>
          </form>

          <div className="lg:sticky lg:top-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              {isEdit ? 'Phiếu bảo hành' : 'Xem trước phiếu'}
            </p>
            <WarrantyCertificateCard
              productName={form.productName}
              code={existing?.WarrantyCode}
              customerName={form.customerName}
              expiryDate={form.expiryDate}
              status={isEdit ? existing?.Status : 'pending'}
            />
            {!isEdit && (
              <p className="mt-3 text-xs text-slate-400">
                Mã phiếu chính thức sẽ được tạo tự động sau khi bạn bấm "Tạo phiếu bảo hành".
              </p>
            )}
          </div>
          </div>
        )}
      </div>

      {createdWarranty && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex w-full max-w-md flex-col items-center"
          >
            <div className="mb-4 flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1.5 text-sm font-bold text-emerald-400">
              <CheckCircle2 size={15} /> Đã tạo phiếu bảo hành thành công
            </div>
            <WarrantyCertificateCard
              productName={createdWarranty.ProductName}
              code={createdWarranty.WarrantyCode}
              customerName={createdWarranty.CustomerName}
              expiryDate={createdWarranty.ExpiryDate ? String(createdWarranty.ExpiryDate).slice(0, 10) : form.expiryDate}
              status="active"
            />
            <button
              type="button"
              onClick={() => navigate('/admin/warranties')}
              className="mt-5 w-full max-w-md rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-xl transition hover:bg-slate-100"
            >
              Xong, về danh sách bảo hành
            </button>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}