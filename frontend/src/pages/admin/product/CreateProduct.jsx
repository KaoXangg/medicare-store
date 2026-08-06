import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, DollarSign, Tag, Layers, FileText,
  Image as ImageIcon, Cpu, ChevronRight, ChevronDown, Plus, Trash2,
  Star, TrendingUp, ArrowLeft, Save, Hash, Building2, RefreshCw
} from 'lucide-react';
import api, { getImageUrl } from '../../../services/api';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ProductImageUpload from '../../../components/admin/ProductImageUpload';
import { useTheme } from '../../../context/ThemeContext';
import toast from 'react-hot-toast';

const MAX_IMAGES = 5;

const emptyForm = {
  name: '', price: '', salePrice: '', stock: '',
  sku: '', categoryId: '', brandId: '', description: '',
  isFeatured: false, isPopular: false,
};

const DEFAULT_SPECS = [
  { key: 'CPU', value: '' },
  { key: 'RAM', value: '' },
  { key: 'SSD', value: '' },
  { key: 'Xuất xứ', value: '' },
  { key: 'Bảo hành', value: '' },
];

const SECTIONS = [
  { id: 'basic',   label: 'Thông tin cơ bản', icon: Package },
  { id: 'pricing', label: 'Giá & Kho hàng',   icon: DollarSign },
  { id: 'media',   label: 'Hình ảnh',          icon: ImageIcon },
  { id: 'specs',   label: 'Thông số kỹ thuật', icon: Cpu },
  { id: 'extra',   label: 'Cài đặt thêm',      icon: Star },
];

function generateSku() {
  const time = Date.now().toString(36).slice(-4).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SP-${time}${rand}`;
}

function SectionCard({ id, icon: Icon, title, subtitle, children, dark }) {
  return (
    <div
      id={id}
      className={`rounded-3xl border p-6 sm:p-8 scroll-mt-6 transition-colors
        ${dark
          ? 'bg-slate-900/70 border-slate-800'
          : 'bg-white border-slate-200 shadow-sm shadow-slate-100'}`}
    >
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

function FieldLabel({ children, dark, required }) {
  return (
    <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em]
      ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
      {children}{required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
}

function StyledSelect({ value, onChange, children, dark, required }) {
  return (
    <select
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/30
        ${dark
          ? 'border-slate-700 bg-slate-950/60 text-slate-100 focus:border-sky-500'
          : 'border-slate-200 bg-white text-slate-900 focus:border-sky-500'}`}
    >
      {children}
    </select>
  );
}

function CategorySelect({ value, onChange, categories, dark, required }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = categories.find((c) => String(c.CategoryId) === String(value));

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/30
          ${dark
            ? 'border-slate-700 bg-slate-950/60 text-slate-100 focus:border-sky-500'
            : 'border-slate-200 bg-white text-slate-900 focus:border-sky-500'}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.Image ? (
            <img src={getImageUrl(selected.Image)} alt="" className="h-5 w-5 shrink-0 rounded-md object-cover" />
          ) : (
            <Layers size={14} className={`shrink-0 ${dark ? 'text-slate-600' : 'text-slate-300'}`} />
          )}
          <span className={`truncate ${!selected ? (dark ? 'text-slate-500' : 'text-slate-400') : ''}`}>
            {selected ? selected.Name : 'Chọn danh mục'}
          </span>
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
      </button>

      {open && (
        <div className={`absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border p-1.5 shadow-xl
          ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          {categories.map((c) => (
            <button
              key={c.CategoryId}
              type="button"
              onClick={() => { onChange(String(c.CategoryId)); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition
                ${String(value) === String(c.CategoryId)
                  ? dark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'
                  : dark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {c.Image ? (
                <img
                  src={getImageUrl(c.Image)}
                  alt=""
                  className={`h-6 w-6 shrink-0 rounded-lg border object-cover
                    ${dark ? 'border-slate-700 bg-white/5' : 'border-slate-200 bg-slate-50'}`}
                />
              ) : (
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg
                  ${dark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                  <Layers size={12} />
                </span>
              )}
              <span className="truncate">{c.Name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BrandSelect({ value, onChange, brands, dark }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = brands.find((b) => String(b.BrandId) === String(value));

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/30
          ${dark
            ? 'border-slate-700 bg-slate-950/60 text-slate-100 focus:border-sky-500'
            : 'border-slate-200 bg-white text-slate-900 focus:border-sky-500'}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.Logo ? (
            <img src={getImageUrl(selected.Logo)} alt="" className="h-5 w-5 shrink-0 rounded-md object-contain" />
          ) : (
            <Building2 size={14} className={`shrink-0 ${dark ? 'text-slate-600' : 'text-slate-300'}`} />
          )}
          <span className={`truncate ${!selected ? (dark ? 'text-slate-500' : 'text-slate-400') : ''}`}>
            {selected ? selected.Name : 'Chọn thương hiệu'}
          </span>
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
      </button>

      {open && (
        <div className={`absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border p-1.5 shadow-xl
          ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition
              ${dark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Building2 size={14} /> Không chọn thương hiệu
          </button>
          {brands.map((b) => (
            <button
              key={b.BrandId}
              type="button"
              onClick={() => { onChange(String(b.BrandId)); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition
                ${String(value) === String(b.BrandId)
                  ? dark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'
                  : dark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {b.Logo ? (
                <img
                  src={getImageUrl(b.Logo)}
                  alt=""
                  className={`h-6 w-6 shrink-0 rounded-lg border object-contain
                    ${dark ? 'border-slate-700 bg-white/5' : 'border-slate-200 bg-slate-50'}`}
                />
              ) : (
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg
                  ${dark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                  <Building2 size={12} />
                </span>
              )}
              <span className="truncate">{b.Name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StyledTextarea({ value, onChange, placeholder, rows = 4, dark }) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/30 resize-none
        ${dark
          ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:border-sky-500'
          : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500'}`}
    />
  );
}

export default function CreateProduct() {
  const navigate = useNavigate();
  const { dark } = useTheme();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [specRows, setSpecRows] = useState(DEFAULT_SPECS);
  const [imageUrls, setImageUrls] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    Promise.all([api.get('/categories?active=false'), api.get('/brands')])
      .then(([catRes, brandRes]) => {
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        setBrands(Array.isArray(brandRes.data) ? brandRes.data : []);
      })
      .catch(() => toast.error('Không tải được danh mục/thương hiệu'));
  }, []);

  // Tự động sinh mã SKU ngẫu nhiên khi mở form thêm sản phẩm
  useEffect(() => {
    setForm((f) => (f.sku ? f : { ...f, sku: generateSku() }));
  }, []);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('price', form.price);
    fd.append('stock', form.stock || '0');
    fd.append('categoryId', form.categoryId);
    fd.append('isFeatured', form.isFeatured ? 'true' : 'false');
    fd.append('isPopular', form.isPopular ? 'true' : 'false');
    if (form.salePrice) fd.append('salePrice', form.salePrice);
    if (form.sku?.trim()) fd.append('sku', form.sku.trim());
    if (form.brandId) fd.append('brandId', form.brandId);
    if (form.description?.trim()) fd.append('description', form.description.trim());
    const specs = Object.fromEntries(
      specRows.filter((r) => r.key.trim() && r.value.trim()).map((r) => [r.key.trim(), r.value.trim()])
    );
    if (Object.keys(specs).length) fd.append('specifications', JSON.stringify(specs));
    if (imageUrls.trim()) fd.append('imageUrls', imageUrls.trim());
    imageFiles.slice(0, MAX_IMAGES).forEach((file) => fd.append('images', file));
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return toast.error('Vui lòng nhập tên sản phẩm');
    if (!form.categoryId) return toast.error('Vui lòng chọn danh mục');
    if (!form.price) return toast.error('Vui lòng nhập giá sản phẩm');
    if (!imageUrls.trim() && imageFiles.length === 0)
      return toast.error('Vui lòng thêm ít nhất một ảnh sản phẩm');
    if (imageFiles.length > MAX_IMAGES)
      return toast.error(`Tối đa ${MAX_IMAGES} ảnh upload mỗi lần`);
    setSubmitting(true);
    try {
      await api.post('/products', buildFormData());
      toast.success('Thêm sản phẩm thành công!');
      navigate('/admin/products');
    } catch (err) {
      const isDuplicateSku = /sku/i.test(err.message || '') && /(duplicate|exist|trùng|unique)/i.test(err.message || '');
      if (isDuplicateSku) {
        setForm((f) => ({ ...f, sku: generateSku() }));
        toast.error('Mã SKU bị trùng, đã tạo mã mới — vui lòng thử lại');
      } else {
        toast.error(err.message || 'Có lỗi xảy ra');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const previewUrls = imageUrls.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

  const txt1 = dark ? 'text-slate-100' : 'text-slate-900';
  const txt3 = dark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen transition-colors ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition
                ${dark ? 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-100' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900'}`}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className={`text-[10px] uppercase tracking-[0.22em] font-semibold ${txt3}`}>Sản phẩm mới</p>
              <h1 className={`text-xl font-black ${txt1}`}>Thêm sản phẩm</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 active:scale-95 disabled:opacity-60"
          >
            <Save size={15} />
            {submitting ? 'Đang lưu...' : 'Thêm sản phẩm'}
          </button>
        </div>

        <div className="flex gap-6">

          {/* ── Sidebar nav ── */}
          <aside className="hidden lg:flex w-52 shrink-0 flex-col gap-1 self-start sticky top-6">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveSection(id);
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-left transition
                    ${active
                      ? dark
                        ? 'bg-sky-500/15 text-sky-400'
                        : 'bg-sky-50 text-sky-600'
                      : dark
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                >
                  <Icon size={15} className="shrink-0" />
                  <span>{label}</span>
                  {active && <ChevronRight size={13} className="ml-auto" />}
                </button>
              );
            })}
          </aside>

          {/* ── Main content ── */}
          <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-4">

            {/* Thông tin cơ bản */}
            <SectionCard id="basic" icon={Package} title="Thông tin cơ bản" subtitle="Tên, danh mục và thương hiệu" dark={dark}>
              <div className="space-y-5">
                <div>
                  <FieldLabel dark={dark} required>Tên sản phẩm</FieldLabel>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="VD: Máy đo huyết áp Omron HEM-7156"
                    required
                  />
                </div>

                <div>
                  <FieldLabel dark={dark}>Mô tả sản phẩm</FieldLabel>
                  <StyledTextarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả chi tiết tính năng, công dụng..."
                    rows={4}
                    dark={dark}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel dark={dark} required>Danh mục</FieldLabel>
                    <CategorySelect
                      value={form.categoryId}
                      onChange={(val) => setForm({ ...form, categoryId: val })}
                      categories={categories}
                      dark={dark}
                    />
                  </div>
                  <div>
                    <FieldLabel dark={dark}>Thương hiệu</FieldLabel>
                    <BrandSelect
                      value={form.brandId}
                      onChange={(val) => setForm({ ...form, brandId: val })}
                      brands={brands}
                      dark={dark}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className={`block text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                      SKU / Mã sản phẩm
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, sku: generateSku() }))}
                      className={`flex items-center gap-1 text-[11px] font-semibold transition ${dark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'}`}
                    >
                      <RefreshCw size={11} /> Tạo mã mới
                    </button>
                  </div>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="VD: MC-BP-001"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Giá & Kho */}
            <SectionCard id="pricing" icon={DollarSign} title="Giá & Kho hàng" subtitle="Thiết lập giá bán và số lượng tồn kho" dark={dark}>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel dark={dark} required>Giá gốc (VNĐ)</FieldLabel>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" required />
                </div>
                <div>
                  <FieldLabel dark={dark}>Giá sale (VNĐ)</FieldLabel>
                  <Input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} placeholder="Để trống nếu không sale" />
                </div>
                <div>
                  <FieldLabel dark={dark} required>Tồn kho</FieldLabel>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" required />
                </div>
              </div>
              {form.price && form.salePrice && Number(form.salePrice) < Number(form.price) && (
                <div className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold
                  ${dark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  <Tag size={14} />
                  Giảm {Math.round((1 - Number(form.salePrice) / Number(form.price)) * 100)}% so với giá gốc
                </div>
              )}
            </SectionCard>

            {/* Hình ảnh */}
            <SectionCard id="media" icon={ImageIcon} title="Hình ảnh sản phẩm" subtitle={`Tối đa ${MAX_IMAGES} ảnh upload · Hỗ trợ link URL`} dark={dark}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <FieldLabel dark={dark}>Ảnh từ URL</FieldLabel>
                  <StyledTextarea
                    value={imageUrls}
                    onChange={(e) => setImageUrls(e.target.value)}
                    placeholder={"https://example.com/image.jpg\nhttps://..."}
                    rows={4}
                    dark={dark}
                  />
                  {previewUrls.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {previewUrls.map((url, i) => (
                        <div key={i} className={`relative h-20 w-20 rounded-2xl overflow-hidden border
                          ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                          <img src={getImageUrl(url)} alt="" className="h-full w-full object-cover" />
                          <span className={`absolute bottom-1 right-1 rounded-md px-1 text-[9px] font-bold
                            ${dark ? 'bg-slate-900/80 text-slate-300' : 'bg-white/80 text-slate-600'}`}>
                            {i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel dark={dark}>Upload từ máy</FieldLabel>
                  <ProductImageUpload files={imageFiles} onChange={setImageFiles} label="" />
                </div>
              </div>
            </SectionCard>

            {/* Thông số */}
            <SectionCard id="specs" icon={Cpu} title="Thông số kỹ thuật" subtitle="CPU, RAM, SSD và các thông số khác" dark={dark}>
              <div className="space-y-2">
                {specRows.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={row.key}
                      onChange={(e) => { const n = [...specRows]; n[i] = { ...n[i], key: e.target.value }; setSpecRows(n); }}
                      placeholder="Tên thông số"
                      className={`w-2/5 rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/20
                        ${dark ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:border-sky-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500'}`}
                    />
                    <input
                      value={row.value}
                      onChange={(e) => { const n = [...specRows]; n[i] = { ...n[i], value: e.target.value }; setSpecRows(n); }}
                      placeholder="Giá trị"
                      className={`flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/20
                        ${dark ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:border-sky-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setSpecRows(specRows.filter((_, idx) => idx !== i))}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition
                        ${dark ? 'border-slate-700 text-slate-500 hover:border-rose-500/40 hover:text-rose-400' : 'border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500'}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSpecRows([...specRows, { key: '', value: '' }])}
                  className={`mt-2 flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition
                    ${dark ? 'text-sky-400 hover:bg-sky-500/10' : 'text-sky-600 hover:bg-sky-50'}`}
                >
                  <Plus size={14} /> Thêm thông số
                </button>
              </div>
            </SectionCard>

            {/* Cài đặt thêm */}
            <SectionCard id="extra" icon={Star} title="Cài đặt thêm" subtitle="Đánh dấu nổi bật và bán chạy" dark={dark}>
              <div className="flex flex-col sm:flex-row gap-3">
                {[
                  { key: 'isFeatured', icon: Star, label: 'Sản phẩm nổi bật', desc: 'Hiển thị ở khu vực nổi bật trang chủ' },
                  { key: 'isPopular',  icon: TrendingUp, label: 'Bán chạy',    desc: 'Gắn nhãn "Bán chạy" trên thẻ sản phẩm' },
                ].map(({ key, icon: Icon, label, desc }) => (
                  <label
                    key={key}
                    className={`flex flex-1 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition
                      ${form[key]
                        ? dark ? 'border-sky-500/40 bg-sky-500/10' : 'border-sky-300 bg-sky-50'
                        : dark ? 'border-slate-700 bg-slate-900/40 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                      className="mt-0.5 accent-sky-500"
                    />
                    <div>
                      <div className={`flex items-center gap-1.5 text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>
                        <Icon size={13} /> {label}
                      </div>
                      <p className={`mt-0.5 text-xs ${txt3}`}>{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </SectionCard>

            {/* Submit bottom */}
            <div className="flex justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition
                  ${dark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 active:scale-95 disabled:opacity-60"
              >
                <Save size={15} />
                {submitting ? 'Đang lưu...' : 'Thêm sản phẩm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}