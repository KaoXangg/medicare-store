import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { getImageUrl } from '../services/api';
import { formatPrice } from '../utils/format';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import ProtectedRoute from '../components/auth/ProtectedRoute';

function CartContent() {
  const { cart, fetchCart, updateQuantity, removeItem, loading } = useCart();
  const [initialLoad, setInitialLoad] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchCart().finally(() => setInitialLoad(false));
  }, [fetchCart]);

  const changeQty = async (cartId, nextQty) => {
    if (nextQty < 1) return;
    setUpdatingId(cartId);
    try {
      await updateQuantity(cartId, nextQty);
    } finally {
      setUpdatingId(null);
    }
  };

  if (initialLoad && loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-primary-600">Shopping Cart</p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Giỏ hàng</h1>
        </div>
        <motion.div
          layout
          className="hidden rounded-3xl bg-primary-50 px-5 py-3 text-sm font-bold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 sm:flex"
        >
          {cart.count || 0} sản phẩm
        </motion.div>
      </div>

      {!cart.items?.length ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="surface mx-auto max-w-xl rounded-[2rem] p-12 text-center"
        >
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            <ShoppingBag size={30} />
          </div>
          <p className="mb-5 text-slate-500">Giỏ hàng trống</p>
          <Link to="/products"><Button>Mua sắm ngay <ArrowRight size={18} /></Button></Link>
        </motion.div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <AnimatePresence mode="popLayout">
              {cart.items.map((item) => (
                <motion.div
                  key={item.CartId}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="surface flex gap-4 rounded-[1.75rem] p-4"
                >
                  <img src={getImageUrl(item.ImageUrl)} alt="" className="h-28 w-28 shrink-0 rounded-2xl object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link to={`/products/${item.Slug}`} className="font-black hover:text-primary-600 line-clamp-2">{item.Name}</Link>
                    <p className="mt-1 font-black text-primary-700">{formatPrice(item.effectivePrice)}</p>
                    <div className="mt-auto flex items-center gap-4 pt-3">
                      <div className="flex items-center rounded-2xl border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-950/40">
                        <button
                          type="button"
                          disabled={updatingId === item.CartId}
                          onClick={() => changeQty(item.CartId, item.Quantity - 1)}
                          className="p-2.5 disabled:opacity-50"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-9 text-center font-bold tabular-nums">{item.Quantity}</span>
                        <button
                          type="button"
                          disabled={updatingId === item.CartId}
                          onClick={() => changeQty(item.CartId, item.Quantity + 1)}
                          className="p-2.5 disabled:opacity-50"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.CartId)}
                        className="grid h-10 w-10 place-items-center rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 font-black">{formatPrice(item.subtotal)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <motion.div layout className="surface premium-glow sticky top-24 h-fit rounded-[2rem] p-6">
            <h3 className="mb-4 text-xl font-black">Tóm tắt đơn hàng</h3>
            <div className="mb-2 flex justify-between"><span>Tạm tính</span><span>{formatPrice(cart.total)}</span></div>
            <div className="mb-4 flex justify-between text-sm text-slate-500"><span>Phí ship</span><span>{cart.total >= 1000000 ? 'Miễn phí' : '30.000đ'}</span></div>
            <div className="flex justify-between border-t pt-4 text-lg font-black dark:border-slate-600">
              <span>Tổng</span>
              <span className="text-primary-600">{formatPrice(cart.total + (cart.total >= 1000000 ? 0 : 30000))}</span>
            </div>
            <Link to="/checkout" className="mt-6 block"><Button className="w-full">Thanh toán <ArrowRight size={18} /></Button></Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  return <ProtectedRoute><CartContent /></ProtectedRoute>;
}
