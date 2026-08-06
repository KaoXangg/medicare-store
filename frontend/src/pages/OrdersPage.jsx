import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Package } from 'lucide-react';
import api, { getImageUrl } from '../services/api';
import { formatPrice, formatDate, orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from '../utils/format';
import ProtectedRoute from '../components/auth/ProtectedRoute';

function OrdersContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my').then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-primary-600">My Orders</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Lịch sử mua hàng</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-white/5" />
          ))}
        </div>
      ) : !orders.length ? (
        <div className="surface rounded-3xl p-12 text-center">
          <Package className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <p className="text-slate-500">Chưa có đơn hàng nào</p>
          <Link to="/products" className="mt-4 inline-block font-semibold text-primary-600">Mua sắm ngay →</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((o, i) => {
            const st = orderStatusLabel[o.Status] || orderStatusLabel.pending;
            const paySt = paymentStatusLabel[o.PaymentStatus] || paymentStatusLabel.unpaid;
            return (
              <motion.div
                key={o.OrderId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="surface overflow-hidden rounded-3xl transition hover:shadow-lg"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200/80 p-5 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link to={`/orders/${o.OrderId}`} className="text-lg font-bold text-primary-600 hover:underline">
                      #{o.OrderCode}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(o.CreatedAt)}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {paymentMethodLabel[o.PaymentMethod] || o.PaymentMethod}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paySt.color}`}>{paySt.label}</span>
                    <p className="text-xl font-black text-primary-600">{formatPrice(o.TotalAmount)}</p>
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  {o.items?.slice(0, 3).map((item) => (
                    <div key={item.OrderDetailId} className="flex items-center gap-3">
                      <img src={getImageUrl(item.ProductImage)} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.ProductName}</p>
                        <p className="text-xs text-slate-500">×{item.Quantity}</p>
                      </div>
                      <p className="text-sm font-bold">{formatPrice(item.Total)}</p>
                    </div>
                  ))}
                  {(o.items?.length || 0) > 3 && (
                    <p className="text-xs text-slate-500">+{o.items.length - 3} sản phẩm khác</p>
                  )}
                </div>

                <div className="border-t border-slate-200/80 px-5 py-4 dark:border-white/10">
                  <Link to={`/orders/${o.OrderId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
                    Xem chi tiết <ChevronRight size={16} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}
