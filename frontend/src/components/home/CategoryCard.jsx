import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { getImageUrl } from '../../services/api';

export default function CategoryCard({ category, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
    >
      <Link
        to={`/products?category=${category.Slug}`}
        className="group block overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-900/10 dark:border-white/10 dark:bg-slate-900/70"
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
    </motion.div>
  );
}
