import { useEffect, useState } from 'react';
import { Pencil, Upload } from 'lucide-react';
import api, { getImageUrl } from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';

export default function PageImageSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/pages/images/admin')
      .then((r) => setItems(r.data?.images || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (item) => {
    setModal(item);
    setImageUrl(item.url?.startsWith('http') ? item.url : '');
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modal) return;
    if (!file && !imageUrl.trim()) {
      toast.error('Chọn file hoặc nhập URL ảnh');
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    if (imageUrl.trim()) fd.append('imageUrl', imageUrl.trim());
    if (file) fd.append('image', file);
    try {
      await api.put(`/pages/images/${modal.page}/${modal.slot}`, fd);
      toast.success('Đã cập nhật ảnh trang');
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-200/80 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.key}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-slate-900/40"
            >
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-950">
                <img
                  src={getImageUrl(item.url)}
                  alt={item.label}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getImageUrl(item.defaultUrl);
                  }}
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-bold leading-snug mb-2">{item.label}</p>
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="grid h-8 w-8 place-items-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                >
                  <Pencil size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.label || 'Cập nhật ảnh'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold">URL ảnh (http hoặc /uploads/...)</label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold">Hoặc upload từ máy</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-white/15">
              <Upload size={20} className="text-primary-600" />
              <span className="text-sm">{file ? file.name : 'Chọn ảnh JPG, PNG, WebP...'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          {modal?.url && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
              <img src={getImageUrl(modal.url)} alt="" className="max-h-40 w-full object-cover" />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu ảnh'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}