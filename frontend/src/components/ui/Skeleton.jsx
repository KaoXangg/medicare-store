export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm p-4 space-y-3">
      <div className="skeleton h-48 w-full" />
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-8 w-full" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="skeleton h-8 w-1/3" />
      <div className="skeleton h-64 w-full" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-32" />)}
      </div>
    </div>
  );
}
