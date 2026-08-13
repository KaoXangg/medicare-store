import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, MapPin, Lock, User, Camera, Mail, Phone,
  Package, ShoppingBag, Heart, CheckCircle2, Eye, EyeOff,
  Save, ArrowRight, Calendar, ShieldCheck, BadgeCheck,
  Trash2, Clock, Crown, KeyRound, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react';
import api, { getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile',       label: 'Thông tin',   icon: User        },
  { id: 'security',      label: 'Bảo mật',     icon: ShieldCheck },
  { id: 'addresses',     label: 'Địa chỉ',     icon: MapPin      },
  { id: 'notifications', label: 'Thông báo',   icon: Bell        },
];

const LS_KEYS = ['user', 'medicare_user', 'auth_user'];

function syncLocalStorage(patch) {
  LS_KEYS.forEach((key) => {
    const saved = localStorage.getItem(key);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      localStorage.setItem(key, JSON.stringify({ ...parsed, ...patch }));
    } catch {}
  });
}

function parseNotifyPrefs(u) {
  const fallback = { orders: true, sms: true, promos: true, newsletter: false };
  if (!u?.NotificationPrefs) return fallback;
  try { return { ...fallback, ...JSON.parse(u.NotificationPrefs) }; } catch { return fallback; }
}

/* ---------------------------------- Field ---------------------------------- */

function Field({ label, icon: Icon, disabled, hint, error, type = 'text', right, className = '', ...props }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-400 dark:text-slate-300 pointer-events-none" />}
        <input
          type={type}
          disabled={disabled}
          {...props}
          className={`w-full h-11 ${Icon ? 'pl-11' : 'pl-4'} ${right ? 'pr-12' : 'pr-4'} rounded-2xl border text-sm font-medium transition-all duration-200
            ${disabled
              ? 'bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-300 cursor-not-allowed border-slate-200 dark:border-slate-600'
              : `bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                 hover:border-slate-300 dark:hover:border-slate-500
                 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
                 ${error ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-600'}`}`}
        />
        {right}
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

/* ---------------------------------- DateOfBirthField ---------------------------------- */

function DateOfBirthField({ label, value, onChange, error, icon: Icon }) {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const currentYear = today.getFullYear();
  const years = [];
  for (let y = currentYear; y >= currentYear - 100; y--) years.push(y);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [viewYear, setViewYear] = useState(() => (value ? new Date(`${value}T00:00:00`).getFullYear() : currentYear - 20));
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(`${value}T00:00:00`).getMonth() : 0));
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const openPicker = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 8, left: rect.left });
    if (value) {
      const d = new Date(`${value}T00:00:00`);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      const insideBtn = btnRef.current && btnRef.current.contains(e.target);
      const insidePop = popRef.current && popRef.current.contains(e.target);
      if (!insideBtn && !insidePop) setOpen(false);
    };
    const onScrollOrResize = () => setOpen(false);
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const dayStr = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const shiftMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const selectDay = (d) => {
    onChange({ target: { value: dayStr(d) } });
    setOpen(false);
  };

  const displayLabel = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-400 dark:text-slate-300 pointer-events-none" />}
        <button
          ref={btnRef}
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          className={`w-full h-11 ${Icon ? 'pl-11' : 'pl-4'} pr-4 rounded-2xl border text-sm font-medium text-left transition-all duration-200
            bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
            hover:border-slate-300 dark:hover:border-slate-500
            focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
            ${error ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-600'}`}
        >
          {displayLabel || <span className="text-slate-400">Chưa cập nhật</span>}
        </button>
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

      {open && pos && createPortal(
        <motion.div
          ref={popRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          style={{ position: 'fixed', zIndex: 200, top: pos.top, left: pos.left }}
          className="w-72 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
            >
              <ChevronLeft size={14} />
            </button>
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className="h-7 flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>Tháng {i + 1}</option>)}
            </select>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="h-7 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((w) => (
              <span key={w} className="text-center text-[10px] font-bold text-slate-400">{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <span key={i} />;
              const ds = dayStr(d);
              const isFuture = ds > todayIso;
              const isSelected = ds === value;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isFuture}
                  onClick={() => selectDay(d)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                      : isFuture
                        ? 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}

/* ---------------------------------- Toggle ---------------------------------- */

function Toggle({ checked, onChange, label, desc }) {
  return (
    <label className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
      <div className="min-w-0 pr-4">
        <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{label}</p>
        {desc && <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <div className="relative shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-10 h-6 rounded-full bg-slate-200 dark:bg-slate-700 peer-checked:bg-blue-600 transition-colors" />
        <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </div>
    </label>
  );
}

/* ------------------------------ AvatarUploader ------------------------------ */

function AvatarUploader({ user, onUpload, onRemove }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(user?.Avatar ? getImageUrl(user.Avatar) : null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setPreview(user?.Avatar ? getImageUrl(user.Avatar) : null);
    setImgError(false);
  }, [user?.Avatar]);

  const initials = user?.FullName
    ? user.FullName.split(' ').filter(Boolean).map((n) => n[0]).slice(-2).join('').toUpperCase()
    : '??';

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target.result;
      setPreview(base64);
      setImgError(false);
      try {
        const fd = new FormData();
        fd.append('avatar', file);
        const res = await api.post('/auth/upload-avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const finalUrl = res.data.avatarUrl ?? res.data.avatar ?? base64;
        onUpload?.(finalUrl);
        toast.success('Đã cập nhật ảnh đại diện');
      } catch {
        try {
          await api.put('/auth/profile', { avatar: base64 });
          onUpload?.(base64);
          toast.success('Đã cập nhật ảnh đại diện');
        } catch (err) {
          toast.error(err?.message ?? 'Không thể lưu ảnh');
          setPreview(user?.Avatar ? getImageUrl(user.Avatar) : null);
        }
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  }, [user, onUpload]);

  const handleRemove = async () => {
    const prev = preview;
    try {
      setPreview(null);
      await api.put('/auth/profile', { avatar: null });
      onRemove?.();
      toast.success('Đã xoá ảnh đại diện thành công');
    } catch {
      toast.error('Không thể xoá ảnh trên hệ thống');
      setPreview(prev);
    }
  };

  return (
    <div className="relative">
      {/* Banner: gradient xanh dương đặc trưng MediCare, đồng bộ màu logo/theme */}
      <div className="h-40 sm:h-48 w-full bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <div className="px-5 sm:px-8 pt-3 flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="relative shrink-0 mx-auto sm:mx-0 -mt-14 sm:-mt-16">
          <div
            className={`relative h-28 w-28 sm:h-32 sm:w-32 rounded-3xl overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-xl cursor-pointer group transition-transform duration-200 ${dragOver ? 'scale-105' : 'hover:scale-[1.02]'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); }}
          >
            {preview && !imgError
              ? <img src={preview} alt="avatar" className="h-full w-full object-cover" onError={() => setImgError(true)} />
              : <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-sky-600 text-white text-3xl sm:text-4xl font-black">{initials}</div>
            }
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading
                ? <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <><Camera size={20} className="text-white mb-1" /><span className="text-white text-[11px] font-bold">Thay ảnh</span></>
              }
            </div>
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900 cursor-pointer transition-transform hover:scale-110"
          >
            <Camera size={14} className="text-blue-700 dark:text-blue-300" />
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => processFile(e.target.files[0])} />

        <div className="flex-1 min-w-0 text-center sm:text-left pb-1 sm:pt-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="font-black text-slate-900 dark:text-slate-100 text-xl sm:text-2xl tracking-tight truncate">{user?.FullName}</h2>
            {user?.Role === 'admin' && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                <BadgeCheck size={11} /> Admin
              </span>
            )}
            {user?.Role !== 'admin' && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                <Crown size={11} /> Thành viên
              </span>
            )}
            {user?.IsVerified && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 size={11} /> Đã xác thực
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">{user?.Email}</p>

          <div className="flex gap-2 mt-3 justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold
                bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <Camera size={13} /> Chọn ảnh mới
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold
                  bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 transition-colors"
              >
                <Trash2 size={13} /> Xóa ảnh
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- StatLink --------------------------------- */

function StatLink({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all group"
    >
      <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-700 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
        <Icon size={16} />
      </div>
      <span className="flex-1 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
      <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

/* ----------------------------------- Card ----------------------------------- */

function Card({ title, subtitle, icon: Icon, children, accent = 'teal' }) {
  const cfg = {
    teal:    { light: 'from-blue-50 to-sky-50',    dark: 'dark:from-slate-800 dark:to-slate-800/80', icon: 'from-blue-600 to-sky-500',    sub: 'text-blue-700 dark:text-blue-300'    },
    amber:   { light: 'from-amber-50 to-orange-50',    dark: 'dark:from-slate-800 dark:to-slate-800/80', icon: 'from-amber-500 to-orange-500',    sub: 'text-amber-600 dark:text-amber-300'  },
    emerald: { light: 'from-emerald-50 to-green-50',   dark: 'dark:from-slate-800 dark:to-slate-800/80', icon: 'from-emerald-500 to-green-500',   sub: 'text-emerald-600 dark:text-emerald-300' },
    violet:  { light: 'from-violet-50 to-purple-50',   dark: 'dark:from-slate-800 dark:to-slate-800/80', icon: 'from-violet-500 to-purple-500',   sub: 'text-violet-600 dark:text-violet-300' },
  }[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden"
    >
      <div className={`flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r ${cfg.light} ${cfg.dark}`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cfg.icon} shadow-sm`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{title}</h3>
          {subtitle && <p className={`text-xs font-medium ${cfg.sub}`}>{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </motion.div>
  );
}

/* ------------------------------- ProfileContent ------------------------------ */

function ProfileContent() {
  const { user, setUser } = useAuth();

  const parseDob = (u) => {
    const raw = u?.DateOfBirth ?? '';
    if (!raw) return '';
    return String(raw).slice(0, 10);
  };

  const [form, setForm] = useState({
    fullName: user?.FullName || '',
    phone:    user?.Phone    || '',
    dob:      parseDob(user),
    address:  user?.Address  || '',
  });
  const [pw, setPw]             = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPw, setShowPw]     = useState({ cur: false, new: false, con: false });
  const [tab, setTab]           = useState('profile');
  const [loading, setLoading]   = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const [notify, setNotify]             = useState(() => parseNotifyPrefs(user));
  const [notifySaving, setNotifySaving] = useState(false);
  const [notifyDirty, setNotifyDirty]   = useState(false);
  useEffect(() => { setNotify(parseNotifyPrefs(user)); setNotifyDirty(false); }, [user?.NotificationPrefs]);

  const [verifyRequested, setVerifyRequested] = useState(false);
  const [verifyLoading, setVerifyLoading]     = useState(false);
  const [phoneVerifyRequested, setPhoneVerifyRequested] = useState(false);
  const [phoneVerifyLoading, setPhoneVerifyLoading]     = useState(false);

  const [emailEditing, setEmailEditing] = useState(false);
  const [emailForm, setEmailForm]       = useState({ newEmail: '', password: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailErrors, setEmailErrors]   = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPhone = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm((f) => ({ ...f, phone: digitsOnly }));
  };
  const setPwField = (k) => (e) => setPw((p) => ({ ...p, [k]: e.target.value }));
  const toggleShow = (k) => () => setShowPw((s) => ({ ...s, [k]: !s[k] }));
  const setNotifyField = (k) => (e) => { setNotify((n) => ({ ...n, [k]: e.target.checked })); setNotifyDirty(true); };

  const handleRemoveAvatarState = () => {
    // AvatarUploader đã gọi api.put('/auth/profile', { avatar: null }) rồi,
    // ở đây chỉ cần đồng bộ lại state cục bộ, không gọi lại API lần nữa.
    const updated = { ...user, Avatar: null };
    setUser?.(updated);
    syncLocalStorage({ Avatar: null });
  };

  const handleUploadAvatarState = (url) => {
    const updated = { ...user, Avatar: url };
    setUser?.(updated);
    syncLocalStorage({ Avatar: url });
  };

  const saveProfile = async (e) => {
    e?.preventDefault();
    if (form.phone && form.phone.length !== 10) {
      toast.error('Số điện thoại phải đủ 10 số');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        fullName:    form.fullName    || null,
        phone:       form.phone       || null,
        address:     form.address     || null,
        dateOfBirth: form.dob         || null,
      };

      const res = await api.put('/auth/profile', payload);
      const updatedUser = res.data ?? res;
      const savedDob = updatedUser?.DateOfBirth ? String(updatedUser.DateOfBirth).slice(0, 10) : form.dob;

      setForm((f) => ({
        ...f,
        fullName: updatedUser?.FullName || f.fullName,
        phone:    updatedUser?.Phone || f.phone,
        address:  updatedUser?.Address || f.address,
        dob:      savedDob,
      }));

      setUser?.((prev) => ({ ...prev, ...updatedUser }));
      setPhoneVerifyRequested(!!updatedUser?.PhoneVerifyRequested);
      syncLocalStorage(updatedUser);

      toast.success('Đã cập nhật thông tin thành công');
    } catch (err) {
      toast.error(err?.message ?? 'Lỗi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.currentPassword) errs.currentPassword = 'Bắt buộc';
    if (pw.newPassword.length < 6) errs.newPassword = 'Tối thiểu 6 ký tự';
    if (pw.newPassword !== pw.confirm) errs.confirm = 'Mật khẩu không khớp';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Đổi mật khẩu thành công');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwErrors({});
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const changeEmail = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!emailForm.newEmail || !/^\S+@\S+\.\S+$/.test(emailForm.newEmail)) errs.newEmail = 'Email không hợp lệ';
    if (emailForm.newEmail && emailForm.newEmail === user?.Email) errs.newEmail = 'Đây là email hiện tại của bạn';
    if (!emailForm.password) errs.password = 'Bắt buộc nhập mật khẩu để xác nhận';
    if (Object.keys(errs).length) { setEmailErrors(errs); return; }
    setEmailLoading(true);
    try {
      const res = await api.put('/auth/change-email', { newEmail: emailForm.newEmail, password: emailForm.password });
      const updatedUser = res.data ?? res;
      setUser?.((prev) => ({ ...prev, ...updatedUser }));
      syncLocalStorage(updatedUser);
      setVerifyRequested(false);
      toast.success('Đã đổi email. Vui lòng xác thực lại tài khoản với email mới.');
      setEmailEditing(false);
      setEmailForm({ newEmail: '', password: '' });
      setEmailErrors({});
    } catch (err) {
      toast.error(err?.message ?? 'Không thể đổi email');
    } finally {
      setEmailLoading(false);
    }
  };

  const saveNotifications = async () => {
    setNotifySaving(true);
    try {
      const res = await api.put('/auth/notifications', { preferences: notify });
      const updatedUser = res.data ?? res;
      const nextPrefs = updatedUser?.NotificationPrefs ?? JSON.stringify(notify);
      setUser?.((prev) => ({ ...prev, NotificationPrefs: nextPrefs }));
      syncLocalStorage({ NotificationPrefs: nextPrefs });
      setNotifyDirty(false);
      toast.success('Đã lưu tuỳ chọn thông báo');
    } catch (err) {
      toast.error(err?.message ?? 'Không thể lưu tuỳ chọn thông báo, thử lại sau');
    } finally {
      setNotifySaving(false);
    }
  };

  const requestVerify = async () => {
    setVerifyLoading(true);
    try {
      await api.post('/auth/request-verify');
      setVerifyRequested(true);
      toast.success('Đã gửi yêu cầu xác thực tới admin!');
    } catch (err) { toast.error(err.message); }
    finally { setVerifyLoading(false); }
  };

  const requestVerifyPhone = async () => {
    setPhoneVerifyLoading(true);
    try {
      await api.post('/auth/request-verify-phone');
      setPhoneVerifyRequested(true);
      toast.success('Đã gửi yêu cầu xác thực số điện thoại tới admin!');
    } catch (err) { toast.error(err.message); }
    finally { setPhoneVerifyLoading(false); }
  };

  const SubmitBtn = ({ label = 'Lưu thay đổi', onClick, type = 'submit', busy = loading, icon: Icon = Save }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={busy}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs transition-all disabled:opacity-50"
    >
      {busy ? (
        <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      ) : <Icon size={14} />}
      {label}
    </button>
  );

  const VerifyBlock = () => {
    if (user?.IsVerified) return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 dark:border-emerald-950/40 dark:bg-emerald-950/10 p-3.5">
        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Email đã được xác thực hệ thống</p>
      </div>
    );
    if (verifyRequested || user?.VerifyRequested) return (
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 dark:border-blue-950/40 dark:bg-blue-950/10 p-3.5">
        <Clock size={15} className="text-blue-600 shrink-0" />
        <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Yêu cầu xác thực tài khoản đang chờ phê duyệt</p>
      </div>
    );
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/40 dark:border-amber-950/40 dark:bg-amber-950/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Tài khoản chưa xác thực</p>
          <p className="text-[11px] text-amber-600/90 dark:text-amber-500 mt-0.5">Gửi yêu cầu xác thực để nhận đầy đủ quyền lợi thành viên.</p>
        </div>
        <button type="button" onClick={requestVerify} disabled={verifyLoading} className="h-8 px-3 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shrink-0 transition-colors">
          Gửi yêu cầu
        </button>
      </div>
    );
  };

  const PhoneVerifyBlock = () => {
    const savedPhone = user?.Phone || '';
    const hasUnsavedPhoneChange = (form.phone || '').trim() !== savedPhone;

    if (user?.PhoneVerified && !hasUnsavedPhoneChange) return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 dark:border-emerald-950/40 dark:bg-emerald-950/10 p-3.5">
        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Số điện thoại đã được xác thực</p>
      </div>
    );
    if (hasUnsavedPhoneChange) return (
      <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/40 dark:border-sky-950/40 dark:bg-sky-950/10 p-3.5">
        <Clock size={15} className="text-sky-600 shrink-0" />
        <p className="text-xs font-bold text-sky-700 dark:text-sky-400">Vui lòng lưu thay đổi số điện thoại trước khi xác thực</p>
      </div>
    );
    if (phoneVerifyRequested || user?.PhoneVerifyRequested) return (
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 dark:border-blue-950/40 dark:bg-blue-950/10 p-3.5">
        <Clock size={15} className="text-blue-600 shrink-0" />
        <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Yêu cầu xác thực SĐT đang được xem xét</p>
      </div>
    );
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/40 dark:border-amber-950/40 dark:bg-amber-950/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Số điện thoại chưa xác thực</p>
          <p className="text-[11px] text-amber-600/90 dark:text-amber-500 mt-0.5">Xác thực số điện thoại giúp bảo mật tài khoản tốt hơn.</p>
        </div>
        <button type="button" onClick={requestVerifyPhone} disabled={phoneVerifyLoading} className="h-8 px-3 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shrink-0 transition-colors">
          Xác thực ngay
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-12">
      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden pb-6">
          <AvatarUploader
            user={user}
            onUpload={handleUploadAvatarState}
            onRemove={handleRemoveAvatarState}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatLink to="/orders" icon={Package} label="Đơn hàng của tôi" />
          <StatLink to="/cart" icon={ShoppingBag} label="Giỏ hàng" />
          <StatLink to="/wishlist" icon={Heart} label="Sản phẩm yêu thích" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-100 dark:border-slate-800 space-y-1 md:sticky md:top-6">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all
                  ${tab === t.id
                    ? 'bg-blue-700 text-white dark:bg-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {tab === 'profile' && (
                <Card key="profile" title="Thông tin cá nhân" subtitle="Cập nhật thông tin định danh tài khoản" icon={User} accent="teal">
                  <form onSubmit={saveProfile} className="space-y-4">
                    <Field
                      label="Địa chỉ Email"
                      value={user?.Email || ''}
                      disabled
                      icon={Mail}
                      hint="Muốn đổi email? Vào tab Bảo mật ở bên trái."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Họ và tên" value={form.fullName} onChange={set('fullName')} placeholder="Nhập tên của bạn" className="sm:col-span-2" />
                      <Field
                        label="Số điện thoại"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.phone}
                        onChange={setPhone}
                        placeholder="Chưa cập nhật"
                        icon={Phone}
                        hint={form.phone && form.phone.length !== 10 ? `Đã nhập ${form.phone.length}/10 số` : undefined}
                      />
                      <DateOfBirthField label="Ngày sinh" value={form.dob} onChange={set('dob')} icon={Calendar} />
                    </div>
                    <VerifyBlock />
                    <PhoneVerifyBlock />
                    <div className="flex justify-end pt-2"><SubmitBtn label="Lưu thông tin" /></div>
                  </form>
                </Card>
              )}

              {tab === 'security' && (
                <div className="space-y-6">
                  <Card title="Đổi email đăng nhập" subtitle="Cần xác nhận bằng mật khẩu hiện tại" icon={Mail} accent="violet">
                    {!emailEditing ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Email hiện tại</p>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-1">{user?.Email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEmailEditing(true)}
                          className="h-9 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors shrink-0"
                        >
                          Đổi email
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={changeEmail} className="space-y-4">
                        <Field
                          label="Email mới"
                          type="email"
                          icon={Mail}
                          value={emailForm.newEmail}
                          error={emailErrors.newEmail}
                          onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))}
                          placeholder="ten@vidu.com"
                        />
                        <Field
                          label="Mật khẩu hiện tại"
                          type="password"
                          icon={KeyRound}
                          value={emailForm.password}
                          error={emailErrors.password}
                          onChange={(e) => setEmailForm((f) => ({ ...f, password: e.target.value }))}
                          placeholder="Xác nhận bằng mật khẩu"
                          hint="Sau khi đổi email, bạn cần xác thực lại tài khoản."
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => { setEmailEditing(false); setEmailForm({ newEmail: '', password: '' }); setEmailErrors({}); }}
                            className="h-9 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Hủy
                          </button>
                          <SubmitBtn label="Xác nhận đổi email" busy={emailLoading} icon={Mail} />
                        </div>
                      </form>
                    )}
                  </Card>

                  <Card title="Đổi mật khẩu" subtitle="Cập nhật mật khẩu bảo mật định kỳ" icon={Lock} accent="amber">
                    <form onSubmit={changePassword} className="space-y-4">
                      {[
                        { label: 'Mật khẩu hiện tại',     k: 'cur', field: 'currentPassword' },
                        { label: 'Mật khẩu mới',           k: 'new', field: 'newPassword'     },
                        { label: 'Xác nhận mật khẩu mới', k: 'con', field: 'confirm'          },
                      ].map(({ label, k, field }) => (
                        <Field
                          key={field}
                          label={label}
                          type={showPw[k] ? 'text' : 'password'}
                          value={pw[field]}
                          error={pwErrors[field]}
                          onChange={setPwField(field)}
                          icon={KeyRound}
                          right={
                            <button type="button" onClick={toggleShow(k)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                              {showPw[k] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          }
                        />
                      ))}
                      <div className="flex justify-end pt-2"><SubmitBtn label="Đổi mật khẩu" /></div>
                    </form>
                  </Card>
                </div>
              )}

              {tab === 'addresses' && (
                <Card key="addresses" title="Địa chỉ giao hàng" subtitle="Địa chỉ nhận hàng mặc định của bạn" icon={MapPin} accent="emerald">
                  <form onSubmit={saveProfile} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Địa chỉ cụ thể</label>
                      <textarea
                        rows={3}
                        value={form.address}
                        onChange={set('address')}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                        className="w-full p-3 rounded-2xl border text-sm font-medium transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-slate-800 dark:text-slate-100 resize-none"
                      />
                    </div>
                    <div className="flex justify-end pt-2"><SubmitBtn label="Lưu địa chỉ" /></div>
                  </form>
                </Card>
              )}

              {tab === 'notifications' && (
                <Card key="notifications" title="Cài đặt thông báo" subtitle="Tùy chỉnh kênh nhận tin từ hệ thống" icon={Bell} accent="violet">
                  <div className="space-y-2.5">
                    <Toggle
                      checked={notify.orders}
                      onChange={setNotifyField('orders')}
                      label="Cập nhật hành trình đơn hàng"
                      desc="Trạng thái xử lý, vận chuyển và giao hàng thành công"
                    />
                    <Toggle
                      checked={notify.sms}
                      onChange={setNotifyField('sms')}
                      label="Mã xác thực OTP qua SMS"
                      desc="Tin nhắn bảo mật khi thực hiện giao dịch hoặc đăng nhập"
                    />
                    <Toggle
                      checked={notify.promos}
                      onChange={setNotifyField('promos')}
                      label="Sự kiện khuyến mãi & Flashsale"
                      desc="Nhận thông tin voucher giảm giá độc quyền sớm nhất"
                    />
                    <Toggle
                      checked={notify.newsletter}
                      onChange={setNotifyField('newsletter')}
                      label="Bản tin sức khỏe hàng tuần"
                      desc="Mẹo chăm sóc sức khỏe và sản phẩm mới từ MediCare"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-blue-500" />
                      {notifyDirty ? 'Bạn có thay đổi chưa lưu' : 'Tuỳ chọn đã được lưu trên hệ thống'}
                    </p>
                    <SubmitBtn
                      type="button"
                      label="Lưu cấu hình"
                      onClick={saveNotifications}
                      busy={notifySaving}
                    />
                  </div>
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}