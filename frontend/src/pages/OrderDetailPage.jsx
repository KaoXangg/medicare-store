import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import api from '../services/api';
import OrderDetailCard from '../components/order/OrderDetailCard';
import OrderTimeline from '../components/order/OrderTimeline';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Button from '../components/ui/Button';

function OrderDetailContent() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/my/${id}`).then((r) => setOrder(r.data));
  }, [id]);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-white/5" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link to="/orders" className="text-sm font-medium text-primary-600 hover:opacity-80">
          ← Quay lại đơn hàng
        </Link>
        <Button variant="secondary" onClick={() => window.print()} className="rounded-2xl print:hidden">
          <Printer size={16} />
          In hóa đơn
        </Button>
      </div>

      <div className="surface rounded-3xl p-6 print:shadow-none print:border-none">
        <h1 className="mb-6 text-2xl font-bold print:text-black">Chi tiết đơn hàng</h1>
        <OrderTimeline currentStatus={order.Status} />
        <OrderDetailCard order={order} showCustomer />
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <ProtectedRoute>
      <OrderDetailContent />
    </ProtectedRoute>
  );
}
