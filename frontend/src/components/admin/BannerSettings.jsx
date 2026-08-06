import { useEffect, useState } from 'react';
import { Eye, EyeOff, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import api, { getImageUrl } from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

const emptyForm = { title: '', subtitle: '', linkUrl: '', sortOrder: '0', imageUrl: '', isActive: true };

export default function BannerSettings() {
  const [banners, setBanners] = useState([]);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get('/banners').then((r) => setBanners(r.data || []));

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
    setModal(true);
  };

  const openEdit = (b) => {
    setEditingId(b.BannerId);
    setForm({
      title: b.Title || '',
      subtitle: b.Subtitle || '',
      linkUrl: b.LinkUrl || '',
      sortOrder: String(b.SortOrder ?? 0),
      imageUrl: b.ImageUrl?.startsWith('http') ? b.ImageUrl : '',
      isActive: b.IsActive === true || b.IsActive === 1 || b.IsActive === undefined || b.IsActive === null,
    });
    setFile(null);
    setModal(true);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('title', form.title);
    if (form.subtitle) fd.append('subtitle', form.subtitle);
    if (form.linkUrl) fd.append('linkUrl', form.linkUrl);
    fd.append('sortOrder', form.sortOrder || '0');
    fd.append('isActive', form.isActive ? 'true' : 'false');
    if (form.imageUrl) fd.append('imageUrl', form.imageUrl);
    if (file) fd.append('image', file);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = buildFormData();
    try {
      if (editingId) {
        await api.put(`/banners/${editingId}`, fd);
        toast.success('Đã cập nhật banner');
      } else {
        await api.post('/banners', fd);
        toast.success('Đã thêm banner — hiển thị trên trang chủ');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVisibility = async (b) => {
    const active = b.IsActive === true || b.IsActive === 1;
    const fd = new FormData();
    fd.append('isActive', active ? 'false' : 'true');
    try {
      await api.put(`/banners/${b.BannerId}`, fd);
      toast.success(active ? 'Đã ẩn banner' : 'Đã hiện banner trên cửa hàng');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/banners/${deleteTarget}`);
      toast.success('Đã xóa banner');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const isActive = (b) => b.IsActive === true || b.IsActive === 1 || b.IsActive === undefined || b.IsActive === null;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={openCreate} className="rounded-2xl"><Plus size={16} /> Thêm banner</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {banners.map((b) => (
          <div key={b.BannerId} className={`overflow-hidden rounded-2xl border ${isActive(b) ? 'border-slate-200/80 dark:border-white/10' : 'border-amber-300/60 opacity-75'}`}>
            <div className="relative">
              <img src={getImageUrl(b.ImageUrl)} alt="" className="h-28 w-full object-cover" />
              <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isActive(b) ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                {isActive(b) ? 'Đang hiện' : 'Đang ẩn'}
              </span>
            </div>
            <div className="p-3">
              <p className="font-bold text-sm leading-snug mb-0.5">{b.Title}</p>
              <p className="text-xs text-slate-500 mb-2 line-clamp-1">{b.Subtitle}</p>
              <div className="flex gap-1">
                <button type="button" onClick={() => toggleVisibility(b)} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/10" title={isActive(b) ? 'Ẩn banner' : 'Hiện banner'}>
                  {isActive(b) ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button type="button" onClick={() => openEdit(b)} className="grid h-8 w-8 place-items-center rounded-lg bg-sky-100 text-sky-600">
                  <Pencil size={15} />
                </button>
                <button type="button" onClick={() => setDeleteTarget(b.BannerId)} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-100 text-rose-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editingId ? 'Sửa banner' : 'Thêm banner'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModal(false)}>Hủy</Button>
            <Button form="banner-form" type="submit" loading={submitting}>Lưu</Button>
          </div>
        }
      >
        <form id="banner-form" onSubmit={handleSubmit} className="space-y-4">
          <Input label="Tiêu đề" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Phụ đề" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <Input label="Link URL" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="/products" />
          <Input label="Thứ tự hiển thị" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          <Input label="Ảnh URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <div>
            <label className="text-sm font-semibold">{editingId ? 'Thay ảnh (tùy chọn)' : 'Hoặc upload ảnh'}</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm" />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 dark:border-white/10">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded" />
            <span className="text-sm font-semibold">Hiển thị trên trang cửa hàng</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Xóa banner"
        message="Banner sẽ bị xóa khỏi slider trang chủ."
        confirmLabel="Xóa banner"
      />
    </div>
  );
}