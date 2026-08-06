import { Zap } from 'lucide-react';

export default function BuyNowButton({
  product,
  onClick,
  disabled,
  className = '',
  size = 'md',
  label = 'Mua ngay',
  soldOutLabel = 'Hết hàng',
}) {
  const inStock = Number(product?.Stock) > 0;
  const isDisabled = disabled ?? !inStock;

  const sizeClass =
    size === 'lg'
      ? 'min-h-12 rounded-2xl px-5 py-3 text-base'
      : 'rounded-xl px-3 py-2.5 text-sm';

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={`group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden bg-gradient-to-r from-primary-600 to-indigo-600 font-black text-white shadow-lg shadow-primary-500/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${className}`}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full" />
      {inStock ? <Zap size={size === 'lg' ? 18 : 16} className="relative fill-white" /> : null}
      <span className="relative">{inStock ? label : soldOutLabel}</span>
    </button>
  );
}