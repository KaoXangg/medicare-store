import { Search } from 'lucide-react';
import { adminTheme } from '../ui/adminTheme';

export default function AdminSearchBar({ value, onChange, placeholder = 'Tìm kiếm...', children, className = '' }) {
  return (
    <div className={`${adminTheme.glassCard} p-4 lg:p-5 ${className}`}>
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" placeholder={placeholder} value={value} onChange={onChange} className={adminTheme.searchInput} />
        </div>
        {children}
      </div>
    </div>
  );
}
