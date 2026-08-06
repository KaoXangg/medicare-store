import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MessageSquare, Package, X } from 'lucide-react';
import api from '../../services/api';
import { formatDateTime, formatPrice, orderStatusLabel } from '../../utils/format';

export default function CustomerOrderNotifications({ open, onClose, onCountsChange }) {
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [counts, setCounts] = useState({ orders: 0, contacts: 0 });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('orders');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      api.get('/orders/my?limit=5').catch(() => ({ data: [] })),
      api.get('/contacts/my/notifications').catch(() => ({ data: { items: [], unread: 0 } })),
      api.get('/notifications/my').catch(() => ({ data: { orders: 0, contacts: 0 } })),
    ])
      .then(([ordersRes, contactsRes, countsRes]) => {
        setOrders(ordersRes.data || []);
        setContacts(contactsRes.data?.items || []);
        const next = {
          orders: countsRes.data?.orders ?? 0,
          contacts: countsRes.data?.contacts ?? contactsRes.data?.unread ?? 0,
        };
        setCounts(next);
        onCountsChange?.(next);
        if (next.contacts > 0 && next.orders === 0) setTab('contacts');
        else if (next.orders > 0) setTab('orders');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const markContactRead = async (id) => {
    try {
      await api.patch(`/contacts/my/${id}/read`);
      setCounts((prev) => {
        const next = { ...prev, contacts: Math.max(0, prev.contacts - 1) };
        onCountsChange?.(next);
        return next;
      });
      setContacts((prev) => prev.map((c) => (c.ContactId === id ? { ...c, ReplyRead: 1 } : c)));
    } catch {
      /* ignore */
    }
  };

  if (typeof document === 'undefined') return null;

  const tabs = [
    { id: 'orders', label: 'Đơn hàng', icon: Package, count: counts.orders, tone: 'amber' },
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
            className="fixed left-1/2 top-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)] z-[201] flex max-h-[min(78dvh,520px)] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:top-20"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
              <div>
                <p className="font-black text-slate-900 dark:text-white">Thông báo</p>
                <p className="text-xs text-slate-500">Đơn hàng & phản hồi liên hệ</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
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
                <div className="p-6 text-center text-sm text-slate-500">Đang tải...</div>
              ) : tab === 'orders' ? (
                orders.length ? (
                  orders.map((o) => {
                    const st = orderStatusLabel[o.Status];
                    return (
                      <Link
                        key={o.OrderId}
                        to={`/orders/${o.OrderId}`}
                        onClick={onClose}
                        className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-amber-50/80 dark:border-white/5 dark:hover:bg-amber-500/5 last:border-0"
                      >
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                          <Package size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">#{o.OrderCode}</p>
                          <p className="text-xs text-slate-500">
                            {formatPrice(o.TotalAmount)} · {formatDateTime(o.CreatedAt)}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${st?.color || 'bg-amber-100 text-amber-800'}`}>
                          {st?.label || o.Status}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-sm text-slate-500">Chưa có đơn hàng</div>
                )
              ) : contacts.length ? (
                contacts.map((c) => (
                  <Link
                    key={c.ContactId}
                    to="/contact"
                    onClick={() => {
                      markContactRead(c.ContactId);
                      onClose();
                    }}
                    className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-emerald-50/80 dark:border-white/5 dark:hover:bg-emerald-500/5 last:border-0 ${
                      !c.ReplyRead ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <MessageSquare size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">{c.Subject}</p>
                        <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          Admin đã phản hồi
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{c.AdminReply}</p>
                        {c.ReplyAt && (
                          <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(c.ReplyAt)}</p>
                        )}
                      </div>
                      {!c.ReplyRead && (
                        <span className="mt-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white">
                          1
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-slate-500">Chưa có phản hồi liên hệ</div>
              )}
            </div>

            <div className="border-t border-slate-200/80 p-3 dark:border-white/10">
              <Link
                to={tab === 'contacts' ? '/contact' : '/orders'}
                onClick={onClose}
                className={`block rounded-xl py-2.5 text-center text-sm font-bold ${
                  tab === 'contacts'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                }`}
              >
                {tab === 'contacts' ? 'Xem tin nhắn liên hệ →' : 'Xem tất cả đơn hàng →'}
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
