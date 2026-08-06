import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ArrowLeft,
  ArrowUp,
  ShieldCheck,
  Clock,
  Link2,
  Check,
  FileText,
  Scale,
  PenLine,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LegalDocLayout({
  icon: Icon = FileText,
  eyebrow = 'Pháp lý',
  title = 'Chính sách bảo mật',
  description = 'Cam kết bảo vệ dữ liệu cá nhân của bạn.',
  version = '1.0',
  updatedDate = '29/07/2026',
  sections = [],
  backTo = '/register',
  backLabel = 'Quay lại',
  signerName = 'Trần Cao Sang',
  signerTitle = 'Đại diện pháp lý',
  signerDate = '29/07/2026',
}) {
  const sectionRefs = useRef({});
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');
  const [progress, setProgress] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const readMinutes = useMemo(() => {
    const words = sections.reduce((total, s) => {
      const body = typeof s.body === 'string' ? s.body : '';
      return total + body.trim().split(/\s+/).filter(Boolean).length;
    }, 0);
    return Math.max(1, Math.round(words / 200));
  }, [sections]);

  useEffect(() => {
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    const els = Object.values(sectionRefs.current).filter(Boolean);
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
      setShowTopBtn(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const scrollToSection = (id) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyLink = (id) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopiedId(id);
        toast.success('Đã sao chép liên kết điều khoản');
        setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1600);
      })
      .catch(() => toast.error('Không thể sao chép liên kết'));
  };

  const signatureDate = signerDate || updatedDate;
  const activeIndex = Math.max(0, sections.findIndex((s) => s.id === activeId));

  return (
    <div className="relative w-full min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-primary-300/30 dark:bg-primary-500/15 blur-[120px]" />
        <div className="absolute top-1/4 -right-40 h-[420px] w-[420px] rounded-full bg-indigo-300/25 dark:bg-indigo-500/15 blur-[110px]" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-cyan-300/20 dark:bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-slate-200/40 dark:bg-slate-800/40">
        <motion.div
          className="h-full origin-left bg-gradient-to-r from-primary-500 via-indigo-500 to-cyan-500"
          style={{ scaleX: progress / 100 }}
          transition={{ type: 'spring', stiffness: 120, damping: 25 }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-24 pt-8 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-center justify-between gap-4"
        >
          <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 overflow-hidden">
            <span className="font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">MediCare Store</span>
            <ChevronRight size={11} className="opacity-50 shrink-0" />
            <span className="whitespace-nowrap">{eyebrow}</span>
            <ChevronRight size={11} className="opacity-50 shrink-0" />
            <span className="font-semibold text-primary-600 dark:text-primary-400 truncate">{title}</span>
          </nav>

          <Link
            to={backTo}
            className="group hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:border-primary-300 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:text-primary-400"
          >
            <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
            {backLabel}
          </Link>
        </motion.div>

        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8 overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/90 shadow-xl shadow-slate-900/5 dark:shadow-black/40"
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-indigo-500 to-cyan-500" />

          <div className="relative px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-primary-400/15 to-cyan-400/10 dark:from-primary-500/20 dark:to-cyan-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/50 dark:to-indigo-900/40 text-primary-600 dark:text-primary-300 ring-4 ring-primary-100/60 dark:ring-primary-800/40 shadow-inner">
                    <Icon size={28} strokeWidth={1.7} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">
                      {eyebrow}
                    </span>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5">
                      <ShieldCheck size={12} className="text-amber-600 dark:text-amber-400" strokeWidth={2.2} />
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        Đã rà soát pháp lý
                      </span>
                    </div>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black tracking-tight leading-[1.15] bg-gradient-to-r from-primary-600 via-indigo-600 to-cyan-600 dark:from-primary-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  {title}
                </h1>

                {description && (
                  <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-slate-50 dark:bg-slate-800/80 px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                      Phiên bản
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{version}</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-600" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                      Cập nhật
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{updatedDate}</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-600" />
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Clock size={14} className="text-primary-500 dark:text-primary-400" />
                    <span className="text-sm font-semibold">{readMinutes} phút</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr] lg:gap-10 lg:items-start">
          <aside className="hidden lg:block sticky top-8 self-start z-20">
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700/70 bg-white dark:bg-slate-900/95 shadow-lg shadow-slate-900/5 dark:shadow-black/30 overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
                      <Scale size={14} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Mục lục
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                    {activeIndex + 1}/{sections.length || 1}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-cyan-500"
                    initial={false}
                    animate={{
                      width: sections.length
                        ? `${((activeIndex + 1) / sections.length) * 100}%`
                        : '0%',
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 28 }}
                  />
                </div>
              </div>

              <nav className="p-2 max-h-[min(60vh,520px)] overflow-y-auto overscroll-contain">
                {sections.map((s, idx) => {
                  const active = activeId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => scrollToSection(s.id)}
                      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                        active
                          ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-800 dark:text-primary-200 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="toc-active"
                          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary-500 to-cyan-500"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums transition-colors ${
                          active
                            ? 'bg-primary-600 dark:bg-primary-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {s.number ?? idx + 1}
                      </span>
                      <span className="text-[13px] font-semibold leading-snug line-clamp-2">
                        {s.navLabel ?? s.title}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="lg:hidden -mx-4 px-4 flex gap-2 overflow-x-auto pb-1">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(s.id)}
                className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  activeId === s.id
                    ? 'border-transparent bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/25'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/80'
                }`}
              >
                {s.number}
              </button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/90 shadow-xl shadow-slate-900/5 dark:shadow-black/40">
              <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-indigo-500 to-cyan-500" />

              <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
                <div className="divide-y divide-slate-200/70 dark:divide-slate-700/50">
                  {sections.map((s, i) => (
                    <motion.section
                      key={s.id}
                      id={s.id}
                      ref={(el) => {
                        if (el) sectionRefs.current[s.id] = el;
                      }}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.2) }}
                      className="group scroll-mt-24 py-7 first:pt-2 last:pb-2"
                    >
                      <div className="mb-3 flex items-baseline gap-3">
                        <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/40 px-1.5 text-xs font-bold tabular-nums text-primary-600 dark:text-primary-400">
                          {s.number}
                        </span>
                        <h2 className="flex-1 text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                          {s.title}
                        </h2>
                        <button
                          type="button"
                          onClick={() => copyLink(s.id)}
                          aria-label="Sao chép liên kết điều khoản"
                          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shrink-0 rounded-lg p-1.5 text-slate-400 dark:text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/40 dark:hover:text-primary-400"
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {copiedId === s.id ? (
                              <motion.span
                                key="check"
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.6, opacity: 0 }}
                              >
                                <Check size={15} className="text-emerald-500" />
                              </motion.span>
                            ) : (
                              <motion.span
                                key="link"
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.6, opacity: 0 }}
                              >
                                <Link2 size={15} />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </button>
                      </div>
                      <p className="pl-0 sm:pl-10 text-[15px] leading-[1.75] text-slate-600 dark:text-slate-400">
                        {s.body}
                      </p>
                    </motion.section>
                  ))}
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700/60">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900/90 p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                      <div className="flex-1 space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1">
                          <PenLine size={13} className="text-primary-600 dark:text-primary-400" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-300">
                            Xác nhận & Chữ ký
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                          Tài liệu này đã được rà soát và có hiệu lực kể từ ngày cập nhật. Mọi thắc mắc vui lòng liên hệ bộ phận pháp lý.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <ShieldCheck size={15} className="text-emerald-500 dark:text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Đã xác minh tính pháp lý
                          </span>
                        </div>
                      </div>

                      <div className="relative w-full max-w-[280px] shrink-0">
                        <div className="relative rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-950/80 px-6 py-5">
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary-600 to-indigo-600 px-3 py-1 shadow-md shadow-primary-500/25">
                            <ShieldCheck size={12} className="text-white" strokeWidth={2.5} />
                            <span className="text-[10px] font-bold text-white tracking-wide">OFFICIAL</span>
                          </div>

                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 text-center mb-4 mt-1">
                            Đại diện ký tên
                          </p>

                          <div className="flex flex-col items-center text-center">
                            <p
                              className="text-[1.65rem] leading-none text-slate-800 dark:text-slate-100 mb-1"
                              style={{
                                fontFamily: '"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive',
                                letterSpacing: '0.03em',
                              }}
                            >
                              {signerName}
                            </p>
                            <div className="w-40 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent mb-3" />
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{signerName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{signerTitle}</p>
                            {signatureDate && (
                              <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                <Clock size={11} />
                                {signatureDate}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex sm:hidden">
                  <Link
                    to={backTo}
                    className="inline-flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900/40 px-4 py-2 text-sm font-bold text-primary-600 dark:text-primary-400"
                  >
                    <ArrowLeft size={14} /> {backLabel}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}