export const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export const orderStatusLabel = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300' },
  shipping: { label: 'Đang giao', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800 dark:bg-rose-500/15 dark:text-rose-300' },
};

export const paymentMethodLabel = {
  cod: 'Thanh toán khi nhận (COD)',
  online: 'Thanh toán online',
  vnpay: 'VNPay',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
  visa: 'Visa',
  mastercard: 'Mastercard',
  jcb: 'JCB',
  banking: 'Chuyển khoản ngân hàng',
  stripe: 'Thẻ quốc tế',
};

export const paymentStatusLabel = {
  unpaid: { label: 'Chưa thanh toán', color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  paid: { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
  refunded: { label: 'Đã hoàn tiền', color: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300' },
  pending: { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  completed: { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
};

export const getOrderPaymentInfo = (order) => {
  const method = order?.PaymentMethod;
  const provider = order?.PaymentProvider;
  if (method === 'cod') {
    return { type: 'cod', typeLabel: 'Thanh toán khi nhận hàng (COD)', provider: null, providerLabel: null };
  }
  if (method === 'online') {
    return {
      type: 'online',
      typeLabel: 'Thanh toán Online',
      provider,
      providerLabel: provider ? (paymentMethodLabel[provider] || provider) : 'Cổng thanh toán',
    };
  }
  return { type: method || '—', typeLabel: paymentMethodLabel[method] || '—', provider: null, providerLabel: '—' };
};
