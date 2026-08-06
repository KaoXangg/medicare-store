import { NavLink } from 'react-router-dom';
import { Home, PackageSearch, ShoppingCart, UserRound } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const links = [
  { to: '/', label: 'Trang chủ', icon: Home, end: true },
  { to: '/products', label: 'Sản phẩm', icon: PackageSearch },
  { to: '/cart', label: 'Giỏ hàng', icon: ShoppingCart, cart: true },
  { to: '/profile', label: 'Tài khoản', icon: UserRound },
];

export default function MobileBottomNav() {
  const { cart } = useCart();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-2 pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 md:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-bold leading-tight transition sm:text-xs ${
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <item.icon size={20} strokeWidth={2.25} />
            <span className="mt-1 max-w-full truncate px-0.5">{item.label}</span>
            {item.cart && cart.count > 0 && (
              <span className="absolute right-2 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                {cart.count > 9 ? '9+' : cart.count}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
