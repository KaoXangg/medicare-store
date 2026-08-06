import { adminTheme } from '../ui/adminTheme';

export default function AdminEmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className={adminTheme.emptyState}>
      {Icon && (
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-slate-100/90 dark:bg-white/5">
          <Icon size={32} className="text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}
