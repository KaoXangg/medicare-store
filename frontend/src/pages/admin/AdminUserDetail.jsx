import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Crown, Users, Lock, Unlock, Trash2, Mail, MailCheck, MailX,
  Phone, PhoneCall, PhoneOff, Calendar, RefreshCw, Contact, KeyRound,
  BadgeCheck, ShieldAlert, PackageOpen, ChevronRight, ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { adminTheme } from '../../components/ui/adminTheme';
import toast from 'react-hot-toast';

function UserAvatar({ user, size = 84 }) {
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
        className="relative shrink-0 rounded-3xl ring-4 ring-white/80 dark:ring-slate-800 shadow-lg overflow-hidden"
        style={{ width: sz, height: sz }}
      >
        <img
          src={src}
          alt={user?.FullName}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
        {user?.IsActive && (
          <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-800 bg-emerald-500" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 rounded-3xl bg-gradient-to-br ${grad} ring-4 ring-white/80 dark:ring-slate-800 shadow-lg flex items-center justify-center font-black text-white`}
      style={{ width: sz, height: sz, fontSize: size * 0.36 }}
    >
      {char}
      {user?.IsActive && (
        <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-800 bg-emerald-500" />
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
        <Crown size={11} /> Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
      <Users size={11} /> User
    </span>
  );
}

function StatusDot({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
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

function InfoCard({ icon: Icon, title, children, dark, tone = 'slate' }) {
  const toneMap = {
    slate: dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500',
    indigo: dark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-100 text-indigo-600',
    emerald: dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-600',
  };
  return (
    <div className={`${adminTheme.glassCard} p-5`}>
      <div className="flex items-center gap-2.5 mb-4">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneMap[tone]}`}>
          <Icon size={15} />
        </span>
        <p className={`text-sm font-black ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</p>
      </div>
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, dark, mono, sub }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
        <span className={`text-right text-sm font-bold ${mono ? 'font-mono' : ''} ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
          {value}
        </span>
      </div>
      {sub}
    </div>
  );
}

function VerifyRow({ label, verified, requested, onApprove, onReject, loading, dark }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
        <p className={`mt-0.5 text-sm font-bold ${
          verified ? 'text-emerald-500' : requested ? 'text-amber-500' : dark ? 'text-slate-300' : 'text-slate-700'
        }`}>
          {verified ? 'Đã xác thực' : requested ? 'Đang chờ duyệt' : 'Chưa xác thực'}
        </p>
      </div>
      {requested && !verified && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => onApprove(true)}
            className="flex h-8 items-center gap-1 rounded-xl bg-emerald-100 px-3 text-xs font-bold text-emerald-600 transition hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-500/15 dark:text-emerald-400"
          >
            <BadgeCheck size={13} /> Duyệt
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onApprove(false)}
            className="flex h-8 items-center rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-white/8 dark:text-slate-400"
          >
            Từ chối
          </button>
        </div>
      )}
    </div>
  );
}

function OrderStatusBadge({ status }) {
  const map = {
    pending: ['Chờ xử lý', 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'],
    processing: ['Đang xử lý', 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'],
    shipping: ['Đang giao', 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400'],
    completed: ['Hoàn tất', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'],
    cancelled: ['Đã hủy', 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'],
  };
  const [label, cls] = map[status] || [status || 'Không rõ', 'bg-slate-100 text-slate-500 dark:bg-white/8 dark:text-slate-400'];
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>{label}</span>;
}

function PageSkeleton({ dark }) {
  const sk = dark ? 'bg-slate-800' : 'bg-slate-200';
  return (
    <div className="animate-pulse space-y-5">
      <div className={`h-40 rounded-3xl ${sk}`} />
      <div className="grid gap-5 md:grid-cols-2">
        <div className={`h-48 rounded-3xl ${sk}`} />
        <div className={`h-48 rounded-3xl ${sk}`} />
      </div>
      <div className={`h-56 rounded-3xl ${sk}`} />
    </div>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { dark } = useTheme();

  const [user, setUser] = useState(location.state?.user || null);
  const [loading, setLoading] = useState(!location.state?.user);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const load = () => {
    setLoading(!location.state?.user);
    api.get('/admin/users?limit=500')
      .then((r) => {
        const found = (r.data || []).find((item) => String(item.UserId) === String(id));
        if (found) {
          setUser(found);
          setNotFound(false);
        } else if (!location.state?.user) {
          setNotFound(true);
        }
      })
      .catch(() => { if (!location.state?.user) setNotFound(true); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    setOrdersLoading(true);
    api.get(`/orders?userId=${id}&limit=5`)
      .then((r) => setOrders(r.data || []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [id]);

  const isSelf = currentUser?.UserId === user?.UserId;

  const lastChangedList = (() => {
    if (!user?.LastChangedFields) return [];
    try {
      const parsed = JSON.parse(user.LastChangedFields);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const updateUser = async (data) => {
    setUpdating(true);
    try {
      const res = await api.patch(`/admin/users/${id}`, data);
      toast.success('Cập nhật thành công');
      setUser((prev) => ({
        ...prev,
        ...data,
        ...(res?.data || {}),
        UpdatedAt: res?.data?.UpdatedAt || new Date().toISOString(),
      }));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleVerify = async (approved) => {
    setVerifyLoading(true);
    try {
      await api.patch(`/admin/users/${id}/verify`, { approved });
      toast.success(approved ? 'Đã xác thực email' : 'Đã từ chối xác thực');
      setUser((prev) => ({
        ...prev,
        IsVerified: approved,
        VerifyRequested: false,
        UpdatedAt: new Date().toISOString(),
      }));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyPhone = async (approved) => {
    setPhoneVerifyLoading(true);
    try {
      await api.patch(`/admin/users/${id}/verify-phone`, { approved });
      toast.success(approved ? 'Đã xác thực số điện thoại' : 'Đã từ chối xác thực');
      setUser((prev) => ({
        ...prev,
        PhoneVerified: approved,
        PhoneVerifyRequested: false,
        UpdatedAt: new Date().toISOString(),
      }));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPhoneVerifyLoading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Đã xóa người dùng');
      navigate('/admin/users');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const formatDateTime = (d) => {
    if (!d) return 'Không rõ';
    return new Date(d).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatMoney = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition ${
            dark ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            <Link to="/admin/users" className="hover:underline">Người dùng</Link>
            <ChevronRight size={12} />
            <span>Chi tiết</span>
          </div>
          <h1 className={`text-xl font-black ${dark ? 'text-slate-100' : 'text-slate-900'}`}>Hồ sơ người dùng</h1>
        </div>
      </div>

      {loading ? (
        <PageSkeleton dark={dark} />
      ) : notFound || !user ? (
        <div className={`flex flex-col items-center justify-center rounded-3xl border py-20 text-center ${
          dark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
        }`}>
          <ShieldAlert size={32} className={dark ? 'text-slate-600' : 'text-slate-300'} />
          <p className={`mt-3 font-bold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>Không tìm thấy người dùng</p>
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="mt-4 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Quay lại danh sách
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className={`relative overflow-hidden ${adminTheme.glassCard} p-6 sm:p-8`}>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-violet-500/[0.06]" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
                <UserAvatar user={user} size={84} />
                <div>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h2 className={`text-2xl font-black ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{user.FullName}</h2>
                    {isSelf && (
                      <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-400">Bạn</span>
                    )}
                  </div>
                  <p className={`mt-1 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{user.Email}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <RoleBadge role={user.Role} />
                    <StatusDot active={user.IsActive} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                <select
                  value={user.Role}
                  disabled={isSelf || updating}
                  onChange={(e) => updateUser({ role: e.target.value })}
                  className={`h-10 rounded-2xl border px-3 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-50 ${
                    dark ? 'border-slate-700 bg-slate-950/80 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  disabled={isSelf || updating}
                  onClick={() => updateUser({ isActive: !user.IsActive })}
                  className={`flex h-10 items-center gap-1.5 rounded-2xl px-4 text-xs font-bold transition disabled:opacity-50 ${
                    user.IsActive
                      ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-400'
                      : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400'
                  }`}
                >
                  {user.IsActive ? <Lock size={14} /> : <Unlock size={14} />}
                  {user.IsActive ? 'Khóa' : 'Mở khóa'}
                </button>
                <button
                  type="button"
                  disabled={isSelf}
                  onClick={() => setDeleteOpen(true)}
                  className="flex h-10 items-center gap-1.5 rounded-2xl bg-rose-100 px-4 text-xs font-bold text-rose-600 transition hover:bg-rose-200 disabled:opacity-50 dark:bg-rose-500/15 dark:text-rose-400"
                >
                  <Trash2 size={14} /> Xóa
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <InfoCard icon={Contact} title="Thông tin liên hệ" dark={dark} tone="indigo">
              <InfoRow label="Email" value={user.Email || 'Chưa cập nhật'} dark={dark} />
              <InfoRow label="Số điện thoại" value={user.Phone || 'Chưa cập nhật'} dark={dark} />
              <InfoRow
                label="Ngày sinh"
                value={user.DateOfBirth ? new Date(user.DateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                dark={dark}
              />
              {user.Address && <InfoRow label="Địa chỉ" value={user.Address} dark={dark} />}
              <InfoRow label="Mã người dùng" value={`#${user.UserId}`} dark={dark} mono />
            </InfoCard>

            <InfoCard icon={Calendar} title="Thông tin tài khoản" dark={dark} tone="slate">
              <InfoRow label="Ngày đăng ký" value={formatDateTime(user.CreatedAt)} dark={dark} />
              <InfoRow
                label="Cập nhật lần cuối"
                value={formatDateTime(user.UpdatedAt)}
                dark={dark}
                sub={
                  lastChangedList.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
                      {lastChangedList.map((f) => (
                        <span
                          key={f}
                          className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
                        >
                          Đã sửa: {f}
                        </span>
                      ))}
                    </div>
                  )
                }
              />
              <InfoRow label="Vai trò" value={user.Role === 'admin' ? 'Quản trị viên' : 'Thành viên'} dark={dark} />
              <InfoRow label="Mật khẩu" value="Đã mã hoá — không thể xem" dark={dark} />
            </InfoCard>
          </div>

          <InfoCard icon={ShieldCheck} title="Bảo mật & xác thực" dark={dark} tone="emerald">
            <VerifyRow
              label="Email"
              verified={user.IsVerified}
              requested={user.VerifyRequested}
              onApprove={handleVerify}
              loading={verifyLoading}
              dark={dark}
            />
            <div className={`h-px ${dark ? 'bg-slate-800' : 'bg-slate-100'}`} />
            <VerifyRow
              label="Số điện thoại"
              verified={user.PhoneVerified}
              requested={user.PhoneVerifyRequested}
              onApprove={handleVerifyPhone}
              loading={phoneVerifyLoading}
              dark={dark}
            />
          </InfoCard>

          <div className={`${adminTheme.glassCard} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  <PackageOpen size={15} />
                </span>
                <p className={`text-sm font-black ${dark ? 'text-slate-100' : 'text-slate-900'}`}>Đơn hàng gần đây</p>
              </div>
              <Link
                to={`/admin/orders?userId=${id}`}
                className="text-xs font-bold text-indigo-500 hover:underline"
              >
                Xem tất cả
              </Link>
            </div>

            {ordersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-14 rounded-2xl animate-pulse ${dark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                ))}
              </div>
            ) : orders.length ? (
              <div className="space-y-2">
                {orders.map((o) => (
                  <Link
                    key={o.OrderId}
                    to={`/admin/orders/${o.OrderId}`}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                      dark ? 'border-slate-800 hover:bg-slate-800/60' : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-bold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>#{o.OrderId}</p>
                      <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{formatDateTime(o.CreatedAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {formatMoney(o.TotalAmount)}
                      </span>
                      <OrderStatusBadge status={o.Status} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={`rounded-2xl border border-dashed py-10 text-center text-sm font-semibold ${
                dark ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'
              }`}>
                Chưa có đơn hàng nào
              </div>
            )}
          </div>
        </motion.div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Xác nhận xóa người dùng"
        message="Hành động này sẽ xóa vĩnh viễn tài khoản. Không thể hoàn tác."
        confirmLabel="Xóa người dùng"
      >
        {user && (
          <div className="flex items-center gap-3 mt-2">
            <UserAvatar user={user} size={44} />
            <div>
              <p className={`font-bold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{user.FullName}</p>
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{user.Email}</p>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}