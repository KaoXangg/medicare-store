export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
      <input
        className={`w-full px-4 py-2.5 rounded-xl border bg-white/90 shadow-sm dark:bg-slate-900/75 dark:border-slate-600 focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 ${error ? 'border-red-500' : 'border-slate-200'} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
