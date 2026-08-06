import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, LockKeyhole, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function Blobs() {
  return (
    <>
      <div className="pointer-events-none absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-primary-400/20 dark:bg-primary-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-[600px] w-[600px] rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '9s' }} />
    </>
  );
}

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

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const token = params.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Mật khẩu tối thiểu 6 ký tự'); return; }
    if (password !== confirm) { toast.error('Mật khẩu không khớp'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Đặt lại mật khẩu thành công!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  /* ── Invalid token ── */
  if (!token) return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-16 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <Blobs />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md text-center bg-white/75 dark:bg-slate-800/75 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl border border-white/60 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-orange-500 absolute top-0 left-0" />
        <div className="inline-flex p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-4 ring-4 ring-rose-100/60 dark:ring-rose-950/30">
          <ShieldAlert size={40} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Đường dẫn không hợp lệ</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-7 leading-relaxed">
          Token khôi phục mật khẩu không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu link mới.
        </p>
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all"
        >
          Yêu cầu link mới <ArrowRight size={15} />
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-16 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <Blobs />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/75 dark:bg-slate-800/75 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-900/10 dark:shadow-black/40 border border-white/60 dark:border-slate-700/50 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-indigo-500 to-cyan-500" />

          <div className="p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                className={`inline-flex p-4 rounded-2xl mb-4 ring-4 shadow-inner transition-all duration-500
                  ${done
                    ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/60 dark:to-green-950/60 text-emerald-600 dark:text-emerald-400 ring-emerald-100/60 dark:ring-emerald-950/30'
                    : 'bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-950/60 dark:to-indigo-950/60 text-primary-600 dark:text-primary-400 ring-primary-100/60 dark:ring-primary-950/30'
                  }`}
              >
                {done ? <CheckCircle2 size={36} strokeWidth={1.8} /> : <LockKeyhole size={36} strokeWidth={1.8} />}
              </motion.div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-primary-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-indigo-400 dark:to-cyan-400">
                {done ? 'Thành công!' : 'Đặt lại mật khẩu'}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                {done ? 'Đang chuyển bạn về trang đăng nhập...' : 'Nhập mật khẩu mới an toàn cho tài khoản'}
              </p>
            </div>

            {!done && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mật khẩu mới *</label>
                  <div className="relative">
                    <LockKeyhole size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      required
                      className="w-full h-12 pl-11 pr-12 rounded-2xl border text-sm font-medium transition-all
                        bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/80 dark:border-slate-700/60
                        hover:border-slate-300 dark:hover:border-slate-600
                        focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400
                        text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <StrengthBar pw={password} />
                </div>

                {/* Confirm */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Xác nhận mật khẩu *</label>
                  <div className="relative">
                    <LockKeyhole size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      required
                      className={`w-full h-12 pl-11 pr-12 rounded-2xl border text-sm font-medium transition-all
                        bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm
                        focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400
                        text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600
                        ${confirm && password !== confirm
                          ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/20'
                          : 'border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-xs text-rose-500 font-medium">Mật khẩu không khớp</p>
                  )}
                  {confirm && password === confirm && confirm.length >= 6 && (
                    <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} /> Mật khẩu khớp
                    </p>
                  )}
                </div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2
                      bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600
                      shadow-lg shadow-primary-500/30 dark:shadow-primary-900/40
                      disabled:opacity-60 transition-all"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : (
                      <>Cập nhật mật khẩu <ArrowRight size={16} /></>
                    )}
                  </button>
                </motion.div>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  <Link to="/login" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
                    ← Quay lại đăng nhập
                  </Link>
                </p>
              </form>
            )}

            {done && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.5, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}