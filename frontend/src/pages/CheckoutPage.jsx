import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Smartphone,
  Truck,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';

import api, { getImageUrl } from '../services/api';
import { formatPrice } from '../utils/format';
import { trackEvent } from '../services/activityTracker';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const STEPS = [
  { id: 1, label: 'Thông tin giao hàng', shortLabel: 'Giao hàng', icon: MapPin },
  { id: 2, label: 'Thanh toán', shortLabel: 'Thanh toán', icon: CreditCard },
  { id: 3, label: 'Xác nhận', shortLabel: 'Xác nhận', icon: Check },
];

const PAYMENT_OPTIONS = [
  {
    id: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    desc: 'Thanh toán tiền mặt khi nhận hàng',
    icon: Truck,
    badge: 'COD',
    color: 'bg-emerald-500',
    method: 'cod',
    provider: null,
  },
  {
    id: 'vnpay',
    label: 'VNPay',
    desc: 'Thẻ ATM nội địa, Visa, QR VNPay',
    icon: CreditCard,
    badge: 'VNPay',
    color: 'bg-[#0066b3]',
    method: 'online',
    provider: 'vnpay',
  },
  {
    id: 'momo',
    label: 'MoMo',
    desc: 'Ví điện tử MoMo',
    icon: Smartphone,
    badge: 'MoMo',
    color: 'bg-[#a50064]',
    method: 'online',
    provider: 'momo',
  },
  {
    id: 'zalopay',
    label: 'ZaloPay',
    desc: 'Ví ZaloPay — quét mã thanh toán',
    icon: Smartphone,
    badge: 'ZaloPay',
    color: 'bg-[#0068ff]',
    method: 'online',
    provider: 'zalopay',
  },
  {
    id: 'visa',
    label: 'Visa',
    desc: 'Thẻ tín dụng / ghi nợ Visa (giả lập)',
    icon: CreditCard,
    badge: 'VISA',
    color: 'bg-[#1a1f71]',
    method: 'online',
    provider: 'visa',
  },
  {
    id: 'mastercard',
    label: 'Mastercard',
    desc: 'Thẻ quốc tế Mastercard (giả lập)',
    icon: CreditCard,
    badge: 'MC',
    color: 'bg-[#eb001b]',
    method: 'online',
    provider: 'mastercard',
  },
  {
    id: 'jcb',
    label: 'JCB',
    desc: 'Thẻ JCB (giả lập)',
    icon: CreditCard,
    badge: 'JCB',
    color: 'bg-[#0b4ea2]',
    method: 'online',
    provider: 'jcb',
  },
  {
    id: 'banking',
    label: 'Chuyển khoản ngân hàng',
    desc: 'Vietcombank, Techcombank, BIDV… (giả lập)',
    icon: Wallet,
    badge: 'Bank',
    color: 'bg-slate-700',
    method: 'online',
    provider: 'banking',
  },
];

function CheckoutContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cart, fetchCart } = useCart();

  // Sản phẩm đến từ nút "Mua ngay" (không đi qua giỏ hàng)
  const buyNowItem = location.state?.buyNowItem || null;
  const buyNowProduct = buyNowItem?.product;
  const buyNowStock = Math.max(1, Number(buyNowProduct?.Stock) || 1);
  const buyNowPrice = buyNowProduct
    ? buyNowProduct.effectivePrice ?? buyNowProduct.SalePrice ?? buyNowProduct.Price
    : 0;

  // Số lượng có thể chỉnh ngay tại Checkout, không vượt quá số lượng tồn kho
  const [buyNowQty, setBuyNowQty] = useState(() =>
    Math.min(Math.max(1, buyNowItem?.qty || 1), buyNowStock)
  );

  const decreaseBuyNowQty = () => setBuyNowQty((q) => Math.max(1, q - 1));
  const increaseBuyNowQty = () => setBuyNowQty((q) => Math.min(buyNowStock, q + 1));

  // Ảnh sản phẩm: "images" có thể là mảng chuỗi (từ trang danh sách)
  // hoặc mảng object { ImageUrl } (từ trang chi tiết sản phẩm) — xử lý cả 2 kiểu
  const firstImage = buyNowProduct?.images?.[0];
  const buyNowImg =
    buyNowProduct?.primaryImage ||
    (typeof firstImage === 'string' ? firstImage : firstImage?.ImageUrl) ||
    null;

  // Danh sách sản phẩm để hiển thị + tính tiền: ưu tiên buyNowItem, nếu không có thì lấy từ giỏ hàng
  const displayItems = buyNowItem
    ? [
        {
          CartId: 'buy-now',
          ImageUrl: buyNowImg,
          Name: buyNowProduct?.Name,
          Quantity: buyNowQty,
          subtotal: buyNowPrice * buyNowQty,
        },
      ]
    : cart.items || [];

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentId, setPaymentId] = useState('cod');

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    note: '',
  });

  useEffect(() => {
    // Không cần tải giỏ hàng khi đang thanh toán "Mua ngay" riêng lẻ
    if (!buyNowItem) fetchCart();
  }, [fetchCart, buyNowItem]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        customerName: user.FullName || '',
        customerPhone: user.Phone || '',
        customerEmail: user.Email || '',
        shippingAddress: user.Address || '',
      }));
    }
  }, [user]);

  const subtotal = buyNowItem ? buyNowPrice * buyNowQty : cart.total || 0;
  const shippingFee = subtotal >= 1000000 ? 0 : 30000;
  const total = Math.max(0, subtotal - couponDiscount + shippingFee);

  const selectedPayment = PAYMENT_OPTIONS.find((p) => p.id === paymentId) || PAYMENT_OPTIONS[0];

  const canNextStep1 =
    form.customerName.trim() &&
    form.customerPhone.trim() &&
    form.customerEmail.trim() &&
    form.shippingAddress.trim();

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode.trim(),
        subtotal,
      });
      setCouponDiscount(res.data.discountAmount || 0);
      toast.success(res.message || 'Áp dụng mã giảm giá thành công');
    } catch (e) {
      setCouponDiscount(0);
      toast.error(e.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const placeOrder = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        ...form,
        paymentMethod: selectedPayment.method,
        paymentProvider: selectedPayment.provider,
        couponCode: couponCode.trim() || undefined,
        // Khi đặt hàng qua "Mua ngay", gửi kèm sản phẩm cụ thể
        // thay vì để backend lấy từ giỏ hàng.
        ...(buyNowItem
          ? { items: [{ productId: buyNowItem.productId, quantity: buyNowQty }] }
          : {}),
      });

      const order = res.data?.order;

      trackEvent('order_placed', {
        orderId: order?.OrderId,
        total: order?.FinalTotal ?? order?.Total ?? total,
      });

      if (selectedPayment.method === 'online' && order?.OrderId) {
        await api.post(`/orders/${order.OrderId}/pay`, {
          provider: selectedPayment.provider,
        });
        toast.success(`Thanh toán ${selectedPayment.label} thành công (demo)`);
      } else {
        toast.success('Đặt hàng thành công!');
      }

      if (!buyNowItem) await fetchCart();
      navigate(`/orders/${order?.OrderId}`);
    } catch (e) {
      toast.error(e.message || 'Không thể đặt hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const stepSummary = useMemo(
    () => ({
      items: displayItems.length,
      subtotal,
      shippingFee,
      couponDiscount,
      total,
    }),
    [displayItems, subtotal, shippingFee, couponDiscount, total]
  );

  if (!buyNowItem && !cart.items?.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Package className="mx-auto mb-4 h-14 w-14 text-slate-300" />
        <h1 className="text-2xl font-bold">Giỏ hàng trống</h1>
        <p className="mt-2 text-slate-500">Thêm sản phẩm trước khi thanh toán</p>
        <Link to="/products" className="mt-6 inline-block">
          <Button>Mua sắm ngay</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:py-12">
      <Link
        to={buyNowItem ? `/products/${buyNowProduct?.Slug || ''}` : '/cart'}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:opacity-80"
      >
        <ArrowLeft size={16} />
        {buyNowItem ? 'Quay lại sản phẩm' : 'Quay lại giỏ hàng'}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl md:text-4xl">
        Thanh toán
      </h1>
      <p className="mt-1 text-sm text-slate-500 sm:text-base">Hoàn tất đơn hàng trong 3 bước đơn giản</p>

      {/* Step indicator — căn đều 3 cột trên mobile */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3 md:gap-4">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => s.id < step && setStep(s.id)}
              disabled={s.id > step}
              className={`flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1.5 py-2.5 text-center transition sm:px-3 sm:py-3 md:flex-row md:gap-2 md:px-4 md:text-left ${
                active
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                  : done
                    ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                    : 'border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-white/5'
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl sm:h-9 sm:w-9 ${
                  active
                    ? 'bg-primary-600 text-white'
                    : done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-white/10'
                }`}
              >
                {done ? <Check size={16} /> : <Icon size={16} />}
              </span>
              <span className="w-full truncate text-[10px] font-semibold leading-tight sm:text-[11px] md:hidden">
                {s.shortLabel}
              </span>
              <span className="hidden text-sm font-semibold md:block">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-3 lg:gap-8">
        {/* Tóm tắt đơn — hiện trước trên mobile */}
        <div className="order-1 lg:order-2 lg:col-span-1">
          <div className="surface premium-glow rounded-3xl p-4 sm:p-6 lg:sticky lg:top-24">
            <h3 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">Đơn hàng ({stepSummary.items} SP)</h3>
            <div className="mb-4 max-h-48 space-y-3 overflow-y-auto sm:max-h-64">
              {displayItems.map((item) => (
                <div key={item.CartId} className="flex items-center gap-3">
                  <img
                    src={getImageUrl(item.ImageUrl)}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-xl object-cover sm:h-14 sm:w-14"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{item.Name}</p>
                    {item.CartId === 'buy-now' ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
                          <button
                            type="button"
                            onClick={decreaseBuyNowQty}
                            disabled={buyNowQty <= 1}
                            className="flex h-7 w-7 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 dark:hover:bg-white/5 dark:hover:text-white"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-800 dark:text-white select-none">
                            {buyNowQty}
                          </span>
                          <button
                            type="button"
                            onClick={increaseBuyNowQty}
                            disabled={buyNowQty >= buyNowStock}
                            className="flex h-7 w-7 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 dark:hover:bg-white/5 dark:hover:text-white"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400">Tối đa {buyNowStock}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">x{item.Quantity}</p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t pt-3 text-sm dark:border-white/10 sm:pt-4">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Tạm tính</span>
                <span className="font-medium">{formatPrice(stepSummary.subtotal)}</span>
              </div>
              {stepSummary.couponDiscount > 0 && (
                <div className="flex justify-between gap-2 text-emerald-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(stepSummary.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Phí vận chuyển</span>
                <span className="font-medium">
                  {stepSummary.shippingFee ? formatPrice(stepSummary.shippingFee) : 'Miễn phí'}
                </span>
              </div>
              <div className="flex justify-between gap-2 border-t border-slate-200/80 pt-2 text-base font-bold dark:border-white/10 sm:text-lg">
                <span>Tổng cộng</span>
                <span className="text-primary-600">{formatPrice(stepSummary.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="order-2 min-w-0 lg:order-1 lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="surface space-y-4 rounded-3xl p-4 sm:p-6"
              >
                <h2 className="text-lg font-bold sm:text-xl">Thông tin giao hàng</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Họ và tên"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    required
                  />
                  <Input
                    label="Số điện thoại"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  required
                />
                <Input
                  label="Địa chỉ giao hàng"
                  value={form.shippingAddress}
                  onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                  required
                />
                <Input
                  label="Ghi chú (tuỳ chọn)"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
                <div className="flex justify-end pt-2">
                  <Button disabled={!canNextStep1} onClick={() => setStep(2)} className="w-full sm:w-auto">
                    Tiếp tục
                    <ArrowRight size={18} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="space-y-4"
              >
                <div className="surface rounded-3xl p-4 sm:p-6">
                  <h2 className="mb-3 text-lg font-bold sm:mb-4 sm:text-xl">Phương thức thanh toán</h2>
                  <div className="max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto pr-0.5 sm:max-h-none sm:space-y-3 sm:overflow-visible">
                    {PAYMENT_OPTIONS.map((opt) => {
                      const selected = paymentId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPaymentId(opt.id)}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition sm:gap-4 sm:p-4 ${
                            selected
                              ? 'border-primary-500 bg-primary-50/80 ring-2 ring-primary-500/20 dark:bg-primary-500/10'
                              : 'border-slate-200/80 hover:border-primary-300 dark:border-white/10'
                          }`}
                        >
                          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[10px] font-black text-white shadow-sm sm:h-11 sm:w-11 sm:text-xs ${opt.color}`}>
                            {opt.badge}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-snug sm:text-base">{opt.label}</p>
                            <p className="text-xs text-slate-500 sm:text-sm">{opt.desc}</p>
                          </div>
                          {selected && (
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-600 text-white">
                              <Check size={14} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="surface rounded-3xl p-4 sm:p-6">
                  <h3 className="font-bold mb-3">Mã giảm giá</h3>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã voucher"
                      className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-950/60 outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
                    <Button variant="secondary" onClick={applyCoupon} loading={couponLoading} className="w-full sm:w-auto shrink-0">
                      Áp dụng
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-3">
                  <Button variant="secondary" onClick={() => setStep(1)} className="w-full sm:w-auto">
                    <ArrowLeft size={18} />
                    Quay lại
                  </Button>
                  <Button onClick={() => setStep(3)} className="w-full sm:w-auto">
                    Xem lại đơn
                    <ArrowRight size={18} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="surface space-y-5 rounded-3xl p-4 sm:p-6"
              >
                <h2 className="text-lg font-bold sm:text-xl">Xác nhận đơn hàng</h2>

                <div className="rounded-2xl bg-slate-50/80 p-4 text-sm dark:bg-white/[0.03] space-y-2">
                  <p>
                    <span className="text-slate-500">Người nhận:</span>{' '}
                    <strong>{form.customerName}</strong> · {form.customerPhone}
                  </p>
                  <p>
                    <span className="text-slate-500">Email:</span> {form.customerEmail}
                  </p>
                  <p>
                    <span className="text-slate-500">Địa chỉ:</span> {form.shippingAddress}
                  </p>
                  <p>
                    <span className="text-slate-500">Thanh toán:</span> {selectedPayment.label}
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <ShieldCheck className="shrink-0 text-emerald-600" size={20} />
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">
                    Thông tin của bạn được bảo mật. Đơn hàng sẽ được xác nhận trong 24h.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-3">
                  <Button variant="secondary" onClick={() => setStep(2)} className="w-full sm:w-auto">
                    <ArrowLeft size={18} />
                    Quay lại
                  </Button>
                  <Button onClick={placeOrder} loading={submitting} className="w-full sm:w-auto">
                    Đặt hàng · {formatPrice(total)}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}