import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Mail, MapPin, MessageCircle, Phone, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api, { getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/format';
import toast from 'react-hot-toast';

const FALLBACK = {
  hero: 'https://images.unsplash.com/photo-1587351021753-97b9bfaa702e?auto=format&fit=crop&w=1920&h=820&q=90',
  side: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1200&h=900&q=90',
};

export default function ContactPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pageImages, setPageImages] = useState(FALLBACK);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', subject: '', message: '' });
  const [myContacts, setMyContacts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    api.get('/pages/images')
      .then((r) => {
        const c = r.data?.contact;
        if (c) {
          setPageImages({
            hero: c.hero || FALLBACK.hero,
            side: c.side || FALLBACK.side,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: user.FullName || '',
        email: user.Email || '',
        phone: user.Phone || '',
      }));
      setLoadingHistory(true);
      api.get('/contacts/my')
        .then((r) => setMyContacts(r.data || []))
        .catch(() => setMyContacts([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để gửi liên hệ');
      navigate('/login', { state: { from: '/contact' } });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/contacts', form);
      toast.success(res.message || 'Gửi liên hệ thành công');
      setForm((f) => ({ ...f, subject: '', message: '' }));
      const history = await api.get('/contacts/my');
      setMyContacts(history.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const markReplyRead = async (id) => {
    try {
      await api.patch(`/contacts/my/${id}/read`);
      setMyContacts((prev) => prev.map((c) => (c.ContactId === id ? { ...c, ReplyRead: 1 } : c)));
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <section className="relative min-h-[min(420px,55vh)] overflow-hidden">
        <img
          src={getImageUrl(pageImages.hero)}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
          loading="eager"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK.hero;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-primary-950/78 to-slate-900/55" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(56,189,248,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-white sm:px-6 sm:py-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-sky-300">Contact MediCare</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Luôn sẵn sàng hỗ trợ bạn 24/7
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-200">
              Tư vấn thiết bị y tế, báo giá đơn hàng sỉ và hỗ trợ kỹ thuật — phản hồi trong vòng 2 giờ làm việc.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-24">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="group relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-slate-900 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/50 dark:border-white/10 dark:ring-white/10">
            <img
              src={getImageUrl(pageImages.side)}
              alt="MediCare support"
              className="h-64 w-full object-cover object-[center_20%] transition duration-700 group-hover:scale-[1.03] lg:h-80"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = FALLBACK.side;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">MediCare Care Team</p>
              <p className="mt-1 text-sm font-semibold text-white">Tư vấn chuyên môn · Phản hồi nhanh</p>
            </div>
          </div>

          {[
            { icon: MapPin, title: 'Showroom & kho', text: '123 Nguyễn Huệ, Quận 1, TP.HCM' },
            { icon: Phone, title: 'Hotline', text: '1900 1234 · 24/7' },
            { icon: Mail, title: 'Email', text: 'support@medicarestore.com' },
            { icon: Clock, title: 'Giờ làm việc', text: 'T2–T7: 8:00 – 20:00 · CN: 9:00 – 17:00' },
          ].map((item) => (
            <div key={item.title} className="surface flex gap-4 rounded-2xl p-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-sky-600 text-white shadow-lg shadow-primary-500/20">
                <item.icon size={22} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.title}</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{item.text}</p>
              </div>
            </div>
          ))}

          {user && myContacts.length > 0 && (
            <div className="surface space-y-3 rounded-3xl p-5">
              <h3 className="text-lg font-black">Tin nhắn của bạn</h3>
              {loadingHistory ? (
                <p className="text-sm text-slate-500">Đang tải...</p>
              ) : (
                myContacts.slice(0, 5).map((c) => (
                  <div key={c.ContactId} className="rounded-2xl border border-slate-200/80 p-4 dark:border-white/10">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold">{c.Subject}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.Status === 'replied' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {c.Status === 'replied' ? 'Đã phản hồi' : c.Status === 'read' ? 'Đã xem' : 'Đang chờ'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{c.Message}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(c.CreatedAt)}</p>
                    {c.AdminReply && (
                      <div
                        className={`mt-3 rounded-xl border p-3 ${
                          c.ReplyRead ? 'border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-500/10' : 'border-primary-200 bg-primary-50 dark:border-primary-500/20 dark:bg-primary-500/10'
                        }`}
                        onMouseEnter={() => !c.ReplyRead && markReplyRead(c.ContactId)}
                      >
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 size={14} />
                          Phản hồi từ MediCare Admin
                          {c.ReplyAt && <span className="font-normal text-slate-500">· {formatDateTime(c.ReplyAt)}</span>}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{c.AdminReply}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <ShieldCheck className="shrink-0 text-emerald-600" size={22} />
            <p className="text-sm text-emerald-900 dark:text-emerald-200">
              Chỉ tài khoản đã đăng ký mới gửi được liên hệ. Thông tin được bảo mật.
            </p>
          </div>
        </motion.div>

        {user ? (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmit}
            className="surface h-fit space-y-5 rounded-[2rem] border border-slate-200/80 p-6 shadow-xl dark:border-white/10 sm:p-10"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/40">
                <MessageCircle size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black">Gửi tin nhắn</h2>
                <p className="text-sm text-slate-500">Xin chào {user.FullName} — chúng tôi sẽ phản hồi sớm</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Họ tên" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <Input label="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Tiêu đề" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            <div>
              <label className="text-sm font-semibold">Nội dung</label>
              <textarea
                rows={5}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Mô tả nhu cầu thiết bị, số lượng, thời gian giao..."
                className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-white/10 dark:bg-slate-950/60"
              />
            </div>
            <Button type="submit" className="w-full rounded-2xl py-3.5 text-base" loading={submitting}>
              <Send size={18} />
              Gửi liên hệ
            </Button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="surface flex h-fit flex-col items-center justify-center rounded-[2rem] border border-slate-200/80 p-10 text-center shadow-xl dark:border-white/10"
          >
            <MessageCircle size={48} className="mb-4 text-primary-500" />
            <h2 className="text-2xl font-black">Đăng nhập để gửi liên hệ</h2>
            <p className="mt-3 max-w-sm text-slate-500">
              Chỉ khách hàng đã đăng ký tài khoản mới có thể gửi tin nhắn tới admin và nhận phản hồi tại đây.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/login" state={{ from: '/contact' }} className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary-500 to-blue-600 px-6 py-3 font-bold text-white shadow-lg">
                Đăng nhập
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
                Đăng ký
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
