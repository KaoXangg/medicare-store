import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Image as ImageIcon, Hash, Eye, EyeOff,
  ArrowLeft, Save, Pencil,
} from 'lucide-react';
import api, { getImageUrl } from '../../../services/api';
import Input from '../../../components/ui/Input';
import { useTheme } from '../../../context/ThemeContext';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '',
  description: '',
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
};

const SECTIONS = [
  { id: 'basic',      label: 'Thông tin cơ bản', icon: Layers },
  { id: 'media',      label: 'Hình ảnh',          icon: ImageIcon },
  { id: 'visibility', label: 'Hiển thị',           icon: Eye },
];

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

export default function CreateCategories() {
  const navigate = useNavigate();
  const { dark } = useTheme();

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(file ? URL.createObjectURL(file) : null);
  };

  const previewSrc = filePreview || (form.imageUrl ? getImageUrl(form.imageUrl) : null);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('description', form.description || '');
    fd.append('sortOrder', String(form.sortOrder ?? 0));
    fd.append('isActive', form.isActive ? 'true' : 'false');
    if (form.imageUrl.trim()) fd.append('imageUrl', form.imageUrl.trim());
    if (imageFile) fd.append('image', imageFile);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return toast.error('Vui lòng nhập tên danh mục');
    setSubmitting(true);
    try {
      await api.post('/categories', buildFormData());
      toast.success('Thêm danh mục thành công!');
      navigate('/admin/categories');
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

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
              onClick={() => navigate('/admin/categories')}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition
                ${dark ? 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-100' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900'}`}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className={`text-[10px] uppercase tracking-[0.22em] font-semibold ${txt3}`}>Danh mục mới</p>
              <h1 className={`text-xl font-black ${txt1}`}>Thêm danh mục</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 active:scale-95 disabled:opacity-60"
          >
            <Save size={15} />
            {submitting ? 'Đang lưu...' : 'Thêm danh mục'}
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
                </button>
              );
            })}
          </aside>

          {/* ── Main content ── */}
          <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-4">

            {/* Thông tin cơ bản */}
            <SectionCard id="basic" icon={Layers} title="Thông tin cơ bản" subtitle="Tên và mô tả danh mục" dark={dark}>
              <div className="space-y-5">
                <div>
                  <FieldLabel dark={dark} required>Tên danh mục</FieldLabel>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="VD: Thiết bị y tế gia đình"
                    required
                  />
                </div>

                <div>
                  <FieldLabel dark={dark}>Mô tả</FieldLabel>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả ngắn về danh mục này..."
                  />
                </div>

                <div className="sm:w-1/3">
                  <FieldLabel dark={dark}>Thứ tự hiển thị</FieldLabel>
                  <div className="relative">
                    <Hash size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                      placeholder="0"
                      className={`w-full rounded-2xl border pl-9 pr-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-500/30
                        ${dark
                          ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:border-sky-500'
                          : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500'}`}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Hình ảnh */}
            <SectionCard id="media" icon={ImageIcon} title="Hình ảnh danh mục" subtitle="Bấm vào ảnh để tải lên, hoặc dán link URL có sẵn" dark={dark}>
              <div className="flex items-start gap-5">
                <label className={`group relative h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition
                  ${dark
                    ? 'border-slate-700 bg-slate-950/60 hover:border-sky-500/50'
                    : 'border-slate-200 bg-slate-50 hover:border-sky-400'}`}>
                  {previewSrc ? (
                    <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className={`flex h-full w-full flex-col items-center justify-center gap-1.5
                      ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <ImageIcon size={22} />
                      <span className="text-[10px] font-semibold">Chọn ảnh</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                    <Pencil size={16} className="text-white" />
                  </div>
                  <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                </label>

                <div className="flex-1 space-y-2 pt-1">
                  <FieldLabel dark={dark}>Hoặc nhập link ảnh (URL)</FieldLabel>
                  <Input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {imageFile && (
                    <p className={`text-xs font-semibold ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      Đã chọn: {imageFile.name}
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Hiển thị */}
            <SectionCard id="visibility" icon={Eye} title="Hiển thị" subtitle="Bật/tắt hiển thị danh mục trên cửa hàng" dark={dark}>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition
                  ${form.isActive
                    ? dark ? 'border-sky-500/40 bg-sky-500/10' : 'border-sky-300 bg-sky-50'
                    : dark ? 'border-slate-700 bg-slate-900/40 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                    ${form.isActive
                      ? dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                      : dark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                    {form.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>
                      Hiển thị trên cửa hàng
                    </p>
                    <p className={`mt-0.5 text-xs ${txt3}`}>
                      {form.isActive ? 'Khách hàng có thể xem danh mục này' : 'Danh mục sẽ bị ẩn khỏi cửa hàng'}
                    </p>
                  </div>
                </div>
                <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors
                  ${form.isActive ? 'bg-emerald-500' : dark ? 'bg-slate-700' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform
                    ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </span>
              </button>
            </SectionCard>

            {/* Submit bottom */}
            <div className="flex justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={() => navigate('/admin/categories')}
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
                {submitting ? 'Đang lưu...' : 'Thêm danh mục'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}