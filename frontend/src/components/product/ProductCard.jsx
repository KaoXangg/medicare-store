import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Heart, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../services/api';
import { formatPrice } from '../../utils/format';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import BuyNowButton from '../ui/BuyNowButton';
import QuickViewModal from './QuickViewModal';

export default function ProductCard({ product, onBuyNow, onAddCart, buyNowLabel = 'Mua ngay' }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const { isWishlisted, toggle } = useWishlist();
  const { user } = useAuth();
  const wishlisted = isWishlisted(product.ProductId);

  const price = product.effectivePrice ?? product.SalePrice ?? product.Price;
  const oldPrice = product.SalePrice && product.SalePrice < product.Price ? product.Price : null;
  const img = getImageUrl(product.primaryImage || product.images?.[0]);

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu yêu thích');
      return;
    }
    try {
      const added = await toggle(product.ProductId);
      toast.success(added ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        onPointerMove={handlePointerMove}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition dark:border-white/10 dark:bg-slate-900/80 sm:rounded-3xl"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(360px circle at var(--mx, 50%) var(--my, 0%), rgba(2,132,199,.14), transparent 45%)',
          }}
        />

        <div className="relative block aspect-square overflow-hidden bg-slate-100 dark:bg-slate-950">
          <Link to={`/products/${product.Slug}`} className="block h-full">
            <img
              src={img}
              alt={product.Name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getImageUrl(null);
              }}
            />
          </Link>

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {oldPrice && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">SALE</span>
            )}
            {product.IsPopular && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">HOT</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
            className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl shadow-lg backdrop-blur transition hover:scale-110 ${
              wishlisted
                ? 'bg-rose-500 text-white'
                : 'bg-white/95 text-slate-600 hover:text-rose-500 dark:bg-slate-900/90 dark:text-slate-200'
            }`}
          >
            <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            onClick={() => setQuickOpen(true)}
            className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-xl bg-white/95 text-primary-700 shadow-lg backdrop-blur transition hover:scale-110 hover:bg-white dark:bg-slate-900/90 dark:text-primary-300"
            aria-label="Xem nhanh"
          >
            <Eye size={16} />
          </button>

          {product.BrandName && (
            <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 backdrop-blur">
              {product.BrandName}
            </span>
          )}
        </div>

        <div className="relative flex flex-1 flex-col p-4">
          <Link to={`/products/${product.Slug}`}>
            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-900 hover:text-primary-600 dark:text-white sm:text-base">
              {product.Name}
            </h3>
          </Link>

          <div className="mt-2 flex items-center gap-1 text-amber-500">
            <Star size={14} fill="currentColor" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {product.AverageRating || 0}
            </span>
          </div>

          <div className="mt-auto pt-3">
            <div className="mb-3 flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-black text-primary-600">{formatPrice(price)}</span>
              {oldPrice && (
                <span className="text-xs text-slate-400 line-through">{formatPrice(oldPrice)}</span>
              )}
            </div>
            <BuyNowButton
              product={product}
              label={buyNowLabel}
              onClick={() => onBuyNow?.(product)}
            />
          </div>
        </div>
      </motion.article>

      <QuickViewModal
        product={product}
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onBuyNow={onBuyNow}
        onAddCart={onAddCart}
      />
    </>
  );
}
