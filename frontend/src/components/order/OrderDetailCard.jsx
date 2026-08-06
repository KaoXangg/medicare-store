import { getImageUrl } from '../../services/api';
import { formatPrice, formatDate, orderStatusLabel } from '../../utils/format';

const paymentMethodLabel = { cod: 'COD (thanh toán khi nhận)', online: 'Thanh toán online' };
const paymentStatusLabel = { unpaid: 'Chưa thanh toán', paid: 'Đã thanh toán', refunded: 'Đã hoàn tiền' };

export default function OrderDetailCard({ order, showCustomer = true }) {
  if (!order) return null;
  const st = orderStatusLabel[order.Status] || orderStatusLabel.pending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">#{order.OrderCode}</h3>
          <p className="text-sm text-slate-500">{formatDate(order.CreatedAt)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium h-fit ${st.color}`}>{st.label}</span>
      </div>

      {showCustomer && (
        <div className="grid sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Khách hàng</p>
            <p className="font-medium">{order.CustomerName}</p>
            <p>{order.CustomerPhone}</p>
            <p className="text-slate-600">{order.CustomerEmail}</p>
            {order.UserName && order.UserName !== order.CustomerName && (
              <p className="text-xs text-slate-500 mt-1">Tài khoản: {order.UserName} ({order.Email || order.UserEmail})</p>
            )}
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Giao hàng & thanh toán</p>
            <p>{order.ShippingAddress}</p>
            <p className="mt-2">
              <span className="font-medium">{paymentMethodLabel[order.PaymentMethod] || order.PaymentMethod}</span>
              {' — '}
              {paymentStatusLabel[order.PaymentStatus] || order.PaymentStatus}
            </p>
            {order.Note && <p className="mt-2 text-slate-600"><em>Ghi chú:</em> {order.Note}</p>}
          </div>
        </div>
      )}

      <div>
        <p className="font-semibold mb-3">Sản phẩm đã mua ({order.items?.length || 0})</p>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div
              key={item.OrderDetailId}
              className="flex gap-4 p-3 border dark:border-slate-700 rounded-xl"
            >
              <img
                src={getImageUrl(item.ProductImage)}
                alt=""
                className="w-20 h-20 object-cover rounded-lg shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{item.ProductName}</p>
                <p className="text-sm text-slate-500 mt-1">
                  Đơn giá: {formatPrice(item.Price)} × {item.Quantity}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary-600">{formatPrice(item.Total)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t dark:border-slate-700 pt-4 space-y-2 text-sm max-w-sm ml-auto">
        <div className="flex justify-between">
          <span className="text-slate-500">Tạm tính</span>
          <span>{formatPrice(order.SubTotal)}</span>
        </div>
        {order.DiscountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Giảm giá</span>
            <span>-{formatPrice(order.DiscountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-500">Phí vận chuyển</span>
          <span>{order.ShippingFee > 0 ? formatPrice(order.ShippingFee) : 'Miễn phí'}</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-slate-600">
          <span>Tổng thanh toán</span>
          <span className="text-primary-600">{formatPrice(order.TotalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
