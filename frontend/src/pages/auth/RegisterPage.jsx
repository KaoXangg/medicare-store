import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  UserPlus, Mail, Lock, Eye, EyeOff, User,
  Phone, ArrowRight, ShieldCheck, CheckCircle2, Loader2, XCircle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

function Blobs() {
  return (
    <>
      <div className="pointer-events-none absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-primary-400/20 dark:bg-primary-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-[600px] w-[600px] rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '9s' }} />
    </>
  );
}

function Field({ label, icon: Icon, error, type = 'text', hint, right, status, ...props }) {
  const takenMsgMap = { phone: 'Số điện thoại này đã được sử dụng', idCard: 'Số CCCD/CMND này đã được sử dụng', email: 'Email này đã được sử dụng' };
  const statusMsg = status === 'taken' ? (takenMsgMap[props.name] || 'Thông tin này đã được sử dụng') : null;
  const effectiveError = error || statusMsg;
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="relative">
        <Icon size={15} strokeWidth={2.4} style={{ color: '#0f172a' }} className="absolute left-4 top-1/2 -translate-y-1/2 dark:!text-slate-200 pointer-events-none" />
        <input
          type={type}
          {...props}
          className={`w-full h-11 pl-11 ${right || status ? 'pr-12' : 'pr-4'} rounded-2xl border text-sm font-medium transition-all duration-200
            bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400
            placeholder:text-slate-400 dark:placeholder:text-slate-600
            ${effectiveError
              ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/20'
              : status === 'available'
                ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                : 'border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'}
            text-slate-800 dark:text-slate-100`}
        />
        {right}
        {!right && status === 'checking' && (
          <Loader2 size={15} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
        )}
        {!right && status === 'available' && (
          <CheckCircle2 size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />
        )}
        {!right && status === 'taken' && (
          <XCircle size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500" />
        )}
      </div>
      <AnimatePresence>
        {effectiveError && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-rose-500 font-medium flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-rose-500" /> {effectiveError}
          </motion.p>
        )}
        {!effectiveError && status === 'available' && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-emerald-500" /> Có thể sử dụng
          </motion.p>
        )}
      </AnimatePresence>
      {hint && !effectiveError && status !== 'available' && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

function DateOfBirthField({ label, value, onChange, error }) {
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
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="relative">
        <User size={15} strokeWidth={2.4} style={{ color: '#0f172a' }} className="absolute left-4 top-1/2 -translate-y-1/2 dark:!text-slate-200 pointer-events-none" />
        <button
          ref={btnRef}
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          className={`w-full h-11 pl-11 pr-4 rounded-2xl border text-sm font-medium text-left transition-all duration-200
            bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400
            ${error
              ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/20'
              : 'border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'}
            text-slate-800 dark:text-slate-100`}
        >
          {displayLabel || <span className="text-slate-400 dark:text-slate-600">Chọn ngày sinh</span>}
        </button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-rose-500 font-medium flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-rose-500" /> {error}
          </motion.p>
        )}
      </AnimatePresence>

      {open && pos && createPortal(
        <motion.div
          ref={popRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          style={{ position: 'fixed', zIndex: 200, top: pos.top, left: pos.left }}
          className="w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-2xl"
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
              className="h-7 flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>Tháng {i + 1}</option>)}
            </select>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
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
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
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

/* ── Password strength bar ── */
function StrengthBar({ pw }) {
  const score = [/.{6,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  const colors = ['', 'bg-rose-500', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  if (!pw) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-slate-200 dark:bg-slate-700'}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${['', 'text-rose-500', 'text-amber-500', 'text-yellow-600', 'text-emerald-500'][score]}`}>
        Độ mạnh: {labels[score]}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', idCard: '', dob: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [phoneStatus, setPhoneStatus] = useState(null);
  const [idCardStatus, setIdCardStatus] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidPhone = (v) => /^(0[3-9])\d{8}$/.test(v);
  const isValidIdCard = (v) => /^\d{9}(\d{3})?$/.test(v); // CMND 9 số hoặc CCCD 12 số

  // Debounce kiểm tra Email real-time khi người dùng gõ xong (500ms không gõ thêm)
  useEffect(() => {
    if (!form.email) { setEmailStatus(null); return; }
    if (!isValidEmail(form.email)) { setEmailStatus(null); return; }
    setEmailStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/auth/check-availability', { params: { email: form.email } });
        setEmailStatus(res.data.emailTaken ? 'taken' : 'available');
      } catch {
        setEmailStatus(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.email]);

  // Debounce kiểm tra SĐT real-time
  useEffect(() => {
    if (!form.phone) { setPhoneStatus(null); return; }
    if (!isValidPhone(form.phone)) { setPhoneStatus(null); return; }
    setPhoneStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/auth/check-availability', { params: { phone: form.phone } });
        setPhoneStatus(res.data.phoneTaken ? 'taken' : 'available');
      } catch {
        setPhoneStatus(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.phone]);

  // Debounce kiểm tra CCCD/CMND real-time (bỏ qua nếu để trống vì đây là field tuỳ chọn)
  useEffect(() => {
    if (!form.idCard) { setIdCardStatus(null); return; }
    if (!isValidIdCard(form.idCard)) { setIdCardStatus(null); return; }
    setIdCardStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/auth/check-availability', { params: { idCard: form.idCard } });
        setIdCardStatus(res.data.idCardTaken ? 'taken' : 'available');
      } catch {
        setIdCardStatus(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.idCard]);

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Họ tên bắt buộc';
    if (!form.email) errs.email = 'Email bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.phone) errs.phone = 'Số điện thoại bắt buộc';
    else if (!/^(0[3-9])\d{8}$/.test(form.phone)) errs.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)';
    else if (phoneStatus === 'taken') errs.phone = 'Số điện thoại này đã được sử dụng';
    if (emailStatus === 'taken') errs.email = errs.email || 'Email này đã được sử dụng';
    if (form.idCard && idCardStatus === 'taken') errs.idCard = 'Số CCCD/CMND này đã được sử dụng';
    if (!form.dob) errs.dob = 'Ngày sinh bắt buộc';
    if (form.password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (form.password !== form.confirm) errs.confirm = 'Mật khẩu không khớp';
    if (!agreed) errs.agreed = 'Vui lòng đồng ý điều khoản';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register({ fullName: form.fullName, email: form.email, phone: form.phone, dob: form.dob, idCard: form.idCard, password: form.password });
      toast.success('Đăng ký thành công! Chào mừng bạn đến với MediCare.');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
      if (err.errors) setErrors((prev) => ({ ...prev, ...err.errors.reduce((a, x) => ({ ...a, [x.path]: x.msg }), {}) }));
    }
    finally { setLoading(false); }
  };

  const steps = [
    { icon: CheckCircle2, text: 'Xác thực Email & SĐT' },
    { icon: ShieldCheck, text: 'Bảo mật SSL' },
    { icon: ShieldCheck, text: 'Xác thực CCCD/CMND' },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <Blobs />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-white/75 dark:bg-slate-800/75 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-900/10 dark:shadow-black/40 border border-white/60 dark:border-slate-700/50 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-indigo-500 to-cyan-500" />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-7">
              <motion.div
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-950/60 dark:to-indigo-950/60 text-primary-600 dark:text-primary-400 mb-4 ring-4 ring-primary-100/60 dark:ring-primary-950/30 shadow-inner"
              >
                <UserPlus size={34} strokeWidth={1.8} />
              </motion.div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-primary-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-indigo-400 dark:to-cyan-400">
                Tạo tài khoản
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                Mua sắm thiết bị y tế chính hãng tại <span className="font-bold text-primary-600 dark:text-primary-400">MediCare</span>
              </p>
            </div>

            {/* Trust badges */}
            <div className="flex justify-center gap-5 mb-6">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <s.icon size={13} className="text-emerald-500 shrink-0" />
                  {s.text}
                </div>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Section: Thông tin cá nhân */}
              <div className="space-y-1 mb-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-500 dark:text-primary-400">
                  — Thông tin cá nhân
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Họ và tên *" icon={User} placeholder="Nguyễn Văn A" value={form.fullName} error={errors.fullName} onChange={set('fullName')} autoComplete="name" />
                </div>

                <DateOfBirthField label="Ngày sinh *" value={form.dob} error={errors.dob} onChange={set('dob')} />
                <Field label="CCCD / CMND" icon={ShieldCheck} name="idCard" placeholder="0123456789012" value={form.idCard} error={errors.idCard} status={idCardStatus} onChange={set('idCard')} hint="Tuỳ chọn – để xác thực tài khoản" />
              </div>

              {/* Section: Liên hệ */}
              <div className="space-y-1 mt-2 mb-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-500 dark:text-primary-400">
                  — Thông tin liên hệ
                </p>
              </div>

              <Field label="Email *" icon={Mail} type="email" name="email" placeholder="example@gmail.com" value={form.email} error={errors.email} status={emailStatus} onChange={set('email')} autoComplete="email" />
              <Field label="Số điện thoại *" icon={Phone} type="tel" name="phone" placeholder="0912 345 678" value={form.phone} error={errors.phone} status={phoneStatus} onChange={set('phone')} autoComplete="tel" hint="Dùng để xác thực và nhận thông báo đơn hàng" />

              {/* Section: Mật khẩu */}
              <div className="space-y-1 mt-2 mb-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-500 dark:text-primary-400">
                  — Bảo mật
                </p>
              </div>

              <Field
                label="Mật khẩu *"
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                error={errors.password}
                onChange={set('password')}
                autoComplete="new-password"
                right={
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    style={{ color: '#0f172a' }} className="absolute right-4 top-1/2 -translate-y-1/2 dark:!text-slate-200 hover:opacity-70 transition">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
              <StrengthBar pw={form.password} />

              <Field
                label="Xác nhận mật khẩu *"
                icon={Lock}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={form.confirm}
                error={errors.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
                right={
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    style={{ color: '#0f172a' }} className="absolute right-4 top-1/2 -translate-y-1/2 dark:!text-slate-200 hover:opacity-70 transition">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              {/* Terms */}
              <div className="space-y-1">
                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors
                  ${errors.agreed ? 'border-rose-300 bg-rose-50/60 dark:border-rose-700/40 dark:bg-rose-950/20'
                    : 'border-slate-200/80 dark:border-slate-700/60 hover:border-primary-300 dark:hover:border-primary-700/60 hover:bg-primary-50/40 dark:hover:bg-primary-950/20'}`}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-primary-600 shrink-0" />
                  <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Tôi đồng ý với{' '}
                    <Link to="/terms" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">Điều khoản sử dụng</Link>
                    {' '}và{' '}
                    <Link to="/privacy" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">Chính sách bảo mật</Link>
                  </span>
                </label>
                {errors.agreed && (
                  <p className="text-xs text-rose-500 font-medium pl-1">{errors.agreed}</p>
                )}
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl font-bold text-white text-sm
                    bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600
                    shadow-lg shadow-primary-500/30 dark:shadow-primary-900/40
                    disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <>Tạo tài khoản <ArrowRight size={16} /></>
                  )}
                </button>
              </motion.div>
            </form>

            <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-black text-primary-600 dark:text-primary-400 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}