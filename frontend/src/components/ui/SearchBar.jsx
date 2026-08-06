import { Search, SlidersHorizontal } from 'lucide-react';

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Tìm kiếm thiết bị y tế...' }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
      className="group flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 p-2 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition focus-within:ring-4 focus-within:ring-primary-500/15 dark:border-white/10 dark:bg-slate-900/80"
    >
      <Search className="ml-2 text-slate-400 transition group-focus-within:text-primary-500" size={20} />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm font-medium outline-none placeholder:text-slate-400"
      />
      <button type="submit" className="ripple grid h-10 w-10 place-items-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-500">
        <SlidersHorizontal size={18} />
      </button>
    </form>
  );
}
