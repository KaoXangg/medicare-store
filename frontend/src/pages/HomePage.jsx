import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award, BadgePercent, ChevronDown, ChevronLeft, ChevronRight, Flame,
  HeartPulse, MessageCircle, Shield, Star, Timer, Truck, Zap,
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useAddToCart, useBuyNow } from '../hooks/useBuyNow';
import toast from 'react-hot-toast';
import HeroSlider from '../components/home/HeroSlider';
import CategoryMarquee from '../components/home/CategoryMarquee';
import BrandCarousel from '../components/home/BrandCarousel';
import AnimatedButton from '../components/ui/AnimatedButton';

const features = [
  { icon: Shield, title: 'Chính hãng 100%', desc: 'Nguồn gốc rõ ràng, chứng từ đầy đủ.' },
  { icon: HeartPulse, title: 'Chuẩn y tế', desc: 'Sản phẩm phù hợp chăm sóc gia đình và phòng khám.' },
  { icon: Award, title: 'Bảo hành cao cấp', desc: 'Hỗ trợ kỹ thuật, bảo trì và đổi trả minh bạch.' },
  { icon: Truck, title: 'Giao nhanh', desc: 'Miễn phí vận chuyển cho đơn hàng từ 1 triệu.' },
];

const faqs = [
  {
    q: 'Sản phẩm có bảo hành chính hãng không?',
    a: 'Có. Mỗi sản phẩm đều có thông tin bảo hành, hóa đơn và hỗ trợ kỹ thuật rõ ràng.',
  },
  {
    q: 'Tôi có thể được tư vấn thiết bị phù hợp không?',
    a: 'Có. Bạn có thể liên hệ đội tư vấn để chọn sản phẩm theo nhu cầu.',
  },
  {
    q: 'Có hỗ trợ thanh toán COD không?',
    a: 'Có. Website hỗ trợ COD và mô phỏng thanh toán online trong bản hiện tại.',
  },
];

function FlashSaleCountdown({ endTime, onEndedChange }) {
  const calc = () => {
    let end = endTime ? new Date(endTime).getTime() : NaN;
    if (!Number.isFinite(end)) end = Date.now() + 8 * 3600 * 1000; // fallback an toàn nếu endTime lỗi/thiếu
    const diff = Math.max(0, Math.floor((end - Date.now()) / 1000));
    return {
      d: Math.floor(diff / 86400),
      h: Math.floor((diff % 86400) / 3600),
      m: Math.floor((diff % 3600) / 60),
      s: diff % 60,
      ended: diff <= 0,
    };
  };
  const [time, setTime] = useState(calc());

  useEffect(() => {
    const first = calc();
    setTime(first);
    onEndedChange?.(first.ended);
    const timer = setInterval(() => {
      const next = calc();
      setTime(next);
      onEndedChange?.(next.ended);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const units = [
    ...(time.d > 0 ? [['Ngày', time.d]] : []),
    ['Giờ', time.h],
    ['Phút', time.m],
    ['Giây', time.s],
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {units.map(([label, value], i) => (
        <div key={label} className="flex items-center gap-1.5 sm:gap-2">
          <div className="min-w-[44px] rounded-xl border border-white/15 bg-white/10 px-2.5 py-2 text-center shadow-inner backdrop-blur-md sm:min-w-[54px] sm:rounded-2xl sm:px-3.5 sm:py-2.5">
            <p className="text-lg font-black tabular-nums sm:text-2xl">{String(value).padStart(2, '0')}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-primary-100 sm:text-[10px]">{label}</p>
          </div>
          {i < units.length - 1 && <span className="text-base font-black text-white/30 sm:text-xl">:</span>}
        </div>
      ))}
    </div>
  );
}

// Dãy sản phẩm cuộn ngang tự trôi chậm rãi (marquee), dừng lại khi rê chuột vào để chọn
// Dùng chung cho Flash Sale, Sản phẩm nổi bật, Bán chạy nhất
function ProductMarqueeRow({ products, onBuyNow, onAddCart, rank = false }) {
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef(null);
  const jumpTimeoutRef = useRef(null);

  const canLoop = products.length > 1;
  const loopProducts = canLoop ? [...products, ...products] : products;

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  useEffect(() => {
    if (!canLoop) return undefined;
    const track = trackRef.current;
    if (!track) return undefined;

    halfWidthRef.current = track.scrollWidth / 2;

    const SPEED = 0.6;
    const step = () => {
      if (!pausedRef.current && track) {
        offsetRef.current += SPEED;
        if (offsetRef.current >= halfWidthRef.current) offsetRef.current -= halfWidthRef.current;
        track.style.transform = `translateX(-${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canLoop, products.length]);

  const jump = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const half = halfWidthRef.current || track.scrollWidth / 2;
    const step = 270 * dir;
    let next = offsetRef.current + step;
    if (next < 0) next += half;
    if (next >= half) next -= half;
    offsetRef.current = next;

    track.style.transition = 'transform 0.45s cubic-bezier(0.22,1,0.36,1)';
    track.style.transform = `translateX(-${next}px)`;

    clearTimeout(jumpTimeoutRef.current);
    jumpTimeoutRef.current = setTimeout(() => {
      if (track) track.style.transition = '';
    }, 460);
  };

  return (
    <div
      className="group/row relative"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      onTouchCancel={resume}
    >
      <div className="overflow-hidden">
        <div ref={trackRef} className="flex w-max gap-5 pb-2 pt-4 will-change-transform">
          {loopProducts.map((p, i) => (
            <motion.div
              key={`${p.ProductId}-${i}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: (i % products.length) * 0.06, duration: 0.4 }}
              className="relative w-[230px] shrink-0 sm:w-[250px]"
            >
              {rank && (
                <span className="absolute -left-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-black text-white shadow-lg ring-4 ring-white dark:ring-slate-900">
                  {(i % products.length) + 1}
                </span>
              )}
              <ProductCard product={p} onBuyNow={onBuyNow} onAddCart={onAddCart} />
            </motion.div>
          ))}
        </div>
      </div>

      {products.length > 2 && (
        <>
          <button
            type="button"
            onClick={() => jump(-1)}
            aria-label="Xem sản phẩm trước"
            className="absolute left-1 top-[38%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 opacity-80 shadow-lg backdrop-blur transition hover:scale-105 hover:opacity-100 hover:shadow-xl active:scale-95 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300 sm:-left-4 sm:h-10 sm:w-10 sm:opacity-0 sm:group-hover/row:opacity-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => jump(1)}
            aria-label="Xem sản phẩm tiếp theo"
            className="absolute right-1 top-[38%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 opacity-80 shadow-lg backdrop-blur transition hover:scale-105 hover:opacity-100 hover:shadow-xl active:scale-95 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300 sm:-right-4 sm:h-10 sm:w-10 sm:opacity-0 sm:group-hover/row:opacity-100"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const [home, setHome] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [flashSaleEnded, setFlashSaleEnded] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const buyNow = useBuyNow();
  const addToCartHandler = useAddToCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/home').then((r) => setHome(r.data)).catch(() => setHome({ banners: [], categories: [] }));
    api.get('/products/featured?limit=12').then((r) => setFeatured(r.data || [])).catch(() => setFeatured([]));
    api.get('/products/popular?limit=12').then((r) => setPopular(r.data || [])).catch(() => setPopular([]));
  }, []);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterLoading(true);
    try {
      const res = await api.post('/newsletter/subscribe', { email: newsletterEmail.trim() });
      toast.success(res.message || 'Đăng ký thành công');
      setNewsletterEmail('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Không giới hạn cứng số lượng — hiện toàn bộ sản phẩm admin đã ghim trong Flash Sale
  const flashSaleProducts = home?.flashSale?.length ? home.flashSale : popular;

  return (
    <div className="overflow-hidden">
      <HeroSlider banners={home?.banners || []} />

      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="surface premium-glow rounded-3xl p-6"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-extrabold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end" data-aos="fade-up">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-primary-600">Medical Categories</p>
            <h2 className="section-title max-w-2xl text-slate-950 dark:text-white">
              Danh mục thiết bị cho mọi nhu cầu chăm sóc
            </h2>
          </div>
          <Link to="/products" className="font-bold text-primary-700 hover:text-primary-500">
            Xem toàn bộ sản phẩm →
          </Link>
        </div>
        <CategoryMarquee categories={home?.categories || []} />
      </section>

      <section className="bg-white/60 py-24 backdrop-blur dark:bg-slate-900/45">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end" data-aos="fade-up">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-primary-600">Featured</p>
              <h2 className="section-title">Sản phẩm nổi bật</h2>
            </div>
            <AnimatedButton as={Link} to="/products?featured=true" variant="secondary">
              Xem tất cả
            </AnimatedButton>
          </div>
          {featured.length ? (
            <ProductMarqueeRow products={featured} onBuyNow={buyNow} onAddCart={addToCartHandler} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <ProductCardSkeleton key={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ FLASH SALE — thiết kế lại ══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">

          {/* Banner đếm ngược */}
          <div
            className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-600 via-blue-600 to-slate-950 p-8 text-white shadow-2xl shadow-primary-900/25 md:p-10"
            data-aos="fade-right"
          >
            {/* Hoạ tiết chấm bi mờ */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }}
            />
            {/* Glow trang trí */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-blue-400/25 blur-3xl" />

            {/* Icon phần trăm có vòng xoay */}
            <div className="absolute right-6 top-6 h-16 w-16">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-dashed border-white/25"
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-2 grid place-items-center rounded-full bg-white/10 backdrop-blur">
                <BadgePercent size={26} />
              </div>
            </div>

            <div className="relative">
              <span
                className={`mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold backdrop-blur ${
                  flashSaleEnded ? 'bg-white/10 text-white/70' : 'bg-white/12'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {!flashSaleEnded && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${flashSaleEnded ? 'bg-slate-400' : 'bg-emerald-400'}`} />
                </span>
                {flashSaleEnded ? 'Đã kết thúc' : 'Đang diễn ra'}
              </span>

              <div className="mb-6">
                <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-100">
                  <Timer size={14} /> {flashSaleEnded ? 'Chương trình đã kết thúc' : 'Kết thúc trong'}
                </div>
                <FlashSaleCountdown endTime={home?.flashSaleEnd} onEndedChange={setFlashSaleEnded} />
              </div>

              <h2 className="section-title max-w-xl leading-tight">
                {flashSaleEnded ? 'Flash Sale đã kết thúc' : 'Flash Sale — Giảm giá sốc'}
              </h2>
              <p className="mt-5 max-w-lg text-primary-50">
                {flashSaleEnded
                  ? 'Chương trình đã khép lại. Đón chờ đợt Flash Sale tiếp theo nhé!'
                  : 'Sản phẩm đang giảm giá, số lượng có hạn.'}
              </p>

              <div className="mt-8 h-px w-full max-w-xs bg-gradient-to-r from-white/25 to-transparent" />

              {!flashSaleEnded && (
                <AnimatedButton as={Link} to="/products?sort=price-asc" variant="dark" className="mt-6">
                  Mua deal hôm nay <Zap size={18} />
                </AnimatedButton>
              )}
            </div>
          </div>

          {/* Deal hôm nay */}
          <div data-aos="fade-left" className="min-w-0">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.28em] text-primary-600">
                  <Flame size={14} /> Flash Sale
                </p>
                <h2 className="text-3xl font-black">Deal hôm nay</h2>
              </div>
              <Link to="/products" className="font-bold text-primary-700 hover:text-primary-500">Xem thêm →</Link>
            </div>

            {flashSaleProducts.length ? (
              <ProductMarqueeRow products={flashSaleProducts} onBuyNow={buyNow} onAddCart={addToCartHandler} rank />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => <ProductCardSkeleton key={i} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70 bg-white/60 py-24 backdrop-blur dark:border-white/10 dark:bg-slate-900/45">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-primary-600">Best Sellers</p>
              <h2 className="section-title">Bán chạy nhất</h2>
            </div>
            <Link to="/products?sort=bestselling" className="font-bold text-primary-700">Xem tất cả →</Link>
          </div>
          {popular.length ? (
            <ProductMarqueeRow products={popular} onBuyNow={buyNow} onAddCart={addToCartHandler} rank />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <ProductCardSkeleton key={i} />)}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-br from-primary-700 via-blue-700 to-slate-950 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center" data-aos="fade-up">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-primary-100">Testimonials</p>
            <h2 className="section-title">Khách hàng tin tưởng MediCare Store</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {(home?.testimonials || []).map((t) => (
              <div key={t.TestimonialId} className="card-hover rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
                <div className="mb-4 flex gap-1 text-amber-300">
                  {[...Array(t.Rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="mb-5 text-sm leading-6 text-primary-50">"{t.Content}"</p>
                <p className="font-extrabold">{t.CustomerName}</p>
                <p className="text-sm text-primary-100">{t.Role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="surface neuro-card rounded-[2rem] p-8" data-aos="fade-up">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-primary-600">Medical Brands</p>
              <h2 className="section-title">Thương hiệu y tế được tin cậy</h2>
            </div>
            <p className="max-w-md text-slate-500 dark:text-slate-400">Trải nghiệm mua sắm chuẩn quốc tế cho các thương hiệu thiết bị y tế cao cấp.</p>
          </div>
          <BrandCarousel brands={home?.brands || []} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="surface neuro-card grid gap-8 rounded-[2rem] p-8 lg:grid-cols-2" data-aos="fade-up">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-primary-600">Tư vấn chuyên sâu</p>
            <h2 className="section-title">Cần hỗ trợ chọn thiết bị y tế?</h2>
            <p className="mt-5 text-slate-500 dark:text-slate-400">
              Đội ngũ tư vấn MediCare sẵn sàng hỗ trợ bạn chọn sản phẩm phù hợp, hướng dẫn sử dụng và chính sách bảo hành.
            </p>
            <ul className="mt-6 space-y-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><Shield size={18} className="text-primary-500" /> Tư vấn miễn phí theo nhu cầu</li>
              <li className="flex items-center gap-2"><HeartPulse size={18} className="text-primary-500" /> Hướng dẫn sử dụng an toàn</li>
              <li className="flex items-center gap-2"><Truck size={18} className="text-primary-500" /> Hỗ trợ sau bán hàng nhanh chóng</li>
            </ul>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <Link to="/contact" className="surface card-hover flex items-center gap-4 rounded-3xl p-6">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <MessageCircle size={26} />
              </span>
              <div>
                <p className="text-sm font-bold text-primary-600">Liên hệ ngay</p>
                <h3 className="text-xl font-extrabold">Gửi yêu cầu tư vấn</h3>
                <p className="mt-1 text-sm text-slate-500">Phản hồi trong vòng 24 giờ làm việc</p>
              </div>
            </Link>
            <Link to="/products" className="surface card-hover flex items-center gap-4 rounded-3xl p-6">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Zap size={26} />
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-600">Khám phá</p>
                <h3 className="text-xl font-extrabold">Xem toàn bộ sản phẩm</h3>
                <p className="mt-1 text-sm text-slate-500">Hàng nghìn thiết bị y tế chính hãng</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="mb-10 text-center" data-aos="fade-up">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-primary-600">FAQ</p>
          <h2 className="section-title">Câu hỏi thường gặp</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.q} className="surface group rounded-3xl p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black">
                {faq.q}
                <ChevronDown className="transition group-open:rotate-180" />
              </summary>
              <p className="mt-4 leading-7 text-slate-500 dark:text-slate-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-primary-300">Newsletter</p>
              <h2 className="text-3xl font-black md:text-4xl">Nhận ưu đãi và kiến thức chăm sóc sức khỏe</h2>
            </div>
            <form onSubmit={handleNewsletter} className="flex w-full max-w-md flex-col gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur sm:max-w-lg sm:flex-row">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-4 outline-none placeholder:text-slate-400"
                placeholder="Email của bạn"
              />
              <AnimatedButton type="submit" disabled={newsletterLoading}>
                {newsletterLoading ? '...' : 'Đăng ký'}
              </AnimatedButton>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}