import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImagePlus, Pencil, Star, Trash2, X } from 'lucide-react';
import api, { getImageUrl } from '../../services/api';
import { formatDateTime } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

function StarInput({ value, onChange, size = 22 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((r) => (
        <button key={r} type="button" onClick={() => onChange(r)} aria-label={`${r} sao`}>
          <Star size={size} className={r <= value ? 'fill-amber-500 text-amber-500' : 'text-slate-300'} />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviewSection({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [summary, setSummary] = useState({ total: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(() => {
    if (!productId) return Promise.resolve();
    setLoading(true);
    return api.get(`/reviews/product/${productId}?sort=${sort}`)
      .then((r) => {
        setReviews(r.data?.reviews || []);
        setSummary(r.data?.summary || { total: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
      })
      .finally(() => setLoading(false));
  }, [productId, sort]);

  const loadMyReview = useCallback(() => {
    if (!user || !productId) {
      setMyReview(null);
      return Promise.resolve();
    }
    return api.get(`/reviews/product/${productId}/mine`)
      .then((r) => setMyReview(r.data))
      .catch(() => setMyReview(null));
  }, [user, productId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);
  useEffect(() => { loadMyReview(); }, [loadMyReview]);

  const clearNewImages = () => {
    newPreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewImages([]);
    setNewPreviews([]);
  };

  const resetForm = () => {
    setForm({ rating: 5, comment: '' });
    clearNewImages();
    setExistingImages([]);
    setEditingId(null);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const maxNew = Math.max(0, 5 - existingImages.length);
    const picked = files.slice(0, maxNew);
    clearNewImages();
    setNewImages(picked);
    setNewPreviews(picked.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('productId', String(productId));
    fd.append('rating', String(form.rating));
    fd.append('comment', form.comment);
    if (editingId) {
      fd.append('imageUrls', JSON.stringify(existingImages));
    }
    newImages.forEach((file) => fd.append('images', file));
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Vui lòng đăng nhập');
    setSubmitting(true);
    try {
      const fd = buildFormData();
      if (editingId) {
        await api.put(`/reviews/${editingId}`, fd);
        toast.success('Đã cập nhật đánh giá');
      } else {
        await api.post('/reviews', fd);
        toast.success('Đánh giá đã gửi');
      }
      resetForm();
      await Promise.all([loadReviews(), loadMyReview()]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (review) => {
    setEditingId(review.ReviewId);
    setForm({ rating: review.Rating, comment: review.Comment || '' });
    setExistingImages(review.images || []);
    clearNewImages();
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa đánh giá này?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Đã xóa đánh giá');
      if (editingId === id) resetForm();
      await Promise.all([loadReviews(), loadMyReview()]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const showForm = user && (!myReview || editingId);
  const distTotal = summary.total || 1;
  const sortOptions = useMemo(() => ([
    { id: 'newest', label: 'Mới nhất' },
    { id: 'oldest', label: 'Cũ nhất' },
    { id: 'highest', label: 'Cao nhất' },
    { id: 'lowest', label: 'Thấp nhất' },
  ]), []);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="surface rounded-3xl p-6 text-center">
          <p className="text-5xl font-black text-primary-600">{summary.average || 0}</p>
          <div className="mt-2 flex justify-center text-amber-500">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={18} fill={s <= Math.round(summary.average || 0) ? 'currentColor' : 'none'} />
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-500">{summary.total} đánh giá</p>
        </div>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.distribution?.[star] || 0;
            const pct = Math.round((count / distTotal) * 100);
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-8 text-sm font-bold text-slate-600">{star} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-right text-xs text-slate-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="surface rounded-3xl p-6">
          <h3 className="mb-4 text-lg font-black">{editingId ? 'Sửa đánh giá' : 'Viết đánh giá'}</h3>
          <StarInput value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
          <textarea
            rows={4}
            required
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-950/40"
          />
          <div className="mt-4">
            <label className="text-sm font-semibold">Đính kèm ảnh (tối đa 5)</label>
            <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-3 transition hover:border-primary-400 dark:border-white/15">
              <ImagePlus size={20} className="text-primary-600" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Chọn ảnh từ thiết bị</span>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            </label>
            {(existingImages.length > 0 || newPreviews.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {existingImages.map((url, i) => (
                  <div key={`ex-${i}`} className="relative">
                    <img src={getImageUrl(url)} alt="" className="h-20 w-20 rounded-xl object-cover" />
                    <button type="button" onClick={() => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-white shadow">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {newPreviews.map((url, i) => (
                  <div key={`new-${i}`} className="relative">
                    <img src={url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                    <button type="button" onClick={() => { URL.revokeObjectURL(newPreviews[i]); setNewImages((p) => p.filter((_, idx) => idx !== i)); setNewPreviews((p) => p.filter((_, idx) => idx !== i)); }} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-white shadow">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" loading={submitting}>{editingId ? 'Cập nhật' : 'Gửi đánh giá'}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Hủy</Button>}
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-500">Sắp xếp:</span>
        {sortOptions.map((opt) => (
          <button key={opt.id} type="button" onClick={() => setSort(opt.id)} className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${sort === opt.id ? 'bg-primary-600 text-white' : 'surface'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-white/5" />)}</div>
      ) : reviews.length ? (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.ReviewId} className="surface rounded-3xl p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{r.FullName}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(r.CreatedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-500">
                    {[...Array(r.Rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  {user?.UserId === r.UserId && (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => startEdit(r)} className="grid h-8 w-8 place-items-center rounded-lg bg-sky-100 text-sky-600"><Pencil size={14} /></button>
                      <button type="button" onClick={() => handleDelete(r.ReviewId)} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-100 text-rose-600"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{r.Comment}</p>
              {r.images?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.images.map((url, i) => (
                    <a key={i} href={getImageUrl(url)} target="_blank" rel="noreferrer">
                      <img src={getImageUrl(url)} alt="" className="h-20 w-20 rounded-xl object-cover transition hover:opacity-90" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-500 py-8">Chưa có đánh giá nào.</p>
      )}
    </div>
  );
}
