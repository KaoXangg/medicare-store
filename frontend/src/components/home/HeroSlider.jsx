import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Autoplay, EffectFade, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles, Truck, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { getImageUrl } from '../../services/api';
import AnimatedButton from '../ui/AnimatedButton';
import { useRef, useState, useMemo } from 'react';
import 'swiper/css';
import 'swiper/css/effect-fade';

const fallbackSlides = [
  {
    BannerId: 'fb-1',
    Title: 'Thiết bị y tế cao cấp cho chăm sóc hiện đại',
    Subtitle: 'Công nghệ chính hãng, trải nghiệm mua sắm an tâm, giao nhanh toàn quốc.',
    ImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1800&h=1100&fit=crop',
    LinkUrl: '/products',
    Tag: 'Premium Healthcare 2026',
  },
  {
    BannerId: 'fb-2',
    Title: 'Chăm sóc sức khỏe bắt đầu từ thiết bị đúng',
    Subtitle: 'Hơn 10.000 thiết bị y tế từ các thương hiệu hàng đầu thế giới.',
    ImageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f3?w=1800&h=1100&fit=crop',
    LinkUrl: '/products',
    Tag: 'Hàng chính hãng',
  },
  {
    BannerId: 'fb-3',
    Title: 'Giải pháp y tế toàn diện cho gia đình',
    Subtitle: 'Máy đo huyết áp, nhiệt kế, máy xông và thiết bị chăm sóc tại nhà.',
    ImageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1800&h=1100&fit=crop',
    LinkUrl: '/products',
    Tag: 'Flash Sale tuần này',
  },
];

const trust = [
  { icon: ShieldCheck, label: 'Chuẩn y tế', sub: 'Được kiểm định' },
  { icon: BadgeCheck, label: 'Chính hãng', sub: '100% authentic' },
  { icon: Truck, label: 'Giao nhanh', sub: 'Toàn quốc' },
];

function isBannerActive(b) {
  return b.IsActive === true || b.IsActive === 1 || b.IsActive === undefined || b.IsActive === null;
}

function buildSlides(banners) {
  const active = (banners || []).filter(isBannerActive);
  if (!active.length) return fallbackSlides;
  return active.map((b, i) => ({
    ...b,
    Tag: b.Subtitle ? 'Medicare Store' : fallbackSlides[i % fallbackSlides.length]?.Tag,
  }));
}

export default function HeroSlider({ banners = [] }) {
  const slides = useMemo(() => buildSlides(banners), [banners]);
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = slides[activeIndex] || slides[0];

  return (
    <section className="relative min-h-[min(70svh,560px)] overflow-hidden bg-slate-950 sm:min-h-[min(78vh,680px)] lg:min-h-[min(88vh,780px)]">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary-600/20 blur-[80px] sm:h-[500px] sm:w-[500px] sm:blur-[100px]" />
        <div className="absolute -right-8 -top-8 h-56 w-56 rounded-full bg-sky-600/15 blur-[60px] sm:h-[400px] sm:w-[400px] sm:blur-[80px]" />
      </div>

      <Swiper
        modules={[Autoplay, EffectFade, Navigation]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop={slides.length > 1}
        speed={1400}
        autoplay={{ delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="hero-swiper relative min-h-[min(70svh,560px)] sm:min-h-[min(78vh,680px)] lg:min-h-[min(88vh,780px)]"
      >
        {slides.map((s, index) => (
          <SwiperSlide key={s.BannerId || `${s.Title}-${index}`}>
            <div className="relative min-h-[min(70svh,560px)] sm:min-h-[min(78vh,680px)] lg:min-h-[min(88vh,780px)]">
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={getImageUrl(s.ImageUrl)}
                  alt={s.Title || 'Banner'}
                  className={`hero-kenburns absolute inset-0 h-full w-full object-cover ${activeIndex === index ? 'is-active' : ''}`}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/25" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="pointer-events-none absolute inset-0 z-10 mx-auto flex max-w-7xl items-end px-4 py-12 sm:items-center sm:px-6 sm:py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide?.BannerId || activeIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto w-full max-w-3xl text-white"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/10 px-4 py-2 text-sm font-semibold text-primary-200 backdrop-blur-xl">
              <Sparkles size={14} className="text-primary-300" />
              {slide?.Tag || 'MediCare Store'}
            </div>
            <h1 className="text-3xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.75rem]">
              {slide?.Title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {slide?.Subtitle}
            </p>
            <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap">
              <AnimatedButton as={Link} to={slide?.LinkUrl || '/products'} className="premium-glow w-full justify-center gap-2.5 px-6 py-3.5 sm:w-auto">
                Khám phá sản phẩm <ArrowRight size={17} />
              </AnimatedButton>
              <AnimatedButton as={Link} to="/contact" variant="secondary" className="w-full justify-center gap-2.5 px-6 py-3.5 sm:w-auto">
                <Play size={14} className="fill-current" /> Tư vấn ngay
              </AnimatedButton>
            </div>
            <div className="mt-6 hidden flex-wrap gap-2.5 sm:mt-8 sm:flex">
              {trust.map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-3.5 py-2 backdrop-blur-xl">
                  <item.icon size={15} className="text-primary-300" />
                  <div>
                    <p className="text-xs font-black">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-20 mx-auto max-w-7xl px-4 sm:bottom-8 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => swiperRef.current?.slideToLoop(i)}
                  className="relative h-1.5 overflow-hidden rounded-full transition-all duration-300"
                  style={{ width: i === activeIndex ? '2.5rem' : '0.5rem' }}
                  aria-label={`Slide ${i + 1}`}
                >
                  <span className="absolute inset-0 rounded-full bg-white/25" />
                  {i === activeIndex && (
                    <motion.span
                      key={`prog-${activeIndex}`}
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-400 to-sky-400"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 5.5, ease: 'linear' }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => swiperRef.current?.slidePrev()} className="hero-nav-btn" aria-label="Trước">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => swiperRef.current?.slideNext()} className="hero-nav-btn" aria-label="Sau">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
