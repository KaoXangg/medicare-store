import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Users, UserCheck, UserX, Lock, Unlock, Crown, ShieldAlert,
  BadgeCheck, CheckCircle2, XCircle, ShieldCheck, Bell, Phone,
  Search, RefreshCw, Mail, MailCheck, MailX, PhoneCall, PhoneOff,
  Eye,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminPanel from '../../components/admin/AdminPanel';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminMobilePagination from '../../components/admin/AdminMobilePagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { adminTheme } from '../../components/ui/adminTheme';
import toast from 'react-hot-toast';

/* ─────────────────────────── AVATAR ─────────────────────────── */
function UserAvatar({ user, size = 56 }) {
  const [imgError, setImgError] = useState(false);
  const src = user?.Avatar || user?.AvatarUrl || user?.ProfileImage || user?.PhotoURL;
  const char = user?.FullName?.charAt(0)?.toUpperCase() || 'U';

  const gradients = [
    'from-violet-500 to-indigo-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-fuchsia-500 to-purple-600',
  ];
  const grad = gradients[(user?.UserId || 0) % gradients.length];
  const sz = `${size}px`;

  if (src && !imgError) {
    return (
      <div
        className="relative shrink-0 rounded-2xl ring-2 ring-white/80 dark:ring-slate-800 shadow-md overflow-hidden"
        style={{ width: sz, height: sz }}
      >
        <img
          src={src}
          alt={user?.FullName}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
        {user?.IsActive && (
          <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 bg-emerald-500" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 rounded-2xl bg-gradient-to-br ${grad} ring-2 ring-white/80 dark:ring-slate-800 shadow-md flex items-center justify-center font-black text-white`}
      style={{ width: sz, height: sz, fontSize: size * 0.38 }}
    >
      {char}
      {user?.IsActive && (
        <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 bg-emerald-500" />
      )}
    </div>
  );
}

/* ─────────────────────────── BADGES ─────────────────────────── */
function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
        <Crown size={10} /> Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
      <Users size={10} /> User
    </span>
  );
}

function StatusDot({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
      active
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
    }`}>
      <span className="relative flex h-1.5 w-1.5">
        {active && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      </span>
      {active ? 'Hoạt động' : 'Đã khóa'}
    </span>
  );
}

function VerifyIcon({ verified, requested, type = 'email' }) {
  const Icon = type === 'email'
    ? (verified ? MailCheck : requested ? Mail : MailX)
    : (verified ? PhoneCall : requested ? Phone : PhoneOff);

  if (verified) return <span title="Đã xác thực" className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"><Icon size={14} /></span>;
  if (requested) return <span title="Chờ xác thực" className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"><Icon size={14} /></span>;
  return <span title="Chưa xác thực" className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"><Icon size={14} /></span>;
}

/* ─────────────────────────── SKELETON ─────────────────────────── */
function CardSkeleton({ dark }) {
  return (
    <div className={`animate-pulse rounded-2xl border p-5 ${dark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-4">
        <div className={`h-14 w-14 shrink-0 rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
        <div className="flex-1 space-y-2 pt-1">
          <div className={`h-4 w-3/4 rounded-lg ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
          <div className={`h-3 w-1/2 rounded-lg ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
          <div className="mt-3 flex gap-2">
            <div className={`h-5 w-16 rounded-full ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
            <div className={`h-5 w-16 rounded-full ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className={`h-9 flex-1 rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
        <div className={`h-9 w-9 rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
        <div className={`h-9 w-9 rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
      </div>
    </div>
  );
}

/* ─────────────────────────── VERIFY CARD ─────────────────────────── */
function VerifyCard({ user, onApprove, onReject, loading, type = 'email' }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/60 p-5 shadow-sm dark:border-amber-500/20 dark:from-amber-500/5 dark:to-orange-500/5"
    >
      <div className="absolute right-4 top-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
          </span>
          Chờ duyệt
        </span>
      </div>

      <div className="flex items-center gap-4 pr-20">
        <UserAvatar user={user} size={52} />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 dark:text-white truncate">{user.FullName}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {type === 'email' ? user.Email : user.Phone}
          </p>
          <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            {new Date(user.CreatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          disabled={loading}
          onClick={() => onApprove(user.UserId)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60 hover:opacity-90 transition"
        >
          <CheckCircle2 size={14} /> Xác thực
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          disabled={loading}
          onClick={() => onReject(user.UserId)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60 transition dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        >
          <XCircle size={14} /> Từ chối
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── USER CARD ─────────────────────────── */
function UserCard({ u, isSelf, updatingId, verifyLoading, phoneVerifyLoading, onUpdate, onVerify, onVerifyPhone, onDelete, onView, dark }) {
  const card = dark
    ? 'border-slate-800 bg-slate-900/60 hover:border-sky-500/30'
    : 'border-slate-200 bg-white hover:border-indigo-200/60';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-xl ${card}`}
    >
      {/* Gradient glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-indigo-500/4 to-violet-500/4" />

      <div className="relative">
        {/* Top row: avatar + info */}
        <button
          type="button"
          onClick={() => onView(u)}
          className="flex w-full items-start gap-4 text-left"
        >
          <UserAvatar user={u} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className={`font-bold truncate max-w-[140px] ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{u.FullName}</p>
              {isSelf && (
                <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-400">Bạn</span>
              )}
            </div>
            <p className={`truncate text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{u.Email}</p>
            {u.Phone && <p className={`text-xs mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{u.Phone}</p>}
          </div>
        </button>

        {/* Badges row */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <RoleBadge role={u.Role} />
          <StatusDot active={u.IsActive} />
          <VerifyIcon verified={u.IsVerified} requested={u.VerifyRequested} type="email" />
          <VerifyIcon verified={u.PhoneVerified} requested={u.PhoneVerifyRequested} type="phone" />
        </div>

        {/* Date */}
        <p className={`mt-2.5 text-[11px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Tham gia {new Date(u.CreatedAt).toLocaleDateString('vi-VN')}
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.93 }}
            type="button"
            onClick={() => onView(u)}
            title="Xem chi tiết"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition ${
              dark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Eye size={15} />
          </motion.button>

          <select
            value={u.Role}
            disabled={isSelf || updatingId === u.UserId}
            onChange={(e) => onUpdate(u.UserId, { role: e.target.value })}
            className={`h-9 flex-1 min-w-0 rounded-2xl border px-3 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-50 ${
              dark
                ? 'border-slate-700 bg-slate-950/80 text-slate-300 hover:border-slate-600'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300'
            }`}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {u.VerifyRequested && !u.IsVerified && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              type="button"
              disabled={verifyLoading}
              onClick={() => onVerify(u.UserId, true)}
              title="Xác thực Email"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 hover:bg-emerald-200 disabled:opacity-50 transition dark:bg-emerald-500/15 dark:text-emerald-400"
            >
              <BadgeCheck size={15} />
            </motion.button>
          )}

          {u.PhoneVerifyRequested && !u.PhoneVerified && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              type="button"
              disabled={phoneVerifyLoading}
              onClick={() => onVerifyPhone(u.UserId, true)}
              title="Xác thực SĐT"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 hover:bg-sky-200 disabled:opacity-50 transition dark:bg-sky-500/15 dark:text-sky-400"
            >
              <Phone size={15} />
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.93 }}
            type="button"
            disabled={isSelf || updatingId === u.UserId}
            onClick={() => onUpdate(u.UserId, { isActive: !u.IsActive })}
            title={u.IsActive ? 'Khóa tài khoản' : 'Mở khóa'}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition disabled:opacity-50 ${
              u.IsActive
                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400'
            }`}
          >
            {u.IsActive ? <Lock size={15} /> : <Unlock size={15} />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.93 }}
            type="button"
            disabled={isSelf}
            onClick={() => onDelete(u)}
            title="Xóa người dùng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 hover:bg-rose-200 disabled:opacity-50 transition dark:bg-rose-500/15 dark:text-rose-400"
          >
            <Trash2 size={15} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── EMPTY STATE ─────────────────────────── */
function EmptyState({ icon: Icon, title, desc, onRefresh, dark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center gap-5 rounded-2xl border border-dashed py-20 text-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}
    >
      <div className={`grid h-20 w-20 place-items-center rounded-2xl ${dark ? 'bg-white/5' : 'bg-gradient-to-br from-slate-100 to-slate-200'}`}>
        <Icon size={36} className={dark ? 'text-slate-500' : 'text-slate-400'} />
      </div>
      <div>
        <p className={`font-bold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</p>
        <p className={`mt-1 text-sm ${dark ? 'text-slate-400' : 'text-slate-400'}`}>{desc}</p>
      </div>
      {onRefresh && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90 transition"
        >
          <RefreshCw size={15} /> Tải lại
        </motion.button>
      )}
    </motion.div>
  );
}

/* ─────────────────────────── MAIN ─────────────────────────── */
export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { dark } = useTheme();

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({ total: 0, active: 0, locked: 0, admins: 0 });
  const [pendingVerify, setPendingVerify] = useState([]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [pendingVerifyPhone, setPendingVerifyPhone] = useState([]);
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef(null);

  /* ── data loaders ── */
  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 8 });
    if (searchQuery.trim()) q.set('search', searchQuery.trim());
    if (filterRole !== 'all') q.set('role', filterRole);
    api.get(`/admin/users?${q}`)
      .then((r) => {
        setUsers(r.data || []);
        setPagination(r.pagination || {});
      })
      .finally(() => setLoading(false));
  };

  const loadStats = () => {
    api.get('/admin/users?limit=500')
      .then((r) => {
        const all = r.data || [];
        setStats({
          total:  r.pagination?.total ?? all.length,
          active: all.filter((u) => u.IsActive).length,
          locked: all.filter((u) => !u.IsActive).length,
          admins: all.filter((u) => u.Role === 'admin').length,
        });
      })
      .catch(() => {});
  };

  const loadPendingVerify = () => {
    api.get('/admin/users/pending-verify')
      .then((r) => setPendingVerify(r.data || []))
      .catch(() => {});
  };

  const loadPendingVerifyPhone = () => {
    api.get('/admin/users/pending-verify-phone')
      .then((r) => setPendingVerifyPhone(r.data || []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [page, searchQuery, filterRole]);
  useEffect(() => { loadStats(); loadPendingVerify(); loadPendingVerifyPhone(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(search.trim());
    setPage(1);
  };

  const updateUser = async (id, data) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/users/${id}`, data);
      toast.success('Cập nhật thành công');
      load();
      loadStats();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVerify = async (id, approved) => {
    setVerifyLoading(true);
    try {
      await api.patch(`/admin/users/${id}/verify`, { approved });
      toast.success(approved ? 'Đã xác thực tài khoản' : 'Đã từ chối xác thực');
      loadPendingVerify();
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyPhone = async (id, approved) => {
    setPhoneVerifyLoading(true);
    try {
      await api.patch(`/admin/users/${id}/verify-phone`, { approved });
      toast.success(approved ? 'Đã xác thực số điện thoại' : 'Đã từ chối xác thực số điện thoại');
      loadPendingVerifyPhone();
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPhoneVerifyLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.UserId}`);
      toast.success('Đã xóa người dùng');
      setDeleteTarget(null);
      load();
      loadStats();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const isSelf = (u) => currentUser?.UserId === u.UserId;

  /* ── theme shorthand (mirror Dashboard) ── */
  const pg       = dark ? 'bg-slate-950'   : 'bg-slate-50';
  const card     = dark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200';
  const txt1     = dark ? 'text-slate-100' : 'text-slate-900';
  const txt3     = dark ? 'text-slate-400' : 'text-slate-500';
  const txt4     = dark ? 'text-slate-500' : 'text-slate-400';
  const inputCls = dark
    ? 'border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-600 focus:border-sky-500'
    : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500';
  const filterBtn = (active) => active
    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
    : dark
      ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'
      : 'bg-white text-slate-600 border border-slate-300 hover:border-slate-400';

  /* ── tabs ── */
  const tabs = [
    { key: 'users',        label: 'Danh sách',     icon: Users,      badge: null },
    { key: 'verify',       label: 'Xác thực Email', icon: ShieldCheck, badge: pendingVerify.length || null },
    { key: 'verify-phone', label: 'Xác thực SĐT',  icon: Phone,       badge: pendingVerifyPhone.length || null },
  ];

  /* ── sparkline placeholders ── */
  const sparklines = {
    total:  [80, 85, 90, 92, 95, 98, 100],
    active: [60, 65, 70, 72, 75, 78, 80],
    locked: [5, 4, 6, 5, 3, 4, 3],
    admins: [2, 2, 3, 3, 3, 4, 4],
  };

  /* ── render ── */
  return (
    <div className={`${pg} min-h-screen px-4 sm:px-6 pb-12 space-y-8 transition-colors duration-300`}>

      {/* ══ HEADER ══ */}
      <AdminPageHeader
        hideTitle
        subtitle="Quản lý tài khoản, phân quyền và xác thực người dùng hệ thống."
        badge={`${stats.total} người dùng`}
      />

      {/* ══ STAT CARDS — dùng AdminStatCard giống Dashboard ══ */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <AdminStatCard
          title="Tổng Người Dùng"
          value={stats.total}
          icon={Users}
          color="sky"
          growth={5.2}
          compareLabel="tháng trước"
          sparklineData={sparklines.total}
          index={0}
          to="/admin/users"
        />
        <AdminStatCard
          title="Đang Hoạt Động"
          value={stats.active}
          icon={UserCheck}
          color="emerald"
          growth={3.8}
          compareLabel="tuần trước"
          sparklineData={sparklines.active}
          index={1}
          to="/admin/users"
        />
        <AdminStatCard
          title="Đã Bị Khóa"
          value={stats.locked}
          icon={UserX}
          color="orange"
          growth={-12.4}
          compareLabel="tuần trước"
          sparklineData={sparklines.locked}
          index={2}
          to="/admin/users"
        />
        <AdminStatCard
          title="Quản Trị Viên"
          value={stats.admins}
          icon={Crown}
          color="violet"
          growth={0}
          compareLabel="tháng trước"
          sparklineData={sparklines.admins}
          index={3}
          to="/admin/users"
        />
      </div>

      {/* ══ SEARCH BAR (below dashboards) ══ */}
      <div className={`${adminTheme.glassCard} p-4 sm:p-5`}>
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Search input */}
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
            <div className={`flex flex-1 items-center gap-3 rounded-xl border px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-sky-400/30 ${
              dark
                ? 'border-slate-700 bg-slate-950/70 focus-within:border-sky-500/60'
                : 'border-slate-200 bg-slate-50 focus-within:border-sky-400'
            }`}>
              <Search size={16} className={`shrink-0 transition-colors ${search ? (dark ? 'text-sky-400' : 'text-sky-500') : txt4}`} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, email hoặc số điện thoại..."
                className={`flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal ${dark ? 'text-slate-100 placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'}`}
              />
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  type="button"
                  onClick={() => { setSearch(''); setSearchQuery(''); setPage(1); }}
                  className={`shrink-0 rounded-lg p-0.5 transition ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <XCircle size={15} />
                </motion.button>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="h-10 shrink-0 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-5 text-sm font-bold text-white shadow-md shadow-sky-500/25 hover:opacity-90 transition"
            >
              Tìm
            </motion.button>
          </form>

          {/* Divider */}
          <div className={`hidden sm:block h-8 w-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />

          {/* Role filter pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`mr-1 text-xs font-semibold hidden sm:block ${txt4}`}>Lọc:</span>
            {[
              { key: 'all',   label: 'Tất cả', icon: Users },
              { key: 'admin', label: 'Admin',   icon: Crown },
              { key: 'user',  label: 'User',    icon: UserCheck },
            ].map((f) => {
              const active = filterRole === f.key;
              return (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  key={f.key}
                  type="button"
                  onClick={() => { setFilterRole(f.key); setPage(1); }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md shadow-sky-500/25'
                      : dark
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border border-slate-200'
                  }`}
                >
                  <f.icon size={12} />
                  {f.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Active search indicator */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 flex items-center gap-2 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}
          >
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium ${dark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
              <Search size={11} />
              Kết quả cho: <strong>"{searchQuery}"</strong>
            </span>
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchQuery(''); setPage(1); }}
              className={`underline underline-offset-2 hover:no-underline transition ${dark ? 'hover:text-slate-200' : 'hover:text-slate-700'}`}
            >
              Xoá tìm kiếm
            </button>
          </motion.div>
        )}
      </div>

      {/* ══ TABS ══ */}
      <div className={`relative flex gap-1 rounded-2xl p-1 ${dark ? 'bg-slate-900' : 'bg-slate-100/80'}`}>
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            whileTap={{ scale: 0.98 }}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all ${
              activeTab === tab.key
                ? dark
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
                : dark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={15} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.key === 'users' ? 'DS' : tab.key === 'verify' ? 'Email' : 'SĐT'}</span>
            {tab.badge ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white">
                {tab.badge}
              </span>
            ) : null}
          </motion.button>
        ))}
      </div>

      
      <AnimatePresence mode="wait">
        {activeTab === 'verify' && (
          <motion.div key="verify" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <AdminPanel title="Xác Thực Email" subtitle="Duyệt hoặc từ chối yêu cầu xác thực tài khoản email">
              {pendingVerify.length === 0 ? (
                <EmptyState dark={dark} icon={ShieldCheck} title="Không có yêu cầu nào" desc="Tất cả yêu cầu xác thực email đã được xử lý" />
              ) : (
                <div className="space-y-4">
                  <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${dark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200/60 bg-amber-50'}`}>
                    <Bell size={15} className={`shrink-0 ${dark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <p className={`text-sm font-medium ${dark ? 'text-amber-300' : 'text-amber-800'}`}>
                      Có <strong>{pendingVerify.length}</strong> tài khoản đang chờ xác thực email
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence>
                      {pendingVerify.map((u) => (
                        <VerifyCard
                          key={u.UserId}
                          user={u}
                          type="email"
                          loading={verifyLoading}
                          onApprove={(id) => handleVerify(id, true)}
                          onReject={(id) => handleVerify(id, false)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </AdminPanel>
          </motion.div>
        )}

        {/* PHONE VERIFY TAB */}
        {activeTab === 'verify-phone' && (
          <motion.div key="verify-phone" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <AdminPanel title="Xác Thực Số Điện Thoại" subtitle="Duyệt hoặc từ chối yêu cầu xác thực số điện thoại">
              {pendingVerifyPhone.length === 0 ? (
                <EmptyState dark={dark} icon={ShieldCheck} title="Không có yêu cầu nào" desc="Tất cả yêu cầu xác thực số điện thoại đã được xử lý" />
              ) : (
                <div className="space-y-4">
                  <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${dark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200/60 bg-amber-50'}`}>
                    <Bell size={15} className={`shrink-0 ${dark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <p className={`text-sm font-medium ${dark ? 'text-amber-300' : 'text-amber-800'}`}>
                      Có <strong>{pendingVerifyPhone.length}</strong> số điện thoại đang chờ xác thực
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence>
                      {pendingVerifyPhone.map((u) => (
                        <VerifyCard
                          key={u.UserId}
                          user={u}
                          type="phone"
                          loading={phoneVerifyLoading}
                          onApprove={(id) => handleVerifyPhone(id, true)}
                          onReject={(id) => handleVerifyPhone(id, false)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </AdminPanel>
          </motion.div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <AdminPanel
              title="Danh Sách Người Dùng"
              subtitle="Quản lý tài khoản, phân quyền và trạng thái hoạt động"
              action={
                <span className={`rounded-xl border px-3 py-1.5 text-xs ${dark ? 'border-slate-700 bg-slate-900 text-slate-400' : 'border-slate-300 bg-slate-100 text-slate-500'}`}>
                  {pagination.total || 0} người dùng
                </span>
              }
            >
              {/* Grid / Skeleton / Empty */}
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} dark={dark} />)}
                </div>
              ) : users.length ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    <AnimatePresence>
                      {users.map((u, i) => (
                        <motion.div
                          key={u.UserId}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <UserCard
                            u={u}
                            dark={dark}
                            isSelf={isSelf(u)}
                            updatingId={updatingId}
                            verifyLoading={verifyLoading}
                            phoneVerifyLoading={phoneVerifyLoading}
                            onUpdate={updateUser}
                            onVerify={handleVerify}
                            onVerifyPhone={handleVerifyPhone}
                            onDelete={setDeleteTarget}
                            onView={(u) => navigate(`/admin/users/${u.UserId}`, { state: { user: u } })}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  <div className="mt-6">
                    <div className="md:hidden">
                      <AdminMobilePagination
                        page={page}
                        totalPages={pagination.totalPages || 1}
                        onPageChange={setPage}
                      />
                    </div>
                    <div className="hidden md:block">
                      <AdminPagination
                        page={page}
                        totalPages={pagination.totalPages || 1}
                        total={pagination.total}
                        onPageChange={setPage}
                        className="border-0 bg-transparent px-0"
                        alwaysShow
                      />
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  dark={dark}
                  icon={ShieldAlert}
                  title="Không tìm thấy người dùng"
                  desc="Thử đổi bộ lọc hoặc từ khóa tìm kiếm"
                  onRefresh={() => { setSearch(''); setSearchQuery(''); setFilterRole('all'); setPage(1); }}
                />
              )}
            </AdminPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DELETE ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Xác nhận xóa người dùng"
        message="Hành động này sẽ xóa vĩnh viễn tài khoản. Không thể hoàn tác."
        confirmLabel="Xóa người dùng"
      >
        {deleteTarget && (
          <div className="flex items-center gap-3 mt-2">
            <UserAvatar user={deleteTarget} size={44} />
            <div>
              <p className={`font-bold ${txt1}`}>{deleteTarget.FullName}</p>
              <p className={`text-sm ${txt3}`}>{deleteTarget.Email}</p>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}