import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email && !phone) { setError('Vui lòng nhập email hoặc số điện thoại'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email || undefined, phone: phone || undefined });
      setSent(true);
      toast.success('Đã gửi hướng dẫn khôi phục!');
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-16 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
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
                className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/60 text-amber-600 dark:text-amber-400 mb-4 ring-4 ring-amber-100/60 dark:ring-amber-950/30 shadow-inner"
              >
                <KeyRound size={36} strokeWidth={1.8} />
              </motion.div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-primary-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-indigo-400 dark:to-cyan-400">
                Quên mật khẩu
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                Nhập thông tin xác thực để nhận link khôi phục
              </p>
            </div>

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-5"
                >
                  <div className="inline-flex p-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={40} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Đã gửi thành công!</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Chúng tôi đã gửi link đặt lại mật khẩu. Kiểm tra hộp thư email hoặc tin nhắn SMS.
                    </p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300 font-medium">
                    Link có hiệu lực trong <strong>15 phút</strong>. Kiểm tra thư mục Spam nếu không thấy.
                  </div>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="text-sm text-primary-600 dark:text-primary-400 font-bold hover:underline"
                  >
                    Gửi lại?
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Email field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email đăng ký</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border text-sm font-medium transition-all
                          bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/80 dark:border-slate-700/60
                          hover:border-slate-300 dark:hover:border-slate-600
                          focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400
                          text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Divider OR */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">hoặc</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Số điện thoại</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none select-none">📱</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border text-sm font-medium transition-all
                          bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/80 dark:border-slate-700/60
                          hover:border-slate-300 dark:hover:border-slate-600
                          focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400
                          text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-rose-500" /> {error}
                    </p>
                  )}

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
                        <><Send size={15} /> Gửi link khôi phục</>
                      )}
                    </button>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-7 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition hover:underline">
                <ArrowLeft size={14} /> Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}