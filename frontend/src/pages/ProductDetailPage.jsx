import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus, Plus, ShieldCheck, ShoppingCart, Star, Truck,
  ZoomIn, Award, RotateCcw, ChevronRight, CheckCircle2,
  Heart, Zap,
} from 'lucide-react';
import api, { getImageUrl } from '../services/api';
import { formatPrice } from '../utils/format';
import { useAddToCart, useBuyNow } from '../hooks/useBuyNow';
import ProductCard from '../components/product/ProductCard';
import ProductReviewSection from '../components/product/ProductReviewSection';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../services/activityTracker';
import toast from 'react-hot-toast';

/* ────────────── Image Zoom ────────────── */
function ImageZoom({ src, alt }) {
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  return (
    <div
      className="group relative h-full w-full cursor-zoom-in overflow-hidden"
      onMouseEnter={() => setZoom(true)}
      onMouseLeave={() => setZoom(false)}
      onMouseMove={onMove}
    >
      <img
        src={src} alt={alt}
        className="h-full w-full object-contain transition-transform duration-500 ease-out p-8"
        style={zoom ? { transform: 'scale(1.9)', transformOrigin: `${pos.x}% ${pos.y}%` } : undefined}
      />
      <span className="pointer-events-none absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-xl bg-white/80 text-slate-500 opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100 dark:bg-slate-800/80">
        <ZoomIn size={15} />
      </span>
    </div>
  );
}

/* ────────────── Main Page ────────────── */
export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState('specs');
  const [wishlisted, setWishlisted] = useState(false);
  const { user } = useAuth();
  const buyNow = useBuyNow();
  const addToCartHandler = useAddToCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/products/${slug}`).then((r) => {
      setProduct(r.data);
      setActiveImg(0);
      trackEvent('product_view', {
        productId: r.data.ProductId,
        productName: r.data.Name,
      });
      const { CategorySlug, CategoryId } = r.data || {};
      if (CategorySlug || CategoryId) {
        const q = CategorySlug ? `category=${CategorySlug}&limit=5` : `category=${CategoryId}&limit=5`;
        api.get(`/products?${q}`).then((res) =>
          setRelated((res.data || []).filter((p) => p.Slug !== slug).slice(0, 4))
        );
      }
    });
  }, [slug]);

  if (!product) return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-5 pt-2">
          {[32, 64, 24, 48, 80, 40].map((w, i) => (
            <div key={i} className={`h-4 w-${w} animate-pulse rounded-full bg-slate-200 dark:bg-slate-800`} />
          ))}
        </div>
      </div>
    </div>
  );

  const images = product.images?.length ? product.images : [{ ImageUrl: null }];
  const price   = product.effectivePrice ?? product.SalePrice ?? product.Price;
  const specs   = product.specifications || {};
  const discountPct = product.SalePrice && product.Price
    ? Math.round(((product.Price - product.SalePrice) / product.Price) * 100) : 0;
  const avgRating = Number(product.AverageRating || 0);

  const handleAdd = async (buyNowFlow = false) => {
    if (!user) { toast.error('Vui lòng đăng nhập'); navigate('/login'); return; }
    if (buyNowFlow) {
      trackEvent('buy_now', { productId: product.ProductId, productName: product.Name });
      await buyNow(product, qty);
      return;
    }
    await addToCartHandler(product, qty);
  };

  const trust = [
    { icon: Truck,       label: 'Giao nhanh 24–48h',    sub: 'Toàn quốc miễn phí'   },
    { icon: ShieldCheck, label: 'Bảo hành chính hãng',  sub: 'Cam kết 100% authentic' },
    { icon: RotateCcw,   label: 'Đổi trả 30 ngày',      sub: 'Không cần lý do'        },
    { icon: Award,       label: 'Kiểm định y tế',        sub: 'Tiêu chuẩn quốc gia'   },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">

      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-xs text-slate-400">
        <Link to="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-primary-600 transition-colors">Sản phẩm</Link>
        {product.CategoryName && <>
          <ChevronRight size={12} />
          <Link to={`/products?category=${product.CategorySlug || ''}`} className="hover:text-primary-600 transition-colors">
            {product.CategoryName}
          </Link>
        </>}
        <ChevronRight size={12} />
        <span className="max-w-[180px] truncate font-medium text-slate-600 dark:text-slate-300">{product.Name}</span>
      </nav>

      {/* ══════ MAIN GRID — 50/50 trên desktop ══════ */}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16">

        {/* ── CỘT TRÁI: hình ── */}
        <div className="flex flex-col gap-4">

          {/* Khung ảnh chính — tỉ lệ vuông, chiều cao cố định */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100/50 shadow-lg shadow-slate-200/60 dark:border-white/8 dark:from-slate-900 dark:to-slate-800/60 dark:shadow-none"
            style={{ aspectRatio: '1 / 1' }}
          >
            <ImageZoom src={getImageUrl(images[activeImg]?.ImageUrl)} alt={product.Name} />

            {/* Discount badge */}
            {discountPct > 0 && (
              <div className="absolute left-4 top-4 rounded-xl bg-rose-500 px-3 py-1 text-xs font-black text-white shadow-md shadow-rose-500/30">
                -{discountPct}%
              </div>
            )}

            {/* Wishlist */}
            <button
              type="button"
              onClick={() => setWishlisted(v => !v)}
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 shadow-md backdrop-blur-sm transition hover:scale-110 active:scale-95 dark:bg-slate-800/90"
            >
              <Heart size={18} className={wishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
            </button>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition-all duration-200 dark:bg-slate-900 sm:h-20 sm:w-20 ${
                    i === activeImg
                      ? 'border-primary-500 shadow-md shadow-primary-500/20 scale-105'
                      : 'border-slate-200/60 hover:border-primary-300 dark:border-white/10'
                  }`}
                >
                  <img src={getImageUrl(img.ImageUrl)} alt="" className="h-full w-full object-contain p-2" />
                </button>
              ))}
            </div>
          )}

        </div>

        {/* ── CỘT PHẢI: thông tin ── */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit">

          {/* Brand + Category tags */}
          <div className="flex flex-wrap items-center gap-2">
            {product.CategoryName && (
              <Link
                to={`/products?category=${product.CategorySlug || ''}`}
                className="rounded-full bg-primary-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary-600 hover:bg-primary-100 transition-colors dark:bg-primary-950/40 dark:text-primary-400"
              >
                {product.CategoryName}
              </Link>
            )}
            {product.BrandName && (
              <Link
                to={`/products?brand=${product.BrandSlug || ''}`}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 transition-colors hover:border-primary-300 dark:border-white/10 dark:bg-slate-800/60"
                title={product.BrandName}
              >
                {product.BrandLogo ? (
                  <span className="flex h-6 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white dark:bg-white/90">
                    <img
                      src={getImageUrl(product.BrandLogo)}
                      alt={product.BrandName}
                      className="h-full w-full object-contain"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </span>
                ) : (
                  <span className="px-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">{product.BrandName}</span>
                )}
              </Link>
            )}
          </div>

          {/* Tên + SKU */}
          <div>
            <h1 className="text-2xl font-black leading-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem]">
              {product.Name}
            </h1>
            {product.SKU && (
              <p className="mt-2 text-xs text-slate-400">
                SKU: <span className="font-mono font-semibold text-slate-500 dark:text-slate-300">{product.SKU}</span>
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15}
                  className={i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'}
                />
              ))}
            </div>
            {avgRating > 0 && (
              <span className="text-sm font-bold text-amber-500">{avgRating.toFixed(1)}</span>
            )}
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <button
              type="button"
              onClick={() => setTab('reviews')}
              className="text-sm text-slate-500 hover:text-primary-600 transition-colors"
            >
              {product.ReviewCount || 0} đánh giá
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 dark:bg-white/8" />

          {/* Giá */}
          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-black text-primary-600 dark:text-primary-400 sm:text-4xl">
                {formatPrice(price)}
              </span>
              {product.SalePrice && product.Price && (
                <span className="text-lg font-semibold text-slate-400 line-through">{formatPrice(product.Price)}</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {discountPct > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                  Tiết kiệm {discountPct}%
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${product.Stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                <CheckCircle2 size={14} />
                {product.Stock > 0 ? `Còn ${product.Stock} sản phẩm` : 'Hết hàng'}
              </span>
            </div>
          </div>

          {/* Mô tả */}
          {product.Description && (
            <p className="text-[15px] leading-7 text-slate-600 dark:text-slate-300">{product.Description}</p>
          )}

          {/* Divider */}
          <div className="h-px bg-slate-100 dark:bg-white/8" />

          {/* Qty + Buttons */}
          <div className="space-y-3">
            {/* Qty picker */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="flex h-11 w-11 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-base font-black text-slate-900 dark:text-white select-none">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(q => Math.min(product.Stock, q + 1))}
                  disabled={qty >= product.Stock}
                  className="flex h-11 w-11 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-xs text-slate-400">Tối đa {product.Stock}</span>
            </div>

            {/* Mua ngay + Thêm vào giỏ */}
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Mua ngay */}
              <motion.button
                type="button"
                onClick={() => handleAdd(true)}
                disabled={!product.Stock}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="group relative flex-[1.2] overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-3.5 text-[15px] font-black text-white shadow-lg shadow-primary-500/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {/* Hiệu ứng ánh sáng lướt qua khi hover */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <span className="relative flex items-center justify-center gap-2.5">
                  <Zap size={19} className="fill-white" />
                  Mua ngay
                </span>
              </motion.button>

              {/* Thêm vào giỏ */}
              <motion.button
                type="button"
                onClick={() => handleAdd(false)}
                disabled={!product.Stock}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl border-2 border-primary-200 bg-white px-6 py-3.5 text-[15px] font-black text-primary-700 transition-colors duration-200 hover:border-primary-400 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-800/50 dark:bg-transparent dark:text-primary-300 dark:hover:bg-primary-950/20"
              >
                <ShoppingCart size={19} />
                Thêm vào giỏ hàng
              </motion.button>
            </div>
          </div>

        </aside>
      </div>

      {/* ══════ Trust badges — dải full-width, trải đều 4 cột ══════ */}
      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200/70 shadow-sm shadow-slate-200/50 dark:border-white/8 dark:shadow-none">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {trust.map(({ icon: Icon, label, sub }, i) => (
            <div
              key={label}
              className={`group flex min-h-[92px] items-center gap-3.5 bg-white p-5 transition-colors duration-200 hover:bg-primary-50/60 dark:bg-slate-900/60 dark:hover:bg-primary-950/20 ${
                i % 2 === 0 ? 'border-r' : ''
              } sm:border-r sm:last:border-r-0 ${
                i < 2 ? 'border-b sm:border-b-0' : ''
              } border-slate-100 dark:border-white/8`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-500 shadow-md shadow-primary-500/25 transition-transform duration-200 group-hover:scale-110">
                <Icon size={19} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="whitespace-nowrap text-sm font-black leading-tight text-slate-800 dark:text-slate-100">{label}</p>
                <p className="whitespace-nowrap text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════ TABS ══════ */}
      <section className="mt-16">
        <div className="flex gap-1 border-b border-slate-200 dark:border-white/8">
          {[
            { id: 'specs',   label: 'Thông số kỹ thuật' },
            { id: 'reviews', label: `Đánh giá (${product.ReviewCount || 0})` },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative px-5 py-3.5 text-sm font-black transition-colors ${
                tab === t.id
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <motion.span
                  layoutId="tab-line"
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-primary-500 to-indigo-500"
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {tab === 'specs' && (
              <motion.div key="specs" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                {Object.keys(specs).length > 0 ? (
                  <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/8">
                    {Object.entries(specs).map(([k, v], i) => (
                      <div key={k} className={`flex flex-col border-b last:border-0 border-slate-100 dark:border-white/5 sm:grid sm:grid-cols-[220px_1fr] ${i % 2 === 0 ? 'bg-slate-50/60 dark:bg-slate-900/40' : 'bg-white dark:bg-slate-800/20'}`}>
                        <span className="p-4 text-sm font-black capitalize text-slate-600 dark:text-slate-300 sm:p-5">{k}</span>
                        <span className="px-4 pb-4 pt-0 text-sm text-slate-700 dark:text-slate-200 sm:border-l sm:border-slate-100 sm:p-5 dark:sm:border-white/5">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center dark:border-white/10">
                    <p className="text-slate-400">Chưa có thông số kỹ thuật.</p>
                  </div>
                )}
              </motion.div>
            )}
            {tab === 'reviews' && (
              <motion.div key="reviews" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <ProductReviewSection productId={product.ProductId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ══════ Sản phẩm liên quan ══════ */}
      {related.length > 0 && (
        <section className="mt-20">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-primary-500 dark:text-primary-400">
                Có thể bạn thích
              </p>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Sản phẩm liên quan
              </h2>
            </div>
            <Link
              to={`/products?category=${product.CategorySlug || ''}`}
              className="hidden items-center gap-1 text-sm font-bold text-primary-600 transition hover:underline dark:text-primary-400 sm:flex"
            >
              Xem tất cả <ChevronRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map(p => (
              <ProductCard key={p.ProductId} product={p} onBuyNow={buyNow} onAddCart={addToCartHandler} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}