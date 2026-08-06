import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

/* ── shared field ── */
function Field({ label, icon: Icon, error, type = 'text', right, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="relative">
        <Icon size={16} strokeWidth={2.4} style={{ color: '#0f172a' }} className="absolute left-4 top-1/2 -translate-y-1/2 dark:!text-slate-200 pointer-events-none" />
        <input
          type={type}
          {...props}
          className={`w-full h-12 pl-11 pr-${right ? '12' : '4'} rounded-2xl border text-sm font-medium transition-all duration-200
            bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400
            placeholder:text-slate-400 dark:placeholder:text-slate-600
            ${error
              ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/20'
              : 'border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
            }
            text-slate-800 dark:text-slate-100`}
        />
        {right}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-rose-500 font-medium flex items-center gap-1"
          >
            <span className="inline-block w-1 h-1 rounded-full bg-rose-500" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── BG blobs ── */
function Blobs() {
  return (
    <>
      <div className="pointer-events-none absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-primary-400/20 dark:bg-primary-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-[600px] w-[600px] rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '9s' }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-cyan-400/10 dark:bg-cyan-500/5 blur-[80px]" />
    </>
  );
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email) errs.email = 'Vui lòng nhập email hoặc số điện thoại';
    if (!form.password) errs.password = 'Mật khẩu bắt buộc';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      toast.success('Đăng nhập thành công!');
      navigate(res.data.user.Role === 'admin' && from === '/' ? '/admin' : from);
    } catch (err) {
      toast.error(err.message);
      if (err.errors) setErrors(err.errors.reduce((a, x) => ({ ...a, [x.path]: x.msg }), {}));
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-[88vh] flex items-center justify-center px-4 py-16 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <Blobs />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/75 dark:bg-slate-800/75 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-900/10 dark:shadow-black/40 border border-white/60 dark:border-slate-700/50 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-indigo-500 to-cyan-500" />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-950/60 dark:to-indigo-950/60 text-primary-600 dark:text-primary-400 mb-4 ring-4 ring-primary-100/60 dark:ring-primary-950/30 shadow-inner"
              >
                <HeartPulse size={36} strokeWidth={1.8} />
              </motion.div>

              <h1 className="text-3xl font-black bg-gradient-to-r from-primary-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-indigo-400 dark:to-cyan-400">
                Đăng nhập
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                Chào mừng trở lại <span className="font-bold text-primary-600 dark:text-primary-400">MediCare Store</span>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field
                label="Email hoặc số điện thoại"
                icon={Mail}
                type="text"
                placeholder="••••••••"
                value={form.email}
                error={errors.email}
                onChange={set('email')}
                autoComplete="username"
              />

              <Field
                label="Mật khẩu"
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                error={errors.password}
                onChange={set('password')}
                autoComplete="current-password"
                right={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    style={{ color: '#0f172a' }} className="absolute right-4 top-1/2 -translate-y-1/2 dark:!text-slate-200 hover:opacity-70 transition"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded-md accent-primary-600" />
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Ghi nhớ đăng nhập</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full h-12 rounded-2xl font-bold text-white text-sm overflow-hidden
                    bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600 bg-size-200
                    hover:bg-pos-100 transition-all duration-500
                    shadow-lg shadow-primary-500/30 dark:shadow-primary-900/40
                    disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <>Đăng nhập <ArrowRight size={16} /></>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Trust badges */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                <ShieldCheck size={13} className="text-emerald-500" />
                SSL bảo mật
              </div>
              <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                <HeartPulse size={13} className="text-primary-500" />
                MediCare Store
              </div>
            </div>

            <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-black text-primary-600 dark:text-primary-400 hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Floating decorative card below */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-5 text-xs text-slate-400 dark:text-slate-600"
        >
          Bằng cách đăng nhập, bạn đồng ý với{' '}
          <Link to="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-400">Điều khoản</Link>
          {' '}và{' '}
          <Link to="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-400">Chính sách bảo mật</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}