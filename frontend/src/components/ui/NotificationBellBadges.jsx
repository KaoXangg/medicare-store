/** Badge vàng = đơn hàng, xanh lá = liên hệ (đồng bộ storefront + admin) */
export default function NotificationBellBadges({ orders = 0, contacts = 0, className = '' }) {
  const orderCount = Number(orders) || 0;
  const contactCount = Number(contacts) || 0;
  if (!orderCount && !contactCount) return null;

  return (
    <span className={`pointer-events-none absolute -right-1 -top-1 flex items-center gap-0.5 ${className}`}>
      {orderCount > 0 && (
        <span
          className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black leading-none text-white shadow-sm ring-2 ring-white dark:ring-slate-950"
          title={`${orderCount} đơn hàng`}
        >
          {orderCount > 9 ? '9+' : orderCount}
        </span>
      )}
      {contactCount > 0 && (
        <span
          className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black leading-none text-white shadow-sm ring-2 ring-white dark:ring-slate-950"
          title={`${contactCount} liên hệ`}
        >
          {contactCount > 9 ? '9+' : contactCount}
        </span>
      )}
    </span>
  );
}
