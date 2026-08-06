import { motion } from 'framer-motion';
import { useMemo } from 'react';

const variants = {
  primary: 'bg-gradient-to-r from-primary-500 via-sky-500 to-blue-600 text-white shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40',
  secondary: 'bg-white/90 text-slate-800 border border-white/70 shadow-lg shadow-slate-900/5 dark:bg-slate-900/80 dark:text-white dark:border-white/10',
  dark: 'bg-slate-950 text-white shadow-xl shadow-slate-950/20 dark:bg-white dark:text-slate-950',
};

export default function AnimatedButton({
  children,
  variant = 'primary',
  className = '',
  as: Component = 'button',
  ...props
}) {
  // Wrap Component với motion để whileHover/whileTap luôn được xử lý bởi Framer Motion
  const MotionComponent = useMemo(() => motion.create(Component), [Component]);

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--ripple-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--ripple-y', `${event.clientY - rect.top}px`);
    props.onPointerMove?.(event);
  };

  return (
    <MotionComponent
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onPointerMove={handlePointerMove}
      className={`ripple inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-400/30 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}