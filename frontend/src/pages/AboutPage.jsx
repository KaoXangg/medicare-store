import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, Heart, Target, Users, Zap, ShieldCheck, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { getImageUrl } from '../services/api';
import AnimatedButton from '../components/ui/AnimatedButton';

const FALLBACK = {
  hero: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1920&h=900&q=90',
  team: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&h=900&q=90',
  lab: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f3?auto=format&fit=crop&w=1200&h=800&q=90',
};

const stats = [
  { label: 'Khách hàng tin tưởng', value: 12000, suffix: '+' },
  { label: 'Sản phẩm chính hãng', value: 500, suffix: '+' },
  { label: 'Đối tác y tế', value: 50, suffix: '+' },
  { label: 'Năm kinh nghiệm', value: 8, suffix: '' },
];

function Counter({ end, suffix = '' }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.ceil(end / 50));
    const t = setInterval(() => {
      start += step;
      if (start >= end) {
        setN(end);
        clearInterval(t);
      } else setN(start);
    }, 28);
    return () => clearInterval(t);
  }, [end]);
  return (
    <span>
      {n.toLocaleString('vi-VN')}
      {suffix}
    </span>
  );
}

export default function AboutPage() {
  const [pageImages, setPageImages] = useState(FALLBACK);

  useEffect(() => {
    api.get('/pages/images')
      .then((r) => {
        const a = r.data?.about;
        if (a) {
          setPageImages({
            hero: a.hero || FALLBACK.hero,
            team: a.team || FALLBACK.team,
            lab: a.lab || FALLBACK.lab,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[min(480px,58vh)] overflow-hidden">
        <img
          src={getImageUrl(pageImages.hero)}
          alt="MediCare medical team"
          className="absolute inset-0 h-full w-full scale-105 object-cover object-[center_30%]"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK.hero;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/92 via-slate-950/82 to-cyan-950/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(14,165,233,0.22),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl text-white">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold backdrop-blur">
              <Stethoscope size={16} /> About MediCare Store
            </p>
            <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Nâng tầm chăm sóc sức khỏe tại nhà
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-200">
              Chúng tôi kết nối công nghệ y tế chính hãng với trải nghiệm mua sắm hiện đại — minh bạch, an toàn và tận tâm.
            </p>
            <AnimatedButton as={Link} to="/products" variant="secondary" className="mt-10 gap-2">
              Khám phá sản phẩm
            </AnimatedButton>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="group relative">
            <div className="absolute -inset-3 rounded-[2.25rem] bg-gradient-to-br from-primary-400/30 via-sky-400/10 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_28px_70px_-20px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/60 dark:border-white/10 dark:ring-white/10">
              <img
                src={getImageUrl(pageImages.team)}
                alt="Đội ngũ MediCare"
                className="aspect-[4/3] w-full object-cover object-[center_15%] transition duration-700 group-hover:scale-[1.02]"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK.team;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
            <div className="surface rounded-3xl p-8">
              <Target className="mb-4 text-primary-600" size={32} />
              <h2 className="text-2xl font-black">Sứ mệnh</h2>
              <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">
                Cung cấp thiết bị y tế chính hãng, giá minh bạch, tư vấn chuyên môn và dịch vụ hậu mãi chuẩn bệnh viện cho mọi gia đình Việt.
              </p>
            </div>
            <div className="surface rounded-3xl p-8">
              <Heart className="mb-4 text-rose-500" size={32} />
              <h2 className="text-2xl font-black">Tầm nhìn</h2>
              <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">
                Trở thành nền tảng thương mại y tế số hàng đầu Đông Nam Á — nơi chất lượng và sự tin cậy được đặt lên hàng đầu.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-50/90 py-20 dark:bg-slate-900/50 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black sm:text-4xl">Con số nói lên uy tín</h2>
            <p className="mt-3 text-slate-500">Đồng hành cùng phòng khám, bệnh viện và gia đình trên cả nước</p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="surface rounded-3xl p-6 text-center"
              >
                <p className="text-3xl font-black text-primary-600 sm:text-4xl">
                  <Counter end={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group relative">
            <div className="absolute -inset-3 rounded-[2.25rem] bg-gradient-to-br from-cyan-400/25 via-primary-400/10 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] shadow-[0_28px_70px_-20px_rgba(15,23,42,0.4)] ring-1 ring-slate-200/60 dark:ring-white/10">
              <img
                src={getImageUrl(pageImages.lab)}
                alt="Thiết bị y tế chất lượng"
                className="aspect-[5/3] w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK.lab;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-950/30 via-transparent to-transparent" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <h2 className="text-3xl font-black">Giá trị cốt lõi</h2>
            <div className="mt-8 space-y-4">
              {[
                { icon: Award, title: 'Chính hãng 100%', desc: 'Nguồn gốc rõ ràng, CO/CQ đầy đủ' },
                { icon: Zap, title: 'Giao nhanh toàn quốc', desc: 'Đóng gói chuẩn y tế, bảo hiểm vận chuyển' },
                { icon: Users, title: 'Tư vấn tận tâm', desc: 'Đội ngũ kỹ thuật hỗ trợ 24/7' },
                { icon: ShieldCheck, title: 'Bảo hành minh bạch', desc: 'Chính sách đổi trả rõ ràng' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-200/80 p-4 dark:border-white/10">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40">
                    <item.icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <AnimatedButton as={Link} to="/contact" className="mt-8">
              Liên hệ tư vấn
            </AnimatedButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
