import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, Wrench, PhoneCall,
  ClipboardCheck, PackageSearch, Stethoscope, Timer, ArrowRight, HeartPulse,
  Search, Phone, AlertCircle, Loader2, Ban,
} from 'lucide-react';
import api from '../services/api';

const warrantyGroups = [
  { icon: Stethoscope, title: 'Máy đo huyết áp, đường huyết', period: '12–24 tháng' },
  { icon: Wrench, title: 'Máy vật lý trị liệu, xông khí dung', period: '12–36 tháng' },
  { icon: PackageSearch, title: 'Phụ kiện, vật tư tiêu hao', period: '3–6 tháng' },
];

const validConditions = [
  'Còn phiếu bảo hành/hóa đơn mua hàng tại MediCare Store',
  'Tem bảo hành nguyên vẹn, không rách, tẩy xóa, chỉnh sửa',
  'Lỗi phát sinh trong quá trình sử dụng bình thường theo hướng dẫn',
];

const invalidConditions = [
  'Hết thời hạn bảo hành theo quy định của nhà sản xuất',
  'Hư hỏng do rơi vỡ, vào nước, cháy nổ, tự ý tháo lắp sửa chữa',
  'Mất tem bảo hành, phiếu bảo hành hoặc hóa đơn mua hàng',
];

const steps = [
  { icon: PhoneCall, title: 'Liên hệ hỗ trợ', desc: 'Gọi hotline hoặc gửi yêu cầu qua trang Liên hệ kèm số phiếu bảo hành.', time: 'Ngay lập tức' },
  { icon: ClipboardCheck, title: 'Tiếp nhận & chẩn đoán', desc: 'Kỹ thuật viên tiếp nhận và chẩn đoán lỗi.', time: '1–2 ngày' },
  { icon: Wrench, title: 'Sửa chữa / thay thế', desc: 'Xử lý tại trung tâm ủy quyền của hãng, hoặc đổi sản phẩm tương đương.', time: 'Theo hãng' },
  { icon: Timer, title: 'Bàn giao sản phẩm', desc: 'Nhận lại sản phẩm đã sửa chữa hoặc thay thế.', time: '5–10 ngày' },
];

const STATUS_META = {
  active: { label: 'Còn hiệu lực', color: 'text-emerald-300', dot: 'bg-emerald-400' },
  expired: { label: 'Đã hết hạn', color: 'text-rose-300', dot: 'bg-rose-400' },
  void: { label: 'Đã thu hồi', color: 'text-slate-300', dot: 'bg-slate-400' },
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLeft(expiryDate) {
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
}

function WarrantyResultCard({ item, index }) {
  const meta = STATUS_META[item.status] || STATUS_META.active;
  const remain = daysLeft(item.expiryDate);
  const isExpired = item.status === 'expired';
  const isVoid = item.status === 'void';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative mx-auto aspect-[1.58/1] w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-white/15 p-6 text-white shadow-[0_30px_70px_-15px_rgba(2,6,23,0.55)] ${
        isExpired || isVoid
          ? 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900'
          : 'bg-gradient-to-br from-sky-500 via-primary-600 to-indigo-700'
      }`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-14 -left-6 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2 font-black">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15">
            <HeartPulse size={16} />
          </span>
          MediCare
        </div>
        {isVoid ? <Ban size={26} className="text-white/80" /> : <ShieldCheck size={26} className="text-white/80" />}
      </div>

      <p className="relative mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">
        {item.productName}
      </p>
      <p className="relative mt-1 font-mono text-lg tracking-[0.15em]">{item.warrantyCode}</p>
      <p className="relative mt-1 text-xs text-white/70">{item.customerName}</p>

      <div className="relative mt-5 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/60">Hết hạn</p>
          <p className="font-bold">{formatDate(item.expiryDate)}</p>
          {item.status === 'active' && (
            <p className="mt-0.5 text-[11px] text-white/70">
              {remain > 0 ? `Còn ${remain} ngày` : 'Hết hạn hôm nay'}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-white/60">Trạng thái</p>
          <p className={`flex items-center justify-end gap-1.5 font-bold ${meta.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function WarrantyLookup() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = phone.replace(/[^\d]/g, '');
    if (trimmed.length < 8) {
      setError('Vui lòng nhập số điện thoại hợp lệ');
      return;
    }
    setError('');
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/warranties/lookup?phone=${trimmed}`);
      setResults(res.data || []);
    } catch (err) {
      setError(err.message || 'Không tra cứu được, thử lại sau');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <motion.form
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Phone size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Nhập số điện thoại đã mua hàng..."
            className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pl-12 pr-4 text-sm font-semibold text-white outline-none backdrop-blur transition placeholder:text-white/50 focus:border-white/50 focus:bg-white/15"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-primary-700 shadow-lg transition hover:bg-slate-100 active:scale-95 disabled:opacity-70"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Tra cứu
        </button>
      </motion.form>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto mt-3 flex max-w-xl items-center gap-2 text-sm font-semibold text-rose-300"
        >
          <AlertCircle size={15} /> {error}
        </motion.p>
      )}

      <AnimatePresence mode="wait">
        {searched && !loading && !error && (
          <motion.div
            key={results?.length ? 'has-results' : 'no-results'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-10"
          >
            {results && results.length > 0 ? (
              <div className={`grid gap-6 ${results.length > 1 ? 'sm:grid-cols-2' : 'mx-auto max-w-sm'}`}>
                {results.map((item, i) => (
                  <WarrantyResultCard key={item.warrantyCode} item={item} index={i} />
                ))}
              </div>
            ) : (
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-white/15 bg-white/5 p-8 text-center backdrop-blur">
                <AlertCircle size={28} className="text-white/50" />
                <p className="font-bold text-white">Không tìm thấy phiếu bảo hành</p>
                <p className="text-sm text-white/60">
                  Kiểm tra lại số điện thoại hoặc liên hệ hotline để được hỗ trợ.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WarrantyPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-slate-950 to-cyan-950 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(56,189,248,0.18),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_85%,rgba(99,102,241,0.15),transparent_50%)]" />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-white backdrop-blur">
              <ShieldCheck size={14} /> Tra cứu bảo hành
            </p>
            <h1 className="mt-6 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              Kiểm tra tình trạng bảo hành sản phẩm
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base text-slate-300 sm:text-lg">
              Nhập số điện thoại đã dùng khi mua hàng để xem phiếu bảo hành và thời hạn còn lại.
            </p>
          </motion.div>

          <div className="mt-10">
            <WarrantyLookup />
          </div>
        </div>
      </section>

      <section id="thoi-han" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary-600">Thời gian bảo hành</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Áp dụng theo từng nhóm thiết bị</h2>
          <p className="mt-3 text-slate-500">
            Thời hạn chính xác được ghi rõ trên phiếu bảo hành kèm sản phẩm, vì mỗi hãng công bố chính sách riêng.
          </p>
        </div>
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-white/10">
          {warrantyGroups.map((g, i) => (
            <div
              key={g.title}
              className={`flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 ${
                i !== warrantyGroups.length - 1 ? 'border-b border-slate-200/80 dark:border-white/10' : ''
              } bg-white dark:bg-slate-900`}
            >
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/40">
                  <g.icon size={22} />
                </div>
                <h3 className="font-bold">{g.title}</h3>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-primary-50 px-4 py-1.5 text-sm font-black text-primary-600 dark:bg-primary-900/30">
                {g.period}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Quy trình 4 bước</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Từ lúc báo lỗi đến lúc nhận lại máy</h2>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-6 hidden w-full lg:block">
              <div className="mx-6 h-px bg-gradient-to-r from-sky-400/60 via-white/15 to-transparent" />
            </div>
            <div className="grid gap-10 lg:grid-cols-4">
              {steps.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-16 lg:pl-0"
                >
                  <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky-400 bg-slate-950 text-sm font-black text-sky-300 lg:relative lg:mb-6">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
                  <p className="mt-3 inline-flex rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-300">
                    {s.time}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary-600">Đối chiếu nhanh</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Trường hợp nào được bảo hành?</h2>
        </div>
        <div className="grid overflow-hidden rounded-[1.75rem] border border-slate-200/80 shadow-xl shadow-slate-900/5 dark:border-white/10 sm:grid-cols-2">
          <div className="bg-emerald-50/70 p-8 dark:bg-emerald-500/[0.06] sm:p-10">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-300">Hợp lệ</h3>
            </div>
            <ul className="mt-6 space-y-4">
              {validConditions.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-slate-200/80 bg-rose-50/60 p-8 dark:border-white/10 dark:bg-rose-500/[0.05] sm:border-l sm:border-t-0 sm:p-10">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500 text-white">
                <XCircle size={20} />
              </div>
              <h3 className="text-lg font-black text-rose-800 dark:text-rose-300">Từ chối bảo hành</h3>
            </div>
            <ul className="mt-6 space-y-4">
              {invalidConditions.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <XCircle size={16} className="mt-0.5 shrink-0 text-rose-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-600 to-indigo-700 p-10 text-center text-white shadow-2xl shadow-primary-900/20 sm:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_120%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-2xl font-black sm:text-3xl">Sản phẩm cần bảo hành?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Gửi yêu cầu ngay để đội ngũ kỹ thuật MediCare Store hỗ trợ nhanh nhất.
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-primary-700 shadow-lg transition hover:bg-slate-100 active:scale-95"
            >
              Yêu cầu bảo hành <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}