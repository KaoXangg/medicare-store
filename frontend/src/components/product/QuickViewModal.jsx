import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Star, Zap } from 'lucide-react';
import { getImageUrl } from '../../services/api';
import { formatPrice } from '../../utils/format';
import BuyNowButton from '../ui/BuyNowButton';

export default function QuickViewModal({ product, open, onClose, onBuyNow, onAddCart }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!product) return null;

  const price = product.effectivePrice ?? product.SalePrice ?? product.Price;
  const img = getImageUrl(product.primaryImage || product.images?.[0]);
  const inStock = Number(product.Stock) > 0;

  const handleBuyNow = () => {
    onBuyNow?.(product);
    onClose?.();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="relative z-10 w-full max-w-3xl max-h-[min(90vh,720px)] overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white dark:bg-slate-900/90 dark:text-white"
            >
              <X size={20} />
            </button>
            <div className="grid max-h-[min(90vh,720px)] overflow-y-auto sm:grid-cols-2">
              <div className="relative aspect-square bg-slate-100 dark:bg-slate-900 sm:aspect-auto sm:min-h-[320px]">
                <img src={img} alt={product.Name} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
              </div>
              <div className="flex flex-col p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                  {product.BrandName || product.CategoryName}
                </p>
                <h3 className="mt-2 text-xl font-black leading-snug sm:text-2xl">{product.Name}</h3>
                <div className="mt-2 flex items-center gap-1 text-amber-500">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {product.AverageRating || 0} ({product.ReviewCount || 0})
                  </span>
                </div>
                <p className="mt-4 text-2xl font-black text-primary-600">{formatPrice(price)}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 line-clamp-5 flex-1">
                  {product.Description}
                </p>
                <div className="mt-6 flex flex-col gap-2.5">
                  <BuyNowButton product={product} onClick={handleBuyNow} size="lg" />
                  <button
                    type="button"
                    disabled={!inStock}
                    onClick={() => {
                      onAddCart?.(product);
                      onClose?.();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-bold transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <ShoppingCart size={18} />
                    Thêm giỏ hàng
                  </button>
                  <Link
                    to={`/products/${product.Slug}`}
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-center font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                  >
                    <Zap size={16} />
                    Xem chi tiết đầy đủ
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
