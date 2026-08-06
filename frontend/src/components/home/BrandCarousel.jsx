import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../services/api';

export default function BrandCarousel({ brands = [] }) {
  if (!brands.length) return null;

  const items = [...brands, ...brands];

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-4 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: Math.max(20, brands.length * 4), repeat: Infinity, ease: 'linear' }}
      >
        {items.map((brand, i) => (
          <Link
            key={`${brand.BrandId}-${i}`}
            to={`/products?brand=${brand.Slug}`}
            title={brand.Name}
            className="group flex h-28 w-44 shrink-0 flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
          >
            <img
              src={getImageUrl(brand.Logo)}
              alt={brand.Name}
              className="h-12 max-w-[120px] object-contain transition group-hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
            <span className="text-center text-sm font-bold text-slate-700 line-clamp-1 dark:text-slate-200">
              {brand.Name}
            </span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
