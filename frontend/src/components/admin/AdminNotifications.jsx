import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShoppingBag, X } from 'lucide-react';
import api from '../../services/api';
import { formatDateTime, formatPrice } from '../../utils/format';

export default function AdminNotifications({ open, onClose, onCountsChange }) {
  const [tab, setTab] = useState('orders');
  const [counts, setCounts] = useState({ orders: 0, contacts: 0 });
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get('/admin/notifications')
      .then((r) => {
        const c = r.data?.counts || { orders: 0, contacts: 0 };
        setCounts(c);
        setOrders(r.data?.orders || []);
        setContacts(r.data?.contacts || []);
        onCountsChange?.(c);
        if (c.contacts > 0 && c.orders === 0) setTab('contacts');
        else if (c.orders > 0) setTab('orders');
      })
      .catch(() => {
        setCounts({ orders: 0, contacts: 0 });
        setOrders([]);
        setContacts([]);
      })
      .finally(() => setLoading(false));
    
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  const tabs = [
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, count: counts.orders, tone: 'amber' },
    { id: 'contacts', label: 'Liên hệ', icon: Mail, count: counts.contacts, tone: 'emerald' },
  ];

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/50 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Đóng thông báo"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed left-1/2 top-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)] z-[201] flex max-h-[min(78dvh,560px)] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900 lg:top-20"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
              <div>
                <p className="font-black text-slate-900 dark:text-white">Thông báo</p>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-amber-600">Vàng</span> = đơn chờ ·{' '}
                  <span className="font-semibold text-emerald-600">Xanh</span> = liên hệ mới
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-slate-100 dark:border-white/10">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`relative flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition ${
                    tab === t.id
                      ? t.tone === 'amber'
                        ? 'border-b-2 border-amber-500 text-amber-700 dark:text-amber-400'
                        : 'border-b-2 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500'
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                  {t.count > 0 && (
                    <span
                      className={`ml-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black text-white ${
                        t.tone === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    >
                      {t.count > 9 ? '9+' : t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">Đang tải...</div>
              ) : tab === 'orders' ? (
                orders.length ? (
                  orders.map((o) => (
                    <Link
                      key={o.OrderId}
                      to="/admin/orders"
                      onClick={onClose}
                      className="flex items-start gap-3 border-b border-slate-100 px-4 py-3.5 transition hover:bg-amber-50/80 dark:border-white/5 dark:hover:bg-amber-500/5 last:border-0"
                    >
                      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                        <ShoppingBag size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">#{o.OrderCode}</p>
                        <p className="truncate text-xs text-slate-500">
                          {o.CustomerName} · {formatPrice(o.TotalAmount)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(o.CreatedAt)}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                        Chờ xác nhận
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-slate-500">Không có đơn chờ xác nhận</div>
                )
              ) : contacts.length ? (
                contacts.map((c) => (
                  <Link
                    key={c.ContactId}
                    to="/admin/contacts"
                    onClick={onClose}
                    className="flex items-start gap-3 border-b border-slate-100 px-4 py-3.5 transition hover:bg-emerald-50/80 dark:border-white/5 dark:hover:bg-emerald-500/5 last:border-0"
                  >
                    <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                      <Mail size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{c.Subject}</p>
                      <p className="truncate text-xs text-slate-500">
                        {c.FullName} · {c.Email}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{c.Message}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(c.CreatedAt)}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                      Mới
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">Không có liên hệ mới</div>
              )}
            </div>

            <div className="border-t border-slate-200/80 p-3 dark:border-white/10">
              <Link
                to={tab === 'contacts' ? '/admin/contacts' : '/admin/orders'}
                onClick={onClose}
                className={`block rounded-xl py-3 text-center text-sm font-bold ${
                  tab === 'contacts'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                }`}
              >
                {tab === 'contacts' ? 'Quản lý liên hệ →' : 'Quản lý đơn hàng →'}
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
