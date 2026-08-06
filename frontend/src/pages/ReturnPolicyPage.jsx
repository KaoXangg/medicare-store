import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  CheckCircle2, XCircle, PackageCheck, Truck, Wallet,
  ClipboardList, PhoneCall, ShieldAlert, ArrowRight,
} from 'lucide-react';
import AnimatedButton from '../components/ui/AnimatedButton';
import api, { getImageUrl } from '../services/api';

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&h=820&q=90';

const RETURN_WINDOW_DAYS = 30;

const conditions = [
  {
    icon: PackageCheck,
    title: 'Nguyên tem, hộp, phụ kiện',
    desc: 'Sản phẩm chưa qua sử dụng, còn đầy đủ tem chống hàng giả, hộp, sách hướng dẫn và phụ kiện đi kèm.',
  },
  {
    icon: ClipboardList,
    title: `Trong vòng ${RETURN_WINDOW_DAYS} ngày`,
    desc: 'Tính từ ngày nhận hàng thành công theo xác nhận của đơn vị vận chuyển.',
  },
  {
    icon: ShieldAlert,
    title: 'Lỗi do nhà sản xuất',
    desc: 'Sản phẩm bị lỗi kỹ thuật, hư hỏng do vận chuyển, hoặc giao sai mẫu/sai thông số so với đơn hàng.',
  },
];

const eligible = [
  'Còn nguyên tem niêm phong, hộp và phụ kiện gốc',
  'Trong vòng 30 ngày kể từ ngày nhận hàng',
  'Lỗi kỹ thuật, hư hỏng vận chuyển, giao sai sản phẩm',
];

const notEligible = [
  'Đã qua sử dụng, trầy xước, va đập do người dùng',
  'Vật tư tiêu hao dùng một lần (kim tiêm, que test, khẩu trang...)',
  'Quá 30 ngày hoặc tự ý tháo lắp, sửa chữa',
];

const steps = [
  { icon: PhoneCall, title: 'Liên hệ yêu cầu', desc: 'Gọi 1900 1234 hoặc gửi form Liên hệ kèm mã đơn hàng.', time: 'Ngay lập tức' },
  { icon: ClipboardList, title: 'Xác nhận & lấy hàng', desc: 'Nhân viên xác nhận và đến lấy sản phẩm hoặc hướng dẫn gửi bưu điện.', time: 'Trong 24h' },
  { icon: PackageCheck, title: 'Kiểm tra sản phẩm', desc: 'Bộ phận kỹ thuật kiểm tra tình trạng thực tế sản phẩm.', time: '2–3 ngày' },
  { icon: Wallet, title: 'Hoàn tiền / đổi mới', desc: 'Hoàn 100% qua phương thức thanh toán gốc, hoặc đổi sản phẩm mới.', time: '3–5 ngày' },
];

function ReturnDial({ days = RETURN_WINDOW_DAYS }) {
  const r = 86;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
        <motion.circle
          cx="100" cy="100" r={r} fill="none" stroke="url(#dialGradient)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="dialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-6xl font-black tabular-nums text-white sm:text-7xl">{days}</span>
        <span className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-sky-200">Ngày đổi trả</span>
      </div>
    </div>
  );
}

export default function ReturnPolicyPage() {
  const [heroImage, setHeroImage] = useState(FALLBACK_HERO);

  useEffect(() => {
    api.get('/pages/images')
      .then((r) => {
        const hero = r.data?.returnPolicy?.hero;
        if (hero) setHeroImage(hero);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="overflow-hidden">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <img
          src={getImageUrl(heroImage)}
          alt="Chính sách đổi trả MediCare Store"
          className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
          loading="eager"
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_HERO; }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/94 via-slate-950/88 to-cyan-950/78" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(56,189,248,0.2),transparent_50%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-32">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-white">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] backdrop-blur">
              Chính sách hậu mãi
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] sm:text-5xl lg:text-[3.4rem]">
              Đổi trả không phiền phức,
              <br className="hidden sm:block" /> minh bạch từng bước.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
              Không hài lòng vì bất kỳ lý do nào liên quan đến chất lượng hoặc lỗi giao hàng — MediCare Store nhận lại trong vòng 30 ngày, không hỏi nhiều câu.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <AnimatedButton as={Link} to="/contact" className="gap-2">
                Bắt đầu yêu cầu đổi trả <ArrowRight size={16} />
              </AnimatedButton>
              <a href="#dieu-kien" className="inline-flex items-center rounded-2xl border border-white/20 px-6 py-3 text-sm font-bold text-white/90 backdrop-blur transition hover:bg-white/10">
                Xem điều kiện
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.6 }}>
            <ReturnDial />
          </motion.div>
        </div>
      </section>

      {/* ── ĐIỀU KIỆN ── */}
      <section id="dieu-kien" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary-600">Điều kiện áp dụng</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Ba tiêu chí, một chính sách rõ ràng</h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-200/80 dark:border-white/10 dark:bg-white/10 sm:grid-cols-3">
          {conditions.map((c) => (
            <div key={c.title} className="bg-white p-8 dark:bg-slate-900">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/40">
                <c.icon size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUY TRÌNH — timeline liền mạch ── */}
      <section className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Quy trình 4 bước</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Từ lúc gọi đến lúc nhận lại tiền</h2>
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

      {/* ── SO SÁNH ĐỦ ĐIỀU KIỆN / KHÔNG ĐỦ — split panel ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary-600">Đối chiếu nhanh</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Sản phẩm của bạn có đủ điều kiện?</h2>
        </div>
        <div className="grid overflow-hidden rounded-[1.75rem] border border-slate-200/80 shadow-xl shadow-slate-900/5 dark:border-white/10 sm:grid-cols-2">
          <div className="bg-emerald-50/70 p-8 dark:bg-emerald-500/[0.06] sm:p-10">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-300">Đủ điều kiện</h3>
            </div>
            <ul className="mt-6 space-y-4">
              {eligible.map((item) => (
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
              <h3 className="text-lg font-black text-rose-800 dark:text-rose-300">Không áp dụng</h3>
            </div>
            <ul className="mt-6 space-y-4">
              {notEligible.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <XCircle size={16} className="mt-0.5 shrink-0 text-rose-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="surface flex items-start gap-3 rounded-2xl p-5">
            <Truck size={18} className="mt-0.5 shrink-0 text-primary-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white">Miễn phí vận chuyển</span> nếu lỗi do MediCare Store.
            </p>
          </div>
          <div className="surface flex items-start gap-3 rounded-2xl p-5">
            <Wallet size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Hoàn tiền 3–7 ngày làm việc qua đúng phương thức thanh toán ban đầu.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-600 to-indigo-700 p-10 text-center text-white shadow-2xl shadow-primary-900/20 sm:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_120%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-2xl font-black sm:text-3xl">Cần hỗ trợ đổi trả?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Đội ngũ chăm sóc khách hàng MediCare Store sẵn sàng hỗ trợ bạn 24/7.
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-primary-700 shadow-lg transition hover:bg-slate-100 active:scale-95"
            >
              Liên hệ tư vấn <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}