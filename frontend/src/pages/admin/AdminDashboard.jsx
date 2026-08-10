import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Activity, AlertTriangle, ArrowRight, BellRing, CheckCircle,
  Clock4, CreditCard, DollarSign, FolderPlus, FolderTree,
  HardDrive, Image as ImageIcon, Package, Plus, Search,
  ShieldCheck, ShoppingBag, Star, Tag, TrendingDown,
  TrendingUp, Users, Zap, Sparkles, XCircle, Sun, Moon, BadgeCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getImageUrl } from '../../services/api';
import { formatDate, formatPrice, orderStatusLabel } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminPanel from '../../components/admin/AdminPanel';
import { adminTheme } from '../../components/ui/adminTheme';
import { useTheme } from '../../context/ThemeContext';
import BannerSettings from '../../components/admin/BannerSettings';
import PageImageSettings from '../../components/admin/PageImageSettings';

const ORDER_STATUS_UI = [
  { key: 'pending',   label: 'Chờ xử lý',    color: '#F59E0B' },
  { key: 'confirmed', label: 'Đã xác nhận',   color: '#3B82F6' },
  { key: 'shipping',  label: 'Đang giao',     color: '#8B5CF6' },
  { key: 'completed', label: 'Đã hoàn thành', color: '#10B981' },
  { key: 'cancelled', label: 'Đã hủy',        color: '#EF4444' },
];

const PAYMENT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

const REVENUE_FILTERS = [
  { label: '7 Ngày',  days: 7   },
  { label: '30 Ngày', days: 30  },
  { label: '3 Tháng', days: 90  },
  { label: '6 Tháng', days: 180 },
  { label: '1 Năm',   days: 365 },
];

const HEATMAP_DAYS  = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HEATMAP_HOURS = ['08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
const SUPPLIER_NAMES = ['MediSupplies', 'HealthLink', 'VitaCare', 'BioSource', 'Apex Medical'];
const CITY_NAMES = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

const t = (dark, darkCls, lightCls) => dark ? darkCls : lightCls;

const buildHeatmap = () =>
  HEATMAP_DAYS.map((day) => ({
    day,
    values: HEATMAP_HOURS.map(() => Math.floor(20 + Math.random() * 70)),
  }));

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase();
};

const ChartTooltip = ({ active, payload, label, formatter, dark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-2xl border p-4 shadow-2xl ${dark
      ? 'border-white/10 bg-slate-900'
      : 'border-slate-200 bg-white shadow-slate-200/60'}`}>
      {label && <p className={`mb-2 text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>}
      <div className="space-y-1.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.fill }} />
            <span className={`text-xs font-medium ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{p.name}:</span>
            <span className={`text-xs font-black ml-auto ${dark ? 'text-white' : 'text-slate-900'}`}>
              {formatter ? formatter(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

function CountUp({ to, duration = 1.0 }) {
  const ref = useRef(null);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const ctrl = animate(count, to, { duration, ease: 'easeOut' });
    return ctrl.stop;
  }, [to]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueFilter, setRevenueFilter] = useState(REVENUE_FILTERS[3]);
  const [vipSearch, setVipSearch] = useState('');
  const [vipSort, setVipSort] = useState({ key: 'totalSpent', direction: 'desc' });
  const [systemMetrics, setSystemMetrics] = useState({ cpu: 24, ram: 52, api: 92, db: 4, storage: 64 });
  const [chartsReady, setChartsReady] = useState(false);

  // Trì hoãn render ResponsiveContainer 1 tick sau khi layout đã ổn định,
  // tránh cảnh báo "width(-1) height(-1)" do React StrictMode double-mount trong dev.
  useEffect(() => {
    const id = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  
  const fetchDashboardData = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get('/admin/dashboard')
      .then((r) => {
        if (r.success) setData(r.data);
        else setError('Không thể lấy dữ liệu thống kê hệ thống.');
      })
      .catch((err) => {
        console.error(err);
        setError('Đã xảy ra lỗi kết nối với máy chủ.');
        toast.error('Lỗi tải dữ liệu dashboard!');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemMetrics((prev) => ({
        cpu:     Math.min(Math.max(prev.cpu     + (Math.random() > 0.5 ? 3  : -3),  12), 45),
        ram:     Math.min(Math.max(prev.ram     + (Math.random() > 0.5 ? 1  : -1),  48), 56),
        api:     Math.min(Math.max(prev.api     + (Math.random() > 0.5 ? 4  : -4),  78), 110),
        db:      Math.min(Math.max(prev.db      + (Math.random() > 0.5 ? 1  : -1),   2), 8),
        storage: prev.storage,
      }));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  
  const totalRevenue   = data?.stats?.totalRevenue   || 0;
  const totalOrders    = data?.stats?.totalOrders    || 0;
  const totalCustomers = data?.stats?.totalCustomers || 0;
  const totalProducts  = data?.stats?.totalProducts  || 0;
  const inventoryAlerts = (data?.inventoryStats?.lowStock || 0) + (data?.inventoryStats?.outOfStock || 0);
  const pendingOrders   = data?.orderStats?.pending || 0;
  const conversionRate  = totalOrders ? Math.round(((data?.orderStats?.completed || 0) / totalOrders) * 100) : 0;
  const avgOrderValue   = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const growth          = data?.growth ?? 0;
  const cardGrowth      = data?.cardGrowth || {};

  
  const revenueChartData = useMemo(() => {
    if (!data) return [];
    const avg = totalOrders ? totalRevenue / totalOrders : 1250000;
    if (revenueFilter.days === 7) {
      return (data.orderChart || []).map((item) => {
        const rev = (item.orders || 0) * avg;
        return { label: item.day, revenue: Math.round(rev), profit: Math.round(rev * 0.62), cost: Math.round(rev * 0.38) };
      });
    }
    if (revenueFilter.days === 30) {
      const base = data.orderChart || [];
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const lbl = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        const match = base.find((x) => x.day === lbl);
        const orders = match ? match.orders : Math.max(1, Math.round(avg / 1800000));
        const rev = orders * avg * (0.82 + Math.random() * 0.28);
        return { label: lbl, revenue: Math.round(rev), profit: Math.round(rev * 0.62), cost: Math.round(rev * 0.38) };
      });
    }
    return (data.revenueChart || []).map((item) => ({
      label:   item.month,
      revenue: item.revenue || 0,
      profit:  Math.round((item.revenue || 0) * 0.62),
      cost:    Math.round((item.revenue || 0) * 0.38),
    }));
  }, [data, revenueFilter, totalOrders, totalRevenue]);

  const revenueStats = useMemo(() => {
    if (!revenueChartData.length) return { total: 0, avg: 0, max: 0, min: 0 };
    const vals = revenueChartData.map((x) => x.revenue);
    const total = vals.reduce((s, v) => s + v, 0);
    return { total, avg: Math.round(total / vals.length), max: Math.max(...vals), min: Math.min(...vals) };
  }, [revenueChartData]);

  const sparklineData = useMemo(() => {
    if (!data) return {};
    return {
      revenue:   (data.revenueChart  || []).map((x) => x.revenue     || 0),
      orders:    (data.orderChart    || []).map((x) => x.orders       || 0),
      customers: (data.customerChart || []).map((x) => x.newCustomers || 0),
      products:  [42, 45, 48, 52, 55, 60],
    };
  }, [data]);

  const funnelData = useMemo(() => {
    if (!data?.orderStats) return [];
    const { pending = 0, confirmed = 0, shipping = 0, completed = 0 } = data.orderStats;
    const total  = pending + confirmed + shipping + completed || 1;
    const stage2 = confirmed + shipping + completed;
    const stage3 = shipping  + completed;
    return [
      { name: 'Chờ xử lý',   value: pending,   rate: 100,                                             color: '#F59E0B' },
      { name: 'Đã xác nhận', value: stage2,    rate: Math.round((stage2    / total)        * 100),    color: '#3B82F6' },
      { name: 'Đang giao',   value: stage3,    rate: Math.round((stage3    / (stage2 || 1)) * 100),   color: '#8B5CF6' },
      { name: 'Hoàn thành',  value: completed, rate: Math.round((completed / (stage3 || 1)) * 100),   color: '#10B981' },
    ];
  }, [data]);

  const heatmapData = useMemo(() => buildHeatmap(), []);

  const filteredVipCustomers = useMemo(() => {
    if (!data?.vipCustomers) return [];
    const list = data.vipCustomers.filter((c) => {
      const q = vipSearch.trim().toLowerCase();
      return !q || `${c.FullName} ${c.Email}`.toLowerCase().includes(q);
    });
    return list.sort((a, b) => {
      const fa = Number(a[vipSort.key] || 0);
      const fb = Number(b[vipSort.key] || 0);
      return vipSort.direction === 'asc' ? fa - fb : fb - fa;
    });
  }, [data, vipSearch, vipSort]);

  
  const QUICK_ACTIONS = [
    { label: 'Thêm Sản Phẩm',    icon: Plus,       color: 'bg-sky-500 hover:bg-sky-400',      onClick: () => navigate('/admin/products/create') },
    { label: 'Thêm Danh Mục',    icon: FolderPlus, color: 'bg-violet-500 hover:bg-violet-400', onClick: () => navigate('/admin/categories') },
    { label: 'Tạo Mã Giảm Giá', icon: Tag,         color: 'bg-amber-500 hover:bg-amber-400',   onClick: () => navigate('/admin/coupons') },
    { label: 'Thêm Thương Hiệu', icon: BadgeCheck, color: 'bg-rose-600 hover:bg-rose-500',   onClick: () => navigate('/admin/brands') },
  ];

  
  const pg      = dark ? 'bg-slate-950'    : 'bg-slate-50';
  const card    = dark ? 'bg-slate-900/60 border-slate-800'  : 'bg-white border-slate-200';
  const cardSub = dark ? 'bg-slate-950/50 border-slate-800'  : 'bg-slate-50 border-slate-200';
  const txt1    = dark ? 'text-slate-100'  : 'text-slate-900';
  const txt2    = dark ? 'text-slate-300'  : 'text-slate-700';
  const txt3    = dark ? 'text-slate-400'  : 'text-slate-500';
  const txt4    = dark ? 'text-slate-500'  : 'text-slate-400';
  const gridStroke = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const axisStroke = dark ? '#64748b' : '#94a3b8';
  const inputCls = dark
    ? 'border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-600 focus:border-sky-500'
    : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500';
  const selectCls = dark
    ? 'border-slate-700 bg-slate-950/80 text-slate-100'
    : 'border-slate-300 bg-white text-slate-900';
  const thCls = dark
    ? 'bg-slate-950/80 text-slate-500'
    : 'bg-slate-100 text-slate-500';
  const trHover = dark ? 'hover:bg-slate-900/80' : 'hover:bg-slate-50';
  const trBorder = dark ? 'border-slate-800' : 'border-slate-200';
  const filterBtn = (active) => active
    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
    : dark
      ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'
      : 'bg-white text-slate-600 border border-slate-300 hover:border-slate-400';
  const badgeDark = dark
    ? 'border-slate-700 bg-slate-900 text-slate-400'
    : 'border-slate-300 bg-slate-100 text-slate-500';

  const NOTIFICATION_SEVERITY = {
    critical: dark
      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      : 'bg-rose-50 text-rose-700 border border-rose-200',
    warning: dark
      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      : 'bg-amber-50 text-amber-700 border border-amber-200',
    info: dark
      ? 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
      : 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const notifTitle = dark ? 'text-slate-100' : 'text-slate-800';
  const notifDesc  = dark ? 'text-slate-300'  : 'text-slate-600';

  if (loading) return <DashboardSkeleton dark={dark} />;
  if (error || !data) return <DashboardError message={error} retry={fetchDashboardData} dark={dark} />;

  
  return (
    <div className={`${pg} px-4 sm:px-6 pb-12 space-y-8 min-h-screen transition-colors duration-300`}>

      <div className="flex flex-col gap-5 pt-2">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.28em] font-semibold ${txt4}`}>Admin Dashboard</p>
            <p className={`mt-1.5 text-sm max-w-xl ${txt3}`}>
              Phân tích doanh nghiệp, giám sát kho hàng và quản lý doanh thu ngành y tế.
            </p>
          </div>
          <div className={`shrink-0 rounded-2xl border px-5 py-3 text-sm shadow-inner ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white shadow-slate-100'}`}>
            <p className={`text-[10px] uppercase tracking-[0.24em] font-semibold ${txt4}`}>Tăng Trưởng Hôm Nay</p>
            <p className={`mt-1 text-xl font-black ${growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {growth >= 0 ? '+' : ''}{growth}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all active:scale-95 ${action.color}`}
            >
              <action.icon size={15} />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        <AdminStatCard title="Doanh Thu"          value={formatPrice(totalRevenue)}   icon={DollarSign}    color="sky"     growth={growth}  compareLabel="hôm qua"     sparklineData={sparklineData.revenue}                                    index={0} to="/admin/orders" />
        <AdminStatCard title="Đơn Hàng"           value={totalOrders}                 icon={ShoppingBag}   color="emerald" growth={cardGrowth.orders ?? 0}          compareLabel="tuần trước"  sparklineData={sparklineData.orders} index={1} to="/admin/orders" />
        <AdminStatCard title="Khách Hàng"         value={totalCustomers}              icon={Users}         color="violet"  growth={cardGrowth.customers ?? 0}      compareLabel="tháng trước" sparklineData={sparklineData.customers}                                  index={2} to="/admin/users" />
        <AdminStatCard title="Sản Phẩm"           value={totalProducts}               icon={Package}       color="amber"   growth={cardGrowth.products ?? 0}       compareLabel="tháng trước" sparklineData={sparklineData.products}                                   index={3} to="/admin/products" />
        <AdminStatCard title="Cảnh Báo Kho"       value={inventoryAlerts}             icon={AlertTriangle} color="orange"  growth={cardGrowth.inventoryAlerts}     compareLabel="ngày trước"  sparklineData={[12,10,14,8,11,9,7]}                                     index={4} to="/admin/products" />
        <AdminStatCard title="Đơn Chờ Xử Lý"     value={pendingOrders}               icon={Clock4}        color="cyan"    growth={cardGrowth.pendingOrders}        compareLabel="hôm qua"     sparklineData={[18,16,19,21,20,18,17]}                                   index={5} to="/admin/orders" />
        <AdminStatCard title="Tỷ Lệ Chuyển Đổi"  value={`${conversionRate}%`}        icon={TrendingUp}    color="emerald" growth={cardGrowth.conversionRate ?? 0} compareLabel="tuần trước"  sparklineData={[43,45,48,47,51,52,54]}                                   index={6} to="/admin/orders" />
        <AdminStatCard title="Giá Trị Đơn TB"     value={formatPrice(avgOrderValue)}  icon={CreditCard}    color="purple"  growth={cardGrowth.avgOrderValue ?? 0}  compareLabel="tháng trước" sparklineData={[1100000,1300000,1200000,1400000,1500000,1450000,1520000]} index={7} to="/admin/orders" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">

        <AdminPanel
          title="Trung Tâm Doanh Thu"
          subtitle="Doanh thu, lợi nhuận và chi phí theo kênh kinh doanh"
          action={<span className={`rounded-xl border px-3 py-1.5 text-xs ${badgeDark}`}>{revenueFilter.label}</span>}
        >
          <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: 'Tổng Doanh Thu',       value: formatPrice(revenueStats.total), icon: DollarSign,   accent: 'sky'     },
              { label: 'Doanh Thu Trung Bình', value: formatPrice(revenueStats.avg),   icon: Activity,     accent: 'violet'  },
              { label: 'Cao Nhất',             value: formatPrice(revenueStats.max),   icon: TrendingUp,   accent: 'emerald' },
              { label: 'Thấp Nhất',            value: formatPrice(revenueStats.min),   icon: TrendingDown, accent: 'rose'    },
            ].map((item) => {
              const accentBar = {
                sky: 'bg-sky-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500', rose: 'bg-rose-500',
              }[item.accent];
              const accentIcon = dark
                ? { sky: 'bg-sky-500/15 text-sky-400', violet: 'bg-violet-500/15 text-violet-400', emerald: 'bg-emerald-500/15 text-emerald-400', rose: 'bg-rose-500/15 text-rose-400' }[item.accent]
                : { sky: 'bg-sky-50 text-sky-600', violet: 'bg-violet-50 text-violet-600', emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600' }[item.accent];
              return (
                <div key={item.label} className={`relative overflow-hidden rounded-2xl border p-3.5 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                  <div className={`absolute inset-x-0 top-0 h-0.5 ${accentBar}`} />
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[10px] uppercase tracking-[0.2em] font-semibold ${txt4}`}>{item.label}</p>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${accentIcon}`}>
                      <item.icon size={13} />
                    </div>
                  </div>
                  <p className={`mt-2.5 text-sm font-black truncate ${txt1}`}>{item.value}</p>
                </div>
              );
            })}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {REVENUE_FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setRevenueFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${filterBtn(revenueFilter.label === f.label)}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-[300px] w-full">
            {chartsReady && (
            <ResponsiveContainer width="100%" height="100%" debounce={200}>
              <AreaChart data={revenueChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="label" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1e6).toFixed(0)}M`} width={40} />
                <Tooltip content={<ChartTooltip formatter={formatPrice} dark={dark} />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 12, fontSize: 12, color: dark ? '#94a3b8' : '#64748b' }} />
                <Area type="monotone" dataKey="revenue" name="Doanh Thu" stroke="#3B82F6" fill="url(#revGrad)"  strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="profit"  name="Lợi Nhuận" stroke="#10B981" fill="url(#profGrad)" strokeWidth={2}   dot={false} />
                <Area type="monotone" dataKey="cost"    name="Chi Phí"   stroke="#EF4444" fill="url(#costGrad)" strokeWidth={2}   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </AdminPanel>

        <AdminPanel title="Bảng Phân Tích AI" subtitle="Tín hiệu thông minh và đề xuất hành động">
          <div className="space-y-4 h-full">
            <div className={`rounded-2xl border border-l-4 border-l-sky-500 p-5 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
              <p className={`text-[10px] uppercase tracking-[0.24em] font-semibold ${txt4}`}>Xu Hướng Doanh Thu</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className={`text-3xl font-black ${growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {growth >= 0 ? '+' : ''}{growth}%
                  </p>
                  <p className={`mt-2 text-sm ${txt3}`}>Doanh thu tăng so với kỳ trước.</p>
                </div>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sky-400 ${dark ? 'bg-slate-800' : 'bg-sky-50'}`}>
                  <Sparkles size={20} />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border border-l-4 border-l-violet-500 p-5 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
              <p className={`text-[10px] uppercase tracking-[0.24em] font-semibold ${txt4}`}>Danh Mục Hiệu Suất Tốt Nhất</p>
              <p className={`mt-3 text-xl font-black ${txt1}`}>{data.categoryRevenue?.[0]?.name || 'Thiết Bị Chẩn Đoán'}</p>
              <p className={`mt-2 text-sm ${txt3}`}>Phân khúc tăng trưởng nhanh nhất từ thiết bị y tế chẩn đoán.</p>
            </div>

            <div className={`rounded-2xl border border-l-4 border-l-amber-500 p-5 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
              <p className={`text-[10px] uppercase tracking-[0.24em] font-semibold ${txt4}`}>Đề Xuất Hành Động</p>
              <div className={`mt-3 flex items-center gap-3 rounded-2xl p-4 ${dark ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white">
                  <ArrowRight size={18} />
                </div>
                <div>
                  <p className={`font-black ${txt1}`}>Nhập thêm 25 đơn vị</p>
                  <p className={`mt-1 text-sm ${txt3}`}>Hàng tồn thấp đang giới hạn danh mục tăng trưởng nhanh nhất.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Đơn Hoàn Thành', value: data.orderStats?.completed || 0, color: 'text-emerald-500' },
                { label: 'Đơn Đã Hủy',     value: data.orderStats?.cancelled || 0, color: 'text-rose-500'    },
              ].map((item) => (
                <div key={item.label} className={`rounded-2xl border p-4 text-center ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                  <p className={`text-2xl font-black ${item.color}`}><CountUp to={item.value} /></p>
                  <p className={`mt-1 text-[11px] uppercase tracking-wide ${txt4}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <AdminPanel className="xl:col-span-2" title="Phân Tích Đơn Hàng" subtitle="Phân phối trạng thái và phiếu chuyển đổi đơn hàng">
          <div className="grid gap-6 md:grid-cols-2">

            <div className={`rounded-2xl border p-5 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-[0.24em] ${txt4}`}>Trạng Thái Đơn Hàng</h3>
                  <p className={`mt-1 text-2xl font-black ${txt1}`}><CountUp to={totalOrders} /> đơn</p>
                </div>
                <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-500 font-semibold">Live</span>
              </div>
              <div className="h-[180px] w-full">
                {chartsReady && (
                <ResponsiveContainer width="100%" height="100%" debounce={200}>
                  <PieChart>
                    <Pie
                      data={ORDER_STATUS_UI.map((s) => ({ name: s.label, value: data.orderStats?.[s.key] || 0, color: s.color })).filter((x) => x.value > 0)}
                      cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value"
                    >
                      {ORDER_STATUS_UI.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={(v) => `${v} đơn`} dark={dark} />} />
                  </PieChart>
                </ResponsiveContainer>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {ORDER_STATUS_UI.slice(0, 4).map((s) => (
                  <div key={s.key} className={`flex items-center justify-between rounded-xl border px-3 py-2 ${cardSub} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                    <div className={`flex items-center gap-2 text-sm ${txt2}`}>
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </div>
                    <span className={`font-black text-sm ${txt1}`}><CountUp to={data.orderStats?.[s.key] || 0} /></span>
                  </div>
                ))}
              </div>
            </div>

            
            <div className={`rounded-2xl border p-5 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-[0.24em] ${txt4}`}>Phiếu Đơn Hàng</h3>
                  <p className={`mt-1 text-2xl font-black ${txt1}`}>Luồng Chuyển Đổi</p>
                </div>
                <span className="rounded-xl bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 text-xs text-sky-500 font-semibold">Tối Ưu</span>
              </div>
              <div className="mt-4 space-y-5">
                {funnelData.map((stage) => (
                  <div key={stage.name}>
                    <div className={`flex items-center justify-between text-sm mb-1.5 ${txt2}`}>
                      <span className="font-medium">{stage.name}</span>
                      <span className="font-black">{stage.rate}%</span>
                    </div>
                    <div className={`h-2.5 rounded-full ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stage.rate}%`, backgroundColor: stage.color }} />
                    </div>
                    <p className={`mt-1 text-[11px] ${txt4}`}>{stage.value} đơn hàng</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Biểu Đồ Nhiệt Doanh Thu" subtitle="Cường độ mua hàng theo khung giờ & ngày">
          <div className="flex flex-col gap-4">

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Đỉnh Cao',  value: 'T6 14h', color: dark ? 'text-violet-400' : 'text-violet-600', bg: dark ? 'bg-violet-500/10 border-violet-500/20' : 'bg-violet-50 border-violet-200' },
                { label: 'Thấp Nhất', value: 'CN 08h', color: dark ? 'text-slate-400'  : 'text-slate-500',  bg: dark ? 'bg-slate-800 border-slate-700'         : 'bg-slate-100 border-slate-200' },
                { label: 'TB / Ô',    value: '54%',     color: dark ? 'text-sky-400'    : 'text-sky-600',    bg: dark ? 'bg-sky-500/10 border-sky-500/20'       : 'bg-sky-50 border-sky-200' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                  <p className={`text-[9px] uppercase tracking-widest font-semibold ${txt4}`}>{s.label}</p>
                  <p className={`mt-1 text-sm font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className={`rounded-2xl border p-4 ${dark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                <div className="min-w-[280px]">
                  <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(8, 1fr)', gap: '4px', marginBottom: '4px' }}>
                    <div />
                    {HEATMAP_HOURS.map((h) => (
                      <div key={h} className={`text-[9px] font-bold text-center ${txt4}`}>{h}</div>
                    ))}
                  </div>
                  {heatmapData.map((row, di) => (
                    <div key={di} style={{ display: 'grid', gridTemplateColumns: '28px repeat(8, 1fr)', gap: '4px', marginBottom: '4px' }}>
                      <div className={`flex items-center text-[10px] font-black ${txt2}`}>{row.day}</div>
                      {row.values.map((val, ci) => {
                        const intensity = val / 100;
                        // violet → sky gradient by intensity
                        const r = Math.round(139 + (59  - 139) * intensity);
                        const g = Math.round(92  + (130 - 92)  * intensity);
                        const b = Math.round(246 + (246 - 246) * intensity);
                        const alpha = 0.12 + intensity * 0.78;
                        return (
                          <div
                            key={ci}
                            className="group relative cursor-pointer transition-transform duration-200 hover:z-10 hover:scale-125"
                            style={{ aspectRatio: '1', borderRadius: '6px', backgroundColor: `rgba(${r},${g},${b},${alpha})` }}
                            title={`${row.day} ${HEATMAP_HOURS[ci]}: ${val}%`}
                          >
                            <div className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-bold opacity-0 shadow-lg transition-opacity group-hover:opacity-100 ${dark ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'}`}>
                              {row.day} {HEATMAP_HOURS[ci]} · {val}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`mt-4 flex items-center justify-between gap-2 text-[10px] font-semibold ${txt4}`}>
                <span>Thấp</span>
                <div className="flex flex-1 mx-2 h-2 rounded-full overflow-hidden">
                  <div className="flex-1" style={{ background: 'linear-gradient(to right, rgba(139,92,246,0.12), rgba(139,92,246,0.35), rgba(99,102,241,0.55), rgba(59,130,246,0.75), rgba(59,130,246,0.9))' }} />
                </div>
                <span>Cao</span>
              </div>
            </div>

            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${dark ? 'bg-violet-500/8 border-violet-500/15' : 'bg-violet-50 border-violet-100'}`}>
              <Zap size={14} className={dark ? 'text-violet-400' : 'text-violet-500'} />
              <p className={`text-xs ${dark ? 'text-violet-300' : 'text-violet-700'}`}>
                <span className="font-bold">Thứ Sáu 14h–16h</span> là khung giờ vàng — lượng mua cao hơn TB <span className="font-bold">38%</span>
              </p>
            </div>
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        <AdminPanel title="Hiệu Suất Sản Phẩm" subtitle="Sản phẩm bán chạy và doanh thu theo danh mục">
          <div className="space-y-5">

            <div className={`flex items-center justify-between rounded-2xl border px-5 py-3 ${dark ? 'bg-gradient-to-r from-sky-500/10 to-blue-500/5 border-sky-500/20' : 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200'}`}>
              <div>
                <p className={`text-[10px] uppercase tracking-[0.22em] font-semibold ${txt4}`}>Sản Phẩm Đang Kinh Doanh</p>
                <p className={`text-2xl font-black mt-0.5 ${txt1}`}><CountUp to={totalProducts} /></p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${dark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
                <Package size={22} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-bold uppercase tracking-[0.22em] ${txt4}`}>Sản Phẩm Bán Chạy Nhất</h3>
                <span className={`rounded-xl border px-2.5 py-1 text-xs font-semibold ${badgeDark}`}>Top 6</span>
              </div>
              <div className="space-y-2">
                {data.topProducts?.slice(0, 6).map((product, idx) => {
                  const maxRev = Math.max(...data.topProducts.map((x) => x.revenue || 0), 1);
                  const pct = Math.round(((product.revenue || 0) / maxRev) * 100);
                  const rankColors = ['text-amber-500', 'text-slate-400', 'text-orange-600', txt4, txt4, txt4];
                  return (
                    <div key={product.ProductId || idx} className={`flex items-center gap-3 rounded-2xl border p-3 transition ${card} ${dark ? 'hover:border-sky-500/40' : 'hover:border-sky-400 hover:shadow-sm'}`}>
                      <span className={`text-sm font-black w-5 shrink-0 ${rankColors[idx]}`}>#{idx + 1}</span>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        {product.PrimaryImage
                          ? <img src={product.PrimaryImage} alt={product.Name} className="h-full w-full object-cover" />
                          : <Package size={14} className={txt4} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold ${txt1}`}>{product.Name}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className={`flex-1 h-1.5 rounded-full ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-[10px] font-semibold shrink-0 ${txt4}`}>{pct}%</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-black text-sky-500">{formatPrice(product.revenue || 0)}</p>
                        <p className={`text-[10px] mt-0.5 ${txt4}`}>{product.CategoryName || 'Y Tế'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-bold uppercase tracking-[0.22em] ${txt4}`}>Doanh Thu Theo Danh Mục</h3>
                <span className={`rounded-xl border px-2.5 py-1 text-xs font-semibold ${badgeDark}`}>6 tháng</span>
              </div>
              <div className={`rounded-2xl border p-4 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                <div className="h-[240px] w-full">
                  {chartsReady && (
                  <ResponsiveContainer width="100%" height="100%" debounce={200}>
                    <BarChart data={data.categoryRevenue || []} margin={{ top: 0, right: 4, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="catBarGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.55} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                      <XAxis dataKey="name" stroke={axisStroke} fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke={axisStroke} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1e6).toFixed(0)}M`} />
                      <Tooltip content={<ChartTooltip formatter={formatPrice} dark={dark} />} />
                      <Bar dataKey="revenue" name="Doanh Thu" fill="url(#catBarGrad2)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Trung Tâm Kho Hàng" subtitle="Tình trạng tồn kho và cảnh báo sắp hết hàng">
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-3">
              {[
                { label: 'Còn Hàng', value: data.inventoryStats?.inStock    || 0, color: 'text-emerald-500', bg: dark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200' },
                { label: 'Sắp Hết',  value: data.inventoryStats?.lowStock   || 0, color: 'text-amber-500',   bg: dark ? 'bg-amber-500/10 border-amber-500/20'   : 'bg-amber-50 border-amber-200'   },
                { label: 'Hết Hàng', value: data.inventoryStats?.outOfStock || 0, color: 'text-rose-500',    bg: dark ? 'bg-rose-500/10 border-rose-500/20'     : 'bg-rose-50 border-rose-200'     },
              ].map((item) => (
                <div key={item.label} className={`rounded-2xl border ${item.bg} p-3 text-center`}>
                  <p className={`text-[10px] uppercase tracking-[0.22em] font-semibold ${txt4}`}>{item.label}</p>
                  <p className={`mt-2 text-3xl font-black ${item.color}`}><CountUp to={item.value} /></p>
                </div>
              ))}
            </div>

            <div className={`rounded-2xl border p-4 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className={`text-xs font-bold uppercase tracking-[0.24em] ${txt4}`}>Cảnh Báo Tồn Kho Thấp</h3>
                <span className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-500 font-semibold">Ưu tiên cao</span>
              </div>
              <div className="space-y-2.5">
                {data.lowStockProducts?.slice(0, 5).map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between rounded-2xl border p-3 text-sm ${cardSub} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                    <div className="min-w-0 flex-1 pr-3">
                      <p className={`font-semibold truncate ${txt1}`}>{item.Name}</p>
                      <p className={`text-[11px] mt-0.5 ${txt4}`}>NCC: {SUPPLIER_NAMES[idx % SUPPLIER_NAMES.length]}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-black text-sm ${item.Stock <= 5 ? 'text-rose-500' : 'text-amber-500'}`}>{item.Stock} còn</p>
                      <p className={`text-[11px] ${txt4}`}>{Math.max(1, item.Stock)} ngày</p>
                    </div>
                  </div>
                ))}
                {!data.lowStockProducts?.length && (
                  <p className={`text-center text-sm py-4 ${txt4}`}>Không có cảnh báo tồn kho.</p>
                )}
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">

        <AdminPanel title="Phân Tích Khách Hàng" subtitle="Tỷ lệ giữ chân và hiệu suất vòng đời">
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 xl:grid-cols-1">
              {[
                { label: 'Tỷ Lệ Giữ Chân',   value: '74.5%',   icon: ShieldCheck },
                { label: 'Tỷ Lệ Chuyển Đổi', value: '3.2%',    icon: TrendingUp  },
                { label: 'Giá Trị Vòng Đời',  value: formatPrice(Math.round(totalRevenue / Math.max(1, totalCustomers * 2))), icon: Users },
              ].map((metric) => (
                <div key={metric.label} className={`rounded-2xl border p-4 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                  <div className={`flex items-center gap-2 mb-1.5 ${txt3}`}>
                    <metric.icon size={14} />
                    <span className={`text-[10px] uppercase tracking-[0.22em] font-semibold`}>{metric.label}</span>
                  </div>
                  <p className={`text-xl font-black ${txt1}`}>{metric.value}</p>
                </div>
              ))}
            </div>
            <div className={`h-[220px] w-full rounded-2xl border p-3 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
              {chartsReady && (
              <ResponsiveContainer width="100%" height="100%" debounce={200}>
                <AreaChart data={(data.customerChart || []).map((x) => ({
                  ...x,
                  returning: Math.round((x.newCustomers || 0) * 0.42),
                  vip:       Math.round((x.newCustomers || 0) * 0.12),
                }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="custNewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.35} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="custRetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.28} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="custVipGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.24} /><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" stroke={axisStroke} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={axisStroke} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip dark={dark} />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: dark ? '#94a3b8' : '#64748b' }} />
                  <Area type="monotone" dataKey="newCustomers" name="Mới"      stroke="#3B82F6" fill="url(#custNewGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="returning"    name="Quay Lại" stroke="#10B981" fill="url(#custRetGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="vip"          name="VIP"      stroke="#8B5CF6" fill="url(#custVipGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Phân Tích Thanh Toán" subtitle="Phân phối phương thức thanh toán">
          <div className={`rounded-2xl border p-5 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-[0.24em] ${txt4}`}>Phổ Biến Nhất</h3>
                <p className={`mt-1 text-xl font-black ${txt1}`}>{data.paymentStats?.[0]?.name || 'COD'}</p>
              </div>
              <span className={`rounded-xl border px-3 py-1.5 text-xs ${badgeDark}`}>{data.paymentStats?.length || 0} phương thức</span>
            </div>
            <div className="h-[160px] w-full">
              {chartsReady && (
              <ResponsiveContainer width="100%" height="100%" debounce={200}>
                <PieChart>
                  <Pie data={data.paymentStats || []} cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={4} dataKey="value">
                    {(data.paymentStats || []).map((_, i) => <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v} giao dịch`} dark={dark} />} />
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {(data.paymentStats || []).map((entry, idx) => {
                const totalTx = (data.paymentStats || []).reduce((s, x) => s + (x.value || 0), 0) || 1;
                const pct = Math.round(((entry.value || 0) / totalTx) * 100);
                return (
                  <div key={entry.name} className={`rounded-2xl border px-4 py-3 ${cardSub} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                    <div className={`flex items-center justify-between text-sm ${txt1}`}>
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }} />
                        <span className="font-medium">{entry.name}</span>
                      </span>
                      <span className="font-black">{pct}%</span>
                    </div>
                    <div className={`mt-1.5 flex items-center justify-between text-xs ${txt3}`}>
                      <span>{entry.value} giao dịch</span>
                      <span className={`font-semibold ${txt2}`}>{formatPrice(entry.total || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Phân Tích Đánh Giá" subtitle="Điểm trung bình và mức độ hài lòng">
          <div className={`rounded-2xl border p-5 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
            <div className="flex items-center gap-4 mb-6">
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border ${dark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                <span className="text-3xl font-black text-amber-500">{(data.reviewStats?.avg || 0).toFixed(1)}</span>
              </div>
              <div>
                <p className={`text-[10px] uppercase tracking-[0.24em] font-semibold ${txt4}`}>Đánh Giá Trung Bình</p>
                <p className={`mt-1 text-2xl font-black ${txt1}`}><CountUp to={data.reviewStats?.total || 0} /></p>
                <p className={`mt-0.5 text-sm ${txt3}`}>đánh giá · 96.8% hài lòng</p>
              </div>
            </div>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star, idx) => {
                const count = data.reviewStats?.dist?.[idx] || 0;
                const total = data.reviewStats?.total || 1;
                const width = Math.round((count / total) * 100);
                return (
                  <div key={star}>
                    <div className={`flex items-center justify-between text-sm mb-1 ${txt2}`}>
                      <span className="font-semibold">{star} ★</span>
                      <span className={`text-xs ${txt4}`}>{count}</span>
                    </div>
                    <div className={`h-2 rounded-full ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <AdminPanel className="xl:col-span-2" title="Khách Hàng VIP" subtitle="Những khách hàng chi tiêu cao nhất">
          <div className={`rounded-2xl border p-5 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={vipSearch}
                onChange={(e) => setVipSearch(e.target.value)}
                placeholder="Tìm kiếm khách hàng VIP..."
                className={`flex-1 rounded-2xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}
              />
              <select
                value={`${vipSort.key}:${vipSort.direction}`}
                onChange={(e) => { const [k, d] = e.target.value.split(':'); setVipSort({ key: k, direction: d }); }}
                className={`rounded-2xl border px-4 py-2.5 text-sm outline-none ${selectCls}`}
              >
                <option value="totalSpent:desc">Chi tiêu cao → thấp</option>
                <option value="totalSpent:asc">Chi tiêu thấp → cao</option>
                <option value="totalOrders:desc">Đơn hàng cao → thấp</option>
                <option value="totalOrders:asc">Đơn hàng thấp → cao</option>
              </select>
            </div>
            <div className={`overflow-x-auto rounded-2xl border ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
              <table className={`min-w-[540px] w-full text-left text-sm ${txt2}`}>
                <thead className={`text-[10px] uppercase tracking-[0.22em] ${thCls}`}>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Khách Hàng</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Đơn Hàng</th>
                    <th className="px-4 py-3 font-semibold">Chi Tiêu</th>
                    <th className="px-4 py-3 font-semibold">Hạng</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVipCustomers.slice(0, 5).map((c, idx) => {
                    const initials = getInitials(c.FullName || c.fullName);
                    const tier = idx === 0 ? 'Bạch Kim' : idx < 3 ? 'Vàng' : 'Bạc';
                    const tierCls = tier === 'Bạch Kim'
                      ? dark ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20' : 'bg-violet-100 text-violet-700 border border-violet-200'
                      : tier === 'Vàng'
                        ? dark ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' : 'bg-amber-100 text-amber-700 border border-amber-200'
                        : dark ? 'bg-slate-700/50 text-slate-300 border border-slate-600/20' : 'bg-slate-100 text-slate-600 border border-slate-200';
                    const tierRing = tier === 'Bạch Kim'
                      ? 'ring-2 ring-violet-400/60 bg-gradient-to-br from-violet-400 to-purple-600'
                      : tier === 'Vàng'
                        ? 'ring-2 ring-amber-400/60 bg-gradient-to-br from-amber-400 to-orange-500'
                        : 'ring-2 ring-slate-400/40 bg-gradient-to-br from-slate-400 to-slate-500';
                    const rawAvatar = c.Avatar || c.AvatarUrl || c.ProfileImage || c.PhotoURL || null;
                    const avatarUrl = rawAvatar ? getImageUrl(rawAvatar) : null;
                    return (
                      <tr key={c.UserId || idx} className={`border-t ${trBorder} ${trHover} transition cursor-pointer`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={c.FullName || c.fullName || 'Khách hàng'}
                                className={`h-9 w-9 shrink-0 rounded-full object-cover ${tierRing}`}
                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                              />
                            ) : null}
                            <div
                              className={`h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${tierRing}`}
                              style={{ display: avatarUrl ? 'none' : 'flex' }}
                            >
                              {initials}
                            </div>
                            <div>
                              <p className={`font-semibold ${txt1}`}>{c.FullName || c.fullName}</p>
                              <p className={`text-[11px] ${txt4}`}>Khách VIP</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-3 max-w-[160px] truncate ${txt3}`}>{c.Email || c.email}</td>
                        <td className={`px-4 py-3 font-semibold ${txt2}`}>{c.totalOrders || 0}</td>
                        <td className="px-4 py-3 font-black text-sky-500">{formatPrice(c.totalSpent || 0)}</td>
                        <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${tierCls}`}>{tier}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Bán Hàng Theo Khu Vực" subtitle="Top tỉnh thành theo doanh thu">
          <div className="space-y-2.5">
            {CITY_NAMES.map((city, idx) => {
              const rev = Math.round(totalRevenue * ((CITY_NAMES.length - idx) / 22));
              const maxRev = Math.round(totalRevenue * (CITY_NAMES.length / 22));
              const pct = Math.round((rev / (maxRev || 1)) * 100);
              return (
                <div key={city} className={`rounded-2xl border p-4 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className={`font-semibold text-sm ${txt1}`}>{city}</p>
                      <p className={`text-[11px] ${txt4}`}>#{idx + 1} khu vực</p>
                    </div>
                    <span className={`font-black text-sm ${txt1}`}>{formatPrice(rev)}</span>
                  </div>
                  <div className={`h-1.5 rounded-full ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Phân Tích Nhà Cung Cấp" subtitle="Đóng góp doanh thu và kho hàng theo nhà cung cấp">
          <div className="space-y-3">
            {SUPPLIER_NAMES.map((supplier, idx) => {
              const revenue = Math.round(totalRevenue * ((SUPPLIER_NAMES.length - idx) / 24));
              const products = 12 + idx * 4;
              const pct = Math.max(45, 100 - idx * 12);
              return (
                <div key={supplier} className={`rounded-2xl border p-4 transition ${card} ${dark ? 'hover:border-sky-500/50' : 'hover:border-sky-400 hover:shadow-sm'}`}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className={`font-semibold text-sm ${txt1}`}>{supplier}</p>
                      <p className={`text-[11px] ${txt4}`}>Đóng Góp Doanh Thu</p>
                    </div>
                    <p className={`font-black text-sm shrink-0 ${txt1}`}>{formatPrice(revenue)}</p>
                  </div>
                  <div className={`h-1.5 rounded-full ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="h-full rounded-full bg-sky-500/60" style={{ width: `${pct}%` }} />
                  </div>
                  <div className={`mt-1.5 flex items-center justify-between text-[11px] ${txt4}`}>
                    <span>{products} sản phẩm</span><span>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel title="Giám Sát Thực Tế" subtitle="Tín hiệu sử dụng và xử lý trực tiếp">
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-2">
              {[
                { label: 'Người Dùng Online',      value: 46,                                                                                                            icon: Users       },
                { label: 'Phiên Hoạt Động',        value: 18,                                                                                                            icon: Activity    },
                { label: 'Đơn Hàng Hôm Nay',      value: (data.orderStats?.confirmed || 0) + (data.orderStats?.shipping || 0) + (data.orderStats?.completed || 0),     icon: ShoppingBag },
                { label: 'Thanh Toán Đang Xử Lý', value: data.paymentStats?.reduce((s, x) => s + (x.value || 0), 0) || 0,                                              icon: CreditCard  },
              ].map((item) => (
                <div key={item.label} className={`rounded-2xl border p-4 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                  <div className={`flex items-center gap-2 mb-2 ${txt3}`}>
                    <item.icon size={14} />
                    <span className={`text-[10px] uppercase tracking-[0.22em] font-semibold leading-tight`}>{item.label}</span>
                  </div>
                  <p className={`text-3xl font-black ${txt1}`}><CountUp to={item.value} /></p>
                </div>
              ))}
            </div>

            <div className={`rounded-2xl border p-5 space-y-4 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
              <h3 className={`text-xs font-bold uppercase tracking-[0.24em] ${txt4}`}>Tài Nguyên Hệ Thống</h3>
              {[
                { label: 'CPU',            value: systemMetrics.cpu,     max: 100, color: '#3B82F6', suffix: '%'      },
                { label: 'RAM',            value: systemMetrics.ram,     max: 100, color: '#8B5CF6', suffix: '%'      },
                { label: 'API',            value: systemMetrics.api,     max: 200, color: '#10B981', suffix: ' req/s' },
                { label: 'Cơ sở dữ liệu', value: systemMetrics.db,      max: 20,  color: '#F59E0B', suffix: ' ms'    },
                { label: 'Lưu trữ',        value: systemMetrics.storage, max: 100, color: '#EF4444', suffix: '%'      },
              ].map((m) => (
                <div key={m.label}>
                  <div className={`flex items-center justify-between text-xs mb-1.5 ${txt2}`}>
                    <span className="font-semibold">{m.label}</span>
                    <span className={`font-black ${txt1}`}>{m.value}{m.suffix}</span>
                  </div>
                  <div className={`h-2 rounded-full ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (m.value / m.max) * 100)}%`, backgroundColor: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <AdminPanel className="xl:col-span-2" title="Đơn Hàng Gần Đây" subtitle="Tổng quan đơn hàng doanh nghiệp">
          <div className={`overflow-x-auto rounded-2xl border ${dark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
            <table className={`min-w-[600px] w-full text-left text-sm ${txt2}`}>
              <thead className={`text-[10px] uppercase tracking-[0.22em] ${thCls}`}>
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã Đơn</th>
                  <th className="px-4 py-3 font-semibold">Khách Hàng</th>
                  <th className="px-4 py-3 font-semibold">Thanh Toán</th>
                  <th className="px-4 py-3 font-semibold">Trạng Thái</th>
                  <th className="px-4 py-3 font-semibold">Tổng Tiền</th>
                  <th className="px-4 py-3 font-semibold">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders?.slice(0, 6).map((order) => {
                  const status = orderStatusLabel[order.Status] || { label: order.Status, color: dark ? 'text-slate-300' : 'text-slate-600' };
                  return (
                    <tr
                      key={order.OrderId}
                      className={`border-t ${trBorder} ${trHover} transition cursor-pointer`}
                      onClick={() => navigate('/admin/orders')}
                    >
                      <td className={`px-4 py-3 font-black ${txt1}`}>#{order.OrderCode}</td>
                      <td className={`px-4 py-3 ${txt2}`}>{order.FullName}</td>
                      <td className={`px-4 py-3 ${txt3}`}>{order.PaymentMethod || 'Online'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-sky-500">{formatPrice(order.TotalAmount)}</td>
                      <td className={`px-4 py-3 text-xs ${txt4}`}>{formatDate(order.CreatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <AdminPanel title="Dòng Thời Gian" subtitle="Sự kiện hệ thống và thương mại gần đây">
          <div className="space-y-3">
            {data.recentOrders?.slice(0, 5).map((order, idx) => {
              const icons = [ShoppingBag, Users, CreditCard, Star, Activity];
              const Icon = icons[idx % icons.length];
              const texts = [
                `Đơn hàng mới #${order.OrderCode} đã nhận`,
                `Khách hàng ${order.FullName} vừa đăng ký`,
                `Thanh toán ${order.PaymentMethod || 'Online'} thành công`,
                `Có đánh giá mới từ khách hàng`,
                `Đơn hàng cập nhật: ${orderStatusLabel[order.Status]?.label || order.Status}`,
              ];
              return (
                <div key={idx} className={`flex items-start gap-3 rounded-2xl border p-3 ${card} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sky-500 ${dark ? 'bg-slate-800' : 'bg-sky-50'}`}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold leading-snug ${txt1}`}>{texts[idx % 5]}</p>
                    <p className={`mt-1 text-xs ${txt4}`}>{formatDate(order.CreatedAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminPanel>
      </div>

      <div className="flex flex-col gap-6">
        <AdminPanel title="Trung Tâm Thông Báo" subtitle="Cảnh báo, lỗi và vấn đề ưu tiên cao">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Tồn kho vượt ngưỡng thấp',      type: 'critical', description: '5 sản phẩm cần nhập thêm trong 24 giờ tới.',  icon: AlertTriangle },
              { title: 'Lỗi thanh toán tăng đột biến',  type: 'warning',  description: 'Lỗi thanh toán tăng 18% trên cổng VNPay.',    icon: TrendingDown  },
              { title: 'Banner khuyến mãi hết hạn',     type: 'warning',  description: 'Banner quảng cáo chính đã hết hạn hiển thị.', icon: BellRing      },
              { title: 'Yêu cầu hỗ trợ đang chờ duyệt',type: 'info',     description: '12 yêu cầu hỗ trợ mới đang chờ xem xét.',    icon: Clock4        },
            ].map((item) => (
              <div key={item.title} className={`flex flex-col gap-3 rounded-2xl p-4 ${NOTIFICATION_SEVERITY[item.type]}`}>
                <item.icon size={18} className="shrink-0" />
                <div>
                  <p className={`font-semibold text-sm ${notifTitle}`}>{item.title}</p>
                  <p className={`mt-1 text-xs leading-relaxed ${notifDesc}`}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel id="banner-settings" title="Cài Đặt Nội Dung" subtitle="Quản lý banner và hình ảnh trang hiển thị">
          <div className="flex flex-col gap-5">

            <div className={`relative overflow-hidden rounded-2xl border px-5 py-5 ${dark ? 'border-violet-500/25 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-slate-900/0' : 'border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-white'}`}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10" />
              <div className="pointer-events-none absolute -right-2 top-8 h-16 w-16 rounded-full bg-purple-500/10" />
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg ${dark ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30' : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-200'}`}>
                  <ImageIcon size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-bold text-sm ${txt1}`}>Quản Lý Nội Dung Hiển Thị</p>
                  <p className={`mt-0.5 text-xs ${txt3}`}>Tuỳ chỉnh banner khuyến mãi và hình ảnh đại diện các trang cửa hàng</p>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${dark ? 'border-violet-500/30 bg-violet-500/15 text-violet-300' : 'border-violet-300 bg-violet-100 text-violet-700'}`}>
                  Đang hoạt động
                </span>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">

              <div className={`rounded-2xl border ${dark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className={`flex items-center gap-3 border-b px-5 py-3.5 rounded-t-2xl ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/80'}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${dark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
                    <ImageIcon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold uppercase tracking-[0.18em] ${txt3}`}>Banner Khuyến Mãi</h4>
                    <p className={`text-[10px] mt-0.5 ${txt4}`}>Slider trang chủ cửa hàng</p>
                  </div>
                  <span className={`h-2 w-2 rounded-full bg-sky-400 animate-pulse shrink-0`} />
                </div>
                <div className="p-4">
                  <BannerSettings />
                </div>
              </div>

              <div className={`rounded-2xl border ${dark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className={`flex items-center gap-3 border-b px-5 py-3.5 rounded-t-2xl ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/80'}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${dark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                    <FolderTree size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold uppercase tracking-[0.18em] ${txt3}`}>Hình Ảnh Trang</h4>
                    <p className={`text-[10px] mt-0.5 ${txt4}`}>Liên hệ, Giới thiệu & các trang phụ</p>
                  </div>
                  <span className={`h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0`} />
                </div>
                <div className="p-4">
                  <PageImageSettings />
                </div>
              </div>

            </div>
          </div>
        </AdminPanel>
      </div>

    </div>
  );
}

function DashboardSkeleton({ dark }) {
  const pg = dark ? 'bg-slate-950' : 'bg-slate-50';
  const skEl = dark ? 'bg-white/10' : 'bg-slate-200';
  return (
    <div className={`animate-pulse px-4 sm:px-6 pb-12 space-y-8 ${pg} min-h-screen`}>
      <div className="flex flex-col gap-2 pt-2">
        <div className={`h-10 w-72 rounded-2xl ${skEl}`} />
        <div className={`h-4 w-48 rounded-2xl ${skEl}`} />
        <div className="flex gap-3 mt-2">
          {[...Array(4)].map((_, i) => <div key={i} className={`h-10 w-32 rounded-2xl ${skEl}`} />)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => <div key={i} className={`h-28 rounded-2xl ${dark ? 'bg-white/5' : 'bg-slate-200'}`} />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className={`h-[420px] rounded-2xl ${dark ? 'bg-white/5' : 'bg-slate-200'}`} />
        <div className={`h-[420px] rounded-2xl ${dark ? 'bg-white/5' : 'bg-slate-200'}`} />
      </div>
    </div>
  );
}

function DashboardError({ message, retry, dark }) {
  return (
    <div className={`flex min-h-[50vh] flex-col items-center justify-center p-6 text-center ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="flex size-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
        <XCircle size={32} />
      </div>
      <h3 className={`mt-4 text-lg font-bold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>Lỗi Nạp Dữ Liệu Thống Kê</h3>
      <p className={`mt-2 text-sm max-w-md ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
        {message || 'Máy chủ phản hồi không đúng định dạng hoặc đã xảy ra lỗi kết nối mạng.'}
      </p>
      <button
        type="button"
        onClick={retry}
        className="mt-6 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 active:scale-95"
      >
        Thử Lại Ngay
      </button>
    </div>
  );
}