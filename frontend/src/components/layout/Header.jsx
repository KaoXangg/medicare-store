import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ChevronDown,
  HeartPulse,
  Heart,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sun,
  User,
  X,
  Wind,
  Thermometer,
  Droplets,
  Accessibility,
  LogOut,
  LayoutDashboard,
  PackageOpen,
  Bell,
  RefreshCcw,
  BadgeCheck,
  Home,
  Info,
  Phone,
  Package,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api, { getImageUrl } from '../../services/api';

// getImageUrl() fallback về ảnh stock mặc định khi không có path — không hợp cho avatar
// (ở đây muốn fallback về initials), nên bọc lại để trả null khi không có path.
const getImageUrlSafe = (path) => (path ? getImageUrl(path) : null);
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import CustomerOrderNotifications from './CustomerOrderNotifications';
import NotificationBellBadges from '../ui/NotificationBellBadges';
import useNotificationCounts from '../../hooks/useNotificationCounts';

const MotionLink = motion.create(Link);

const navIconMap = {
  '/': Home,
  '/products': Package,
  '/about': Info,
  '/return-policy': RefreshCcw,
  '/warranty': BadgeCheck,
  '/contact': Phone,
};

const nav = [
  { to: '/', label: 'Trang chủ' },
  { to: '/products', label: 'Sản phẩm', mega: true },
  { to: '/about', label: 'Giới thiệu' },
  { to: '/return-policy', label: 'Đổi trả' },
  { to: '/warranty', label: 'Bảo hành' },
  { to: '/contact', label: 'Liên hệ' },
];

const megaItems = [
  {
    to: '/products?category=may-do-huyet-ap',
    title: 'Máy đo huyết áp',
    desc: 'Theo dõi chỉ số tim mạch tại nhà',
    icon: Activity,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
  },
  {
    to: '/products?category=may-do-duong-huyet',
    title: 'Đường huyết',
    desc: 'Thiết bị kiểm tra nhanh, chính xác',
    icon: Droplets,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
  },
  {
    to: '/products?category=khau-trang-y-te',
    title: 'Khẩu trang y tế',
    desc: 'Chuẩn an toàn cho gia đình',
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    to: '/products?category=thiet-bi-oxy',
    title: 'Thiết bị oxy',
    desc: 'Máy tạo oxy, bình oxy y tế',
    icon: Wind,
    color: 'text-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
  },
  {
    to: '/products?category=nhiet-ke-y-te',
    title: 'Nhiệt kế y tế',
    desc: 'Nhiệt kế điện tử, hồng ngoại',
    icon: Thermometer,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
  },
  {
    to: '/products?category=xe-lan-and-ho-tro',
    title: 'Xe lăn & hỗ trợ',
    desc: 'Xe lăn, nạng, thiết bị phục hồi',
    icon: Accessibility,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
  },
];


const fallbackIconPool = [Activity, Droplets, ShieldCheck, Wind, Thermometer, Accessibility];
const fallbackStylePool = [
  { color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40' },
  { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/40' },
  { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40' },
  { color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40' },
];

/* ── Dropdown nhỏ cho "Chính sách" ── */
function PolicyDropdown({ items, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className="absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/96 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/96"
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50 to-sky-50 px-5 py-2.5 dark:border-white/5 dark:from-primary-950/40 dark:to-sky-950/30">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">
          Chính sách
        </p>
      </div>
      <div className="p-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="group flex items-center gap-3 rounded-2xl p-3.5 transition-all hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.bg}`}>
                <Icon size={18} className={item.color} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800 transition group-hover:text-primary-700 dark:text-slate-100 dark:group-hover:text-primary-400">
                  {item.label}
                </p>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

function MegaMenu({ onClose, categories = [] }) {
  const items = categories.length
    ? categories.map((c, i) => ({
        to: `/products?category=${c.Slug}`,
        title: c.Name,
        desc: c.Description || 'Khám phá sản phẩm',
        image: getImageUrl(c.Image),
        icon: fallbackIconPool[i % fallbackIconPool.length],
        ...fallbackStylePool[i % fallbackStylePool.length],
      }))
    : megaItems.map((m) => ({ ...m, image: null }));

  // Chọn số cột sao cho hàng cuối luôn lấp đầy hoặc gần đầy,
  // tránh tình trạng dư 1-2 ô trống trông mất cân đối (ví dụ 7 danh mục mà chia cứng 3 cột).
  const count = items.length;
  const pickCols = (n) => {
    if (n <= 4) return 2;
    const candidates = [4, 3, 5];
    for (const c of candidates) {
      if (n % c === 0) return c;
    }
    // Không chia hết: chọn cột sao cho hàng cuối thiếu ít ô nhất
    let best = 3;
    let bestRemainder = Infinity;
    for (const c of [3, 4, 5]) {
      const remainder = n % c === 0 ? 0 : c - (n % c);
      if (remainder < bestRemainder) {
        bestRemainder = remainder;
        best = c;
      }
    }
    return best;
  };
  const cols = pickCols(count);
  const widthClass = cols === 2 ? 'w-[420px]' : cols === 3 ? 'w-[580px]' : cols === 4 ? 'w-[740px]' : 'w-[900px]';
  const gridColsClass = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : cols === 4 ? 'grid-cols-4' : 'grid-cols-5';
  const needsScroll = count > 15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`absolute left-1/2 top-full z-50 mt-3 ${widthClass} max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/96 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/96`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-primary-50 to-sky-50 px-5 py-3 dark:border-white/5 dark:from-primary-950/40 dark:to-sky-950/30">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">
          Danh mục sản phẩm
        </p>
        <span className="text-[10px] font-bold text-primary-400">{count} danh mục</span>
      </div>
      <div
        className={`grid ${gridColsClass} gap-1.5 p-3 ${needsScroll ? 'max-h-[420px] overflow-y-auto' : ''}`}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="group relative overflow-hidden rounded-2xl border border-transparent p-4 transition-all duration-150 hover:border-slate-200 hover:bg-slate-50 dark:hover:border-white/10 dark:hover:bg-white/5"
            >
              {item.image ? (
                <div className="mb-3 h-10 w-10 overflow-hidden rounded-xl bg-slate-100 dark:bg-white/5">
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                </div>
              ) : Icon ? (
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}>
                  <Icon size={19} className={item.color} />
                </div>
              ) : null}
              <h4 className="text-sm font-extrabold text-slate-800 transition group-hover:text-primary-700 dark:text-slate-100 dark:group-hover:text-primary-400">
                {item.title}
              </h4>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                {item.desc}
              </p>
            </Link>
          );
        })}
      </div>
      <div className="border-t border-slate-100 px-5 py-3 dark:border-white/5">
        <Link
          to="/products"
          onClick={onClose}
          className="flex items-center justify-between text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          <span>Xem tất cả sản phẩm</span>
          <span className="text-base font-black">{'->'}</span>
        </Link>
      </div>
    </motion.div>
  );
}


function UserDropdown({ user, isAdmin, logout }) {
  const initials = user.FullName
    ? user.FullName.split(' ').filter(Boolean).slice(-2).map((n) => n[0].toUpperCase()).join('')
    : '?';
  const avatar = getImageUrlSafe(user.Avatar || user.avatarUrl);

  const AvatarCircle = ({ size = 'h-9 w-9', textSize = 'text-xs', rounded = 'rounded-xl' }) => (
    avatar
      ? <img src={avatar} alt={user.FullName} className={`${size} ${rounded} shrink-0 object-cover shadow-md shadow-primary-500/20 ${isAdmin ? 'ring-2 ring-amber-400/70' : ''}`} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      : <span className={`grid ${size} shrink-0 place-items-center ${rounded} bg-gradient-to-br from-primary-400 to-blue-600 ${textSize} font-black text-white shadow-md shadow-primary-500/20 ${isAdmin ? 'ring-2 ring-amber-400/70' : ''}`}>{initials}</span>
  );

  return (
    <div className="group relative hidden sm:block">
      <button className="flex items-center gap-2.5 rounded-2xl px-2.5 py-1.5 transition hover:bg-slate-100 dark:hover:bg-white/8">
        <AvatarCircle />
        <div className="hidden text-left xl:block">
          <p className="max-w-[100px] truncate text-xs font-black text-slate-800 dark:text-slate-100">
            {user.FullName}
          </p>
          <p className={`text-[10px] font-bold ${isAdmin ? 'text-amber-500' : 'text-slate-400'}`}>
            {isAdmin ? 'Admin' : 'Thành viên'}
          </p>
        </div>
        <ChevronDown size={13} className="hidden shrink-0 text-slate-400 xl:block" />
      </button>

      <div className="invisible absolute right-0 top-full z-50 mt-2 w-56 translate-y-2 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/96 opacity-0 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-white/10 dark:bg-slate-950/96">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/3">
          <AvatarCircle size="h-10 w-10" textSize="text-sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{user.FullName}</p>
              {isAdmin && (
                <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                  Admin
                </span>
              )}
            </div>
            <p className="truncate text-[11px] text-slate-400">{user.Email || 'Thành viên'}</p>
          </div>
        </div>

        <div className="p-2">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-primary-400"
          >
            <User size={14} />
            Hồ sơ của tôi
          </Link>
          <Link
            to="/orders"
            className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-primary-400"
          >
            <PackageOpen size={14} />
            Đơn hàng
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-primary-600 transition hover:bg-primary-50 dark:hover:bg-white/8"
            >
              <LayoutDashboard size={14} />
              Quản trị
            </Link>
          )}
          <div className="my-1.5 mx-1 h-px bg-slate-100 dark:bg-white/8" />
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}


function SearchBar({ onSearch }) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`hidden items-center gap-2 rounded-2xl border bg-white/80 px-3.5 py-2 shadow-sm backdrop-blur-xl transition-all duration-200 dark:bg-slate-900/75 xl:flex ${
        focused
          ? 'w-72 border-primary-400 ring-4 ring-primary-500/10 dark:border-primary-500'
          : 'w-60 border-slate-200 dark:border-white/10'
      }`}
    >
      <Search
        size={15}
        className={`shrink-0 transition-colors ${focused ? 'text-primary-500' : 'text-slate-400'}`}
      />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-slate-200"
        placeholder="Tìm thiết bị y tế..."
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
            type="button"
            onClick={() => setValue('')}
            className="shrink-0 text-slate-400 hover:text-slate-600"
          >
            <X size={13} />
          </motion.button>
        )}
      </AnimatePresence>
    </form>
  );
}


export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { cart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { dark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [megaOpen, setMegaOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');
  const [orderNotifyOpen, setOrderNotifyOpen] = useState(false);
  const [notifyRefreshKey, setNotifyRefreshKey] = useState(0);
  const [categories, setCategories] = useState([]);
  const { counts: notifyCounts } = useNotificationCounts({
    enabled: !!user,
    refreshKey: notifyRefreshKey + (orderNotifyOpen ? 1 : 0),
  });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setScrollProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSearch = (q) => {
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
    setMobileOpen(false);
  };

  const submitMobileSearch = (e) => {
    e.preventDefault();
    handleSearch(mobileSearch.trim());
  };

  const headerBg = scrolled
    ? 'bg-white/92 shadow-lg shadow-slate-900/5 dark:bg-slate-950/92'
    : 'bg-white/70 dark:bg-slate-950/50';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] border-b border-slate-200/60 backdrop-blur-2xl transition-all duration-300 dark:border-white/8 ${headerBg}`}
    >
      <div
        className="h-0.5 bg-gradient-to-r from-primary-500 via-sky-500 to-cyan-500 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden
      />
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6">
        {/* Grid 3 cột: logo | nav trải đều | actions — đảm bảo đều 2 phía */}
        <div className="grid h-14 sm:h-16 grid-cols-[auto_1fr_auto] items-center gap-2">

          {/* ── Cột trái: Logo ── */}
          <Link to="/" className="group flex shrink-0 items-center gap-3">
            <motion.span
              whileHover={{ rotate: -8, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary-100 to-blue-100 text-primary-600 shadow-md shadow-primary-500/15 dark:from-primary-900/60 dark:to-blue-900/40 dark:text-primary-300"
            >
              <HeartPulse size={22} />
            </motion.span>
            <div className="leading-none">
              <span className="block text-base font-black tracking-tight text-primary-700 dark:text-primary-400">
                MediCare
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Store
              </span>
            </div>
          </Link>

          {/* ── Cột giữa: Nav items trải đều ── */}
          <nav className="hidden items-center justify-evenly lg:flex">
            {nav.map((item) => (
              <div
                key={item.to}
                className="relative"
                onMouseEnter={() => item.mega && setMegaOpen(true)}
                onMouseLeave={() => item.mega && setMegaOpen(false)}
              >
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative inline-flex items-center gap-1 rounded-2xl px-3.5 py-2 text-sm font-bold whitespace-nowrap transition-colors duration-150 ${
                      isActive
                        ? 'text-primary-700 dark:text-primary-400'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="navActivePill"
                          className="absolute inset-0 rounded-2xl bg-primary-50 dark:bg-primary-950/50"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-1">
                        {item.label}
                        {item.mega && (
                          <ChevronDown
                            size={13}
                            className={`transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`}
                          />
                        )}
                      </span>
                    </>
                  )}
                </NavLink>
                <AnimatePresence>
                  {item.mega && megaOpen && (
                    <MegaMenu onClose={() => setMegaOpen(false)} categories={categories} />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>
          {/* Mobile: spacer để giữ layout 3 cột */}
          <div className="lg:hidden" />

          {/* ── Cột phải: Search + icon actions ── */}
          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1">
            <SearchBar onSearch={handleSearch} />

            <MotionLink
              to="/wishlist"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="relative hidden min-[400px]:grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-500 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-rose-400"
              aria-label="Yêu thích"
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-950">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </MotionLink>

            <motion.button
              onClick={toggle}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
              aria-label="Toggle dark mode"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={dark ? 'sun' : 'moon'}
                  initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                  className="grid place-items-center"
                >
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            {user && (
              <div className="relative">
                <motion.button
                  type="button"
                  onClick={() => setOrderNotifyOpen((v) => !v)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="relative grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                  aria-label="Thông báo"
                >
                  <Bell size={20} />
                  <NotificationBellBadges orders={notifyCounts.orders} contacts={notifyCounts.contacts} />
                </motion.button>
                <CustomerOrderNotifications
                  open={orderNotifyOpen}
                  onClose={() => {
                    setOrderNotifyOpen(false);
                    setNotifyRefreshKey((k) => k + 1);
                  }}
                  onCountsChange={() => setNotifyRefreshKey((k) => k + 1)}
                />
              </div>
            )}

            <MotionLink
              to="/cart"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="relative grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
            >
              <ShoppingCart size={20} />
              <AnimatePresence>
                {cart.count > 0 && (
                  <motion.span
                    initial={{ scale: 0, y: 4 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-blue-600 px-1 text-[10px] font-black leading-none text-white shadow-md shadow-primary-500/30"
                  >
                    {cart.count > 99 ? '99+' : cart.count}
                  </motion.span>
                )}
              </AnimatePresence>
            </MotionLink>

            {user ? (
              <UserDropdown user={user} isAdmin={isAdmin} logout={logout} />
            ) : (
              <Link
                to="/login"
                className="hidden rounded-2xl bg-gradient-to-r from-primary-500 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-primary-500/25 transition hover:shadow-lg hover:shadow-primary-500/30 sm:inline-flex"
              >
                Đăng nhập
              </Link>
            )}

            <button
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? 'x' : 'menu'}
                  initial={{ rotate: -15, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 15, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="grid place-items-center"
                >
                  {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-sm lg:hidden"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Đóng menu"
                />

                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Menu điều hướng"
                  initial={{ opacity: 0, x: '100%' }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: '100%' }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className="fixed inset-y-0 right-0 z-[121] flex w-[min(92vw,400px)] flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950 lg:hidden"
                  style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-primary-50/60 to-transparent px-5 py-4 dark:border-white/8 dark:from-primary-950/20">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 text-primary-600 dark:from-primary-900/60 dark:to-blue-900/40 dark:text-primary-300">
                    <HeartPulse size={18} />
                  </span>
                  <span className="font-black text-primary-700 dark:text-primary-400">MediCare Store</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.08, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => setMobileOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/8"
                  aria-label="Đóng menu"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="px-5 pt-4">
                <form
                  onSubmit={submitMobileSearch}
                  className="flex items-center gap-2 rounded-2xl border border-transparent bg-slate-100 px-3.5 py-2.5 transition-colors focus-within:border-primary-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary-500/10 dark:bg-white/8 dark:focus-within:bg-white/5"
                >
                  <Search size={15} className="shrink-0 text-slate-400" />
                  <input
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
                    placeholder="Tìm thiết bị..."
                  />
                </form>
              </div>

              <nav className="mt-4 space-y-0.5 px-3">
                {nav.map((item, i) => {
                  const Icon = navIconMap[item.to] || Home;
                  return (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-colors ${
                            isActive
                              ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-400'
                              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/8'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                                  : 'bg-slate-100 text-slate-400 group-hover:bg-white dark:bg-white/8'
                              }`}
                            >
                              <Icon size={15} />
                            </span>
                            {item.label}
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="mt-5 px-5">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Danh mục
                </p>
                <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {(categories.length
                    ? categories.map((c, i) => ({
                        to: `/products?category=${c.Slug}`,
                        title: c.Name,
                        image: getImageUrl(c.Image),
                        icon: fallbackIconPool[i % fallbackIconPool.length],
                        ...fallbackStylePool[i % fallbackStylePool.length],
                      }))
                    : megaItems.map((m) => ({ ...m, image: null }))
                  ).map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.to}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 + i * 0.04 }}
                      >
                        <Link
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2.5 rounded-2xl border border-transparent p-3 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm dark:hover:border-white/10 dark:hover:bg-white/5"
                        >
                          {item.image ? (
                            <span className="h-8 w-8 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-white/5">
                              <img
                                src={item.image}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; e.currentTarget.parentElement.nextSibling?.classList.remove('hidden'); }}
                              />
                            </span>
                          ) : null}
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${item.bg} ${item.image ? 'hidden' : ''}`}>
                            <Icon size={15} className={item.color} />
                          </span>
                          <span className="text-xs font-bold leading-snug text-slate-700 dark:text-slate-300">
                            {item.title}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto px-5 pb-6 pt-5">
                {user ? (
                  <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-white/8">
                    <div className={`flex items-center gap-3 p-4 ${isAdmin ? 'bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-500/10 dark:to-transparent' : 'bg-slate-50 dark:bg-white/3'}`}>
                      {getImageUrlSafe(user.Avatar || user.avatarUrl)
                        ? <img src={getImageUrlSafe(user.Avatar || user.avatarUrl)} alt={user.FullName} className={`h-11 w-11 shrink-0 rounded-xl object-cover ${isAdmin ? 'ring-2 ring-amber-400/70' : ''}`} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        : <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-400 to-blue-600 text-sm font-black text-white ${isAdmin ? 'ring-2 ring-amber-400/70' : ''}`}>
                            {user.FullName ? user.FullName.split(' ').filter(Boolean).slice(-2).map((n) => n[0].toUpperCase()).join('') : '?'}
                          </span>
                      }
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{user.FullName}</p>
                          {isAdmin && (
                            <span className="shrink-0 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] font-semibold ${isAdmin ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                          {isAdmin ? 'Quản trị viên' : 'Thành viên'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 pt-3">
                      {isAdmin && (
                        <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                          <Link
                            to="/admin"
                            onClick={() => setMobileOpen(false)}
                            className="mb-3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-primary-500/25"
                          >
                            <LayoutDashboard size={18} />
                            Quản trị cửa hàng
                          </Link>
                        </motion.div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to="/profile"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-white/8 dark:text-slate-300"
                        >
                          <User size={13} />
                          Hồ sơ
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-white/8 dark:text-slate-300"
                        >
                          <PackageOpen size={13} />
                          Đơn hàng
                        </Link>
                      </div>
                      <button
                        onClick={() => { logout(); setMobileOpen(false); }}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-50 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                      >
                        <LogOut size={13} />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-2xl bg-gradient-to-r from-primary-500 to-blue-600 py-3.5 text-center text-sm font-black text-white shadow-lg shadow-primary-500/25"
                  >
                    Đăng nhập
                  </Link>
                )}

                <div className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-blue-700 p-4 text-white">
                  <ShieldCheck className="absolute -right-3 -top-3 opacity-10" size={72} />
                  <ShieldCheck className="mb-2" size={18} />
                  <p className="text-sm font-black">Tư vấn thiết bị y tế</p>
                  <p className="mt-1 text-xs text-primary-200">Đội ngũ hỗ trợ chọn sản phẩm phù hợp.</p>
                </div>
              </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </header>
  );
}