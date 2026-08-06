import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderTree, Users, ShoppingBag, MessageSquare,
  LogOut, HeartPulse, Menu, X, PanelLeftClose, PanelLeft, Bell, Store, Mail,
  Ticket, Sun, Moon, ShieldCheck, ChevronRight, Building2, Zap, Activity
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getImageUrl } from '../../services/api';
import AdminNotifications from '../../components/admin/AdminNotifications';
import NotificationBellBadges from '../ui/NotificationBellBadges';
import useNotificationCounts from '../../hooks/useNotificationCounts';
import { motion, AnimatePresence } from 'framer-motion';

const menuGroups = [
  {
    title: 'Hệ thống',
    items: [
      { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    title: 'Quản lý kho',
    items: [
      { to: '/admin/products', icon: Package, label: 'Sản phẩm' },
      { to: '/admin/brands', icon: Building2, label: 'Thương hiệu' },
      { to: '/admin/categories', icon: FolderTree, label: 'Danh mục' },
    ]
  },
  {
    title: 'Giao dịch & Ưu đãi',
    items: [
      { to: '/admin/orders', icon: ShoppingBag, label: 'Đơn hàng' },
      { to: '/admin/coupons', icon: Ticket, label: 'Mã giảm giá' },
      { to: '/admin/flash-sale', icon: Zap, label: 'Flash Sale' },
    ]
  },
  {
    title: 'Khách hàng & Tương tác',
    items: [
      { to: '/admin/users', icon: Users, label: 'Người dùng' },
      { to: '/admin/reviews', icon: MessageSquare, label: 'Đánh giá' },
      { to: '/admin/contacts', icon: Mail, label: 'Liên hệ' },
      { to: '/admin/activity', icon: Activity, label: 'Nhật ký hoạt động' },
    ]
  }
];

const routeTitles = {
  '/admin': 'Dashboard',
  '/admin/products': 'Quản lý sản phẩm',
  '/admin/brands': 'Quản lý thương hiệu',
  '/admin/categories': 'Quản lý danh mục',
  '/admin/orders': 'Quản lý đơn hàng',
  '/admin/coupons': 'Mã giảm giá',
  '/admin/users': 'Quản lý người dùng',
  '/admin/reviews': 'Quản lý đánh giá',
  '/admin/contacts': 'Quản lý liên hệ',
  '/admin/activity': 'Nhật ký hoạt động',
  '/admin/products/create': 'Thêm sản phẩm',
};

function getPageTitle(pathname) {
  if (pathname.startsWith('/admin/products/edit/')) return 'Chỉnh sửa sản phẩm';
  return routeTitles[pathname] || 'Admin Panel';
}

function NavItem({ item, collapsed, onNavigate }) {
  const Icon = item.icon;
  const location = useLocation();
  const isActive = location.pathname === item.to || (!item.end && location.pathname.startsWith(item.to));

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={item.label}
      className="relative block w-full outline-none"
    >
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium tracking-wide select-none transition-all duration-200 ${
          isActive
            ? 'bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-950/40 dark:text-indigo-400'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
        } ${collapsed ? 'justify-center px-2.5' : ''}`}
      >
        <Icon 
          size={18} 
          className={`shrink-0 transition-transform duration-200 ${
            isActive 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
          }`} 
        />
        
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        
        {!collapsed && isActive && (
          <ChevronRight size={14} className="text-indigo-600 dark:text-indigo-400" />
        )}
      </motion.div>
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, isAdmin, logout, loading } = useAuth();
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyRefreshKey, setNotifyRefreshKey] = useState(0);
  const { counts: notifyCounts } = useNotificationCounts({
    admin: true,
    enabled: !!user && isAdmin,
    refreshKey: notifyRefreshKey + (notifyOpen ? 1 : 0),
  });

  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);
  const today = useMemo(
    () =>
      new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    []
  );

  useEffect(() => {
    setSidebarOpen(false);
    setNotifyOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white dark:bg-[#09090B]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 dark:border-white/10 border-t-indigo-600" />
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  const initials =
    user.FullName?.split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AD';

  const avatarUrl = user.Avatar ? getImageUrl(user.Avatar) : null;

  const closeSidebar = () => setSidebarOpen(false);
  const openSidebar = () => {
    setNotifyOpen(false);
    setSidebarOpen(true);
  };

  return (
    <div className={`${dark ? 'dark' : ''} min-h-screen w-full bg-[#F8FAFC] text-slate-800 dark:bg-[#09090B] dark:text-slate-100 font-sans antialiased transition-colors duration-300`}>
      <style>{`
        .admin-drawer-scroll, .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(100,116,139,0.35) transparent;
        }
        .admin-drawer-scroll::-webkit-scrollbar, .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .admin-drawer-scroll::-webkit-scrollbar-track, .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .admin-drawer-scroll::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(100,116,139,0.35);
          border-radius: 999px;
        }
        .admin-drawer-scroll::-webkit-scrollbar-thumb:hover, .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100,116,139,0.55);
        }
      `}</style>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200/60 bg-white dark:border-white/[0.05] dark:bg-[#09090B] lg:flex transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-68'
        }`}
      >
        <SidebarBrand collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} showToggle />
        
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!collapsed && (
                <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 dark:text-slate-500/80 mb-2">
                  {group.title}
                </p>
              )}
              {collapsed && !collapsed && <div className="h-px bg-slate-100 dark:bg-white/5 my-3" />}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <SidebarFooter collapsed={collapsed} onLogout={logout} />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            className="fixed inset-0 z-[80] bg-white/70 backdrop-blur-md dark:bg-slate-950/70 lg:hidden"
            onClick={closeSidebar}
            aria-label="Đóng menu"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-[95] flex w-72 flex-col border-r border-slate-200/60 bg-white dark:border-white/[0.05] dark:bg-[#09090B] shadow-xl transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div
          className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.05] px-5 py-4"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 text-primary-600 shadow-sm dark:from-primary-900/60 dark:to-blue-900/40 dark:text-primary-300">
              <HeartPulse size={16} />
            </span>
            <p className="font-black text-sm tracking-tight text-primary-700 dark:text-primary-400">MediCare Store</p>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 border border-slate-200/60 text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="admin-drawer-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-5">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.to} item={item} collapsed={false} onNavigate={closeSidebar} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <SidebarFooter collapsed={false} onLogout={logout} onNavigate={closeSidebar} />
      </aside>

      <div
        className={`flex min-h-screen min-w-0 flex-col transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-68'
        }`}
      >
        <header
          className={`fixed inset-x-0 top-0 z-[30] border-b border-slate-200/50 bg-white/80 backdrop-blur-md dark:border-white/[0.03] dark:bg-[#09090B]/80 lg:sticky lg:inset-x-auto transition-opacity duration-150 ${
            sidebarOpen ? 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : 'opacity-100'
          }`}
          style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
        >
          <div className="flex h-16 items-center gap-4 px-5 lg:h-auto lg:min-h-[4.5rem] lg:px-8 lg:py-3">
            <button
              type="button"
              onClick={openSidebar}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base lg:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {pageTitle}
              </h1>
              <p className="hidden text-[11px] text-slate-400 dark:text-slate-500 lg:block mt-0.5">{today}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggle}
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200/60 bg-white text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
              >
                {dark ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  setNotifyOpen((v) => !v);
                }}
                className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200/60 bg-white text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
              >
                <Bell size={15} />
                <NotificationBellBadges orders={notifyCounts.orders} contacts={notifyCounts.contacts} />
              </button>
              
              <AdminNotifications
                open={notifyOpen}
                onClose={() => {
                  setNotifyOpen(false);
                  setNotifyRefreshKey((k) => k + 1);
                }}
                onCountsChange={() => setNotifyRefreshKey((k) => k + 1)}
              />

              <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1 lg:mx-2" />

              <div className="flex items-center gap-2.5 rounded-xl bg-transparent select-none">
                <div className="hidden text-right md:block">
                  <p className="max-w-[10rem] truncate text-xs font-semibold text-slate-800 dark:text-white">
                    {user.FullName}
                  </p>
                  <p className="flex items-center justify-end gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    <ShieldCheck size={11} className="text-indigo-500" />
                    Administrator
                  </p>
                </div>
                <div className="relative shrink-0">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={user.FullName} className="h-8 w-8 rounded-xl object-cover border border-slate-200/40 dark:border-white/10" />
                    : <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-[11px] font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                        {initials}
                      </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-shell min-w-0 flex-1 overflow-x-hidden p-5 pt-20 lg:p-8 lg:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarBrand({ collapsed, onToggle, showToggle = true }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.05] px-5 py-4">
      {!collapsed ? (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 text-primary-600 shadow-sm dark:from-primary-900/60 dark:to-blue-900/40 dark:text-primary-300">
            <HeartPulse size={16} />
          </span>
          <div>
            <p className="font-black text-sm tracking-tight text-primary-700 dark:text-primary-400 leading-none">MediCare Store</p>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">Quản lý hệ thống</p>
          </div>
        </div>
      ) : (
        <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 text-primary-600 shadow-sm dark:from-primary-900/60 dark:to-blue-900/40 dark:text-primary-300">
          <HeartPulse size={16} />
        </span>
      )}
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-300 transition-colors"
        >
          {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
        </button>
      )}
    </div>
  );
}

function SidebarFooter({ collapsed, onLogout, onNavigate }) {
  return (
    <div className="space-y-0.5 border-t border-slate-100 dark:border-white/[0.05] p-3">
      <NavLink
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200 transition-colors"
        title="Về cửa hàng"
      >
        <Store size={16} className="shrink-0" />
        {!collapsed && <span>Quay lại cửa hàng</span>}
      </NavLink>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          onLogout();
        }}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ${
          collapsed ? 'justify-center px-2.5' : ''
        }`}
      >
        <LogOut size={16} className="shrink-0" />
        {!collapsed && <span>Đăng xuất</span>}
      </button>
    </div>
  );
}