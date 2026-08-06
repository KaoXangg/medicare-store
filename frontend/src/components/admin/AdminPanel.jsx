import { motion } from 'framer-motion';
import { adminTheme } from '../ui/adminTheme';

export default function AdminPanel({
  title,
  subtitle,
  action,
  children,
  className = '',
  delay = 0,
  noPadding = false,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className={`${adminTheme.panelCard} ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div>
            {title && <h2 className={adminTheme.sectionTitle}>{title}</h2>}
            {subtitle && <p className={adminTheme.sectionSubtitle}>{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5 lg:p-6'}>{children}</div>
    </motion.section>
  );
}
