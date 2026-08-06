import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-gradient-to-r from-primary-500 via-sky-500 to-blue-600 hover:from-primary-400 hover:to-blue-500 text-white shadow-lg shadow-primary-600/25',
  secondary: 'bg-white/90 border border-slate-200 hover:bg-white text-slate-700 shadow-sm dark:bg-slate-800/85 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800',
  danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/20',
  ghost: 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200',
};

const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5', lg: 'px-6 py-3 text-lg' };

export default function Button({
  children, variant = 'primary', size = 'md', className = '', loading, disabled, onPointerMove, ...props
}) {
  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--ripple-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--ripple-y', `${event.clientY - rect.top}px`);
    onPointerMove?.(event);
  };

  return (
    <motion.button
      whileHover={{ y: disabled || loading ? 0 : -2 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      onPointerMove={handlePointerMove}
      className={`ripple inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-400/25 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      {children}
    </motion.button>
  );
}
