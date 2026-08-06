import { adminTheme, adminStatusStyles } from '../ui/adminTheme';

export default function AdminStatusBadge({ label, variant = 'active', icon: Icon }) {
  return (
    <span className={`${adminTheme.badge} ${adminStatusStyles[variant] || adminStatusStyles.active}`}>
      {Icon ? <Icon size={12} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}
