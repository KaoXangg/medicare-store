import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { getImageUrl } from '../../services/api';

function MiniCategoryCard({ category }) {
  return (
    <Link
      to={`/products?category=${category.Slug}`}
      className="group flex w-[230px] shrink-0 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-900/10 dark:border-white/10 dark:bg-slate-900/70"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        <img
          src={getImageUrl(category.Image)}
          alt={category.Name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 to-transparent opacity-70" />
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-primary-700 shadow-lg transition group-hover:rotate-45">
          <ArrowUpRight size={17} />
        </span>
      </div>
      <div className="px-2 py-4">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{category.Name}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Khám phá bộ sưu tập</p>
      </div>
    </Link>
  );
}

export default function CategoryMarquee({ categories = [] }) {
  if (!categories.length) return null;

  
  const track = [...categories, ...categories];

  return (
    <div className="group relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent dark:from-slate-950 sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent dark:from-slate-950 sm:w-20" />

      <div className="category-marquee-track flex w-max gap-4 py-1">
        {track.map((category, i) => (
          <MiniCategoryCard key={`${category.CategoryId}-${i}`} category={category} />
        ))}
      </div>

      <style>{`
        .category-marquee-track {
          animation: category-marquee-scroll 52s linear infinite;
        }
        .group:hover .category-marquee-track {
          animation-play-state: paused;
        }
        @keyframes category-marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .category-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}