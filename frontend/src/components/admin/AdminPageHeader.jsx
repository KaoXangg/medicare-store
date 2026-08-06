import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { adminTheme } from '../ui/adminTheme';

export default function AdminPageHeader({ title, subtitle, badge, actions, hideTitle = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="admin-page-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="min-w-0">
        {!hideTitle && title && <h1 className={adminTheme.pageTitle}>{title}</h1>}
        {subtitle && (
          <p
            className={
              hideTitle
                ? 'text-sm text-slate-500 dark:text-slate-400 sm:text-base'
                : adminTheme.pageSubtitle
            }
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {badge && (
          <div className={`${adminTheme.chip} animate-admin-shimmer`}>
            <Sparkles size={16} className="text-primary-500" />
            {badge}
          </div>
        )}
        {actions}
      </div>
    </motion.div>
  );
}
