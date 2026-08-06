import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

const statusConfig = {
  pending: { label: 'Chờ xác nhận', icon: Clock, color: 'amber', dot: 'bg-amber-500' },
  confirmed: { label: 'Đã xác nhận', icon: CheckCircle, color: 'blue', dot: 'bg-blue-500' },
  shipping: { label: 'Đang giao', icon: CheckCircle, color: 'violet', dot: 'bg-violet-500' },
  completed: { label: 'Hoàn thành', icon: CheckCircle, color: 'emerald', dot: 'bg-emerald-500' },
  cancelled: { label: 'Đã hủy', icon: AlertCircle, color: 'red', dot: 'bg-red-500' },
};

const statuses = ['pending', 'confirmed', 'shipping', 'completed'];

export default function OrderTimeline({ currentStatus }) {
  const isCancelled = currentStatus === 'cancelled';
  const idx = statuses.indexOf(currentStatus);
  const currentIndex = idx >= 0 ? idx : 0;

  return (
    <div className="py-4 mb-6">
      {isCancelled && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">Đơn hàng đã bị hủy</p>
        </div>
      )}
      <div className="flex items-start justify-between relative">
        {statuses.map((status, index) => {
          const config = statusConfig[status];
          const isComplete = !isCancelled && index < currentIndex;
          const isCurrent = !isCancelled && index === currentIndex;

          const dotClass = isCurrent
            ? `border-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-500/10`
            : isComplete
            ? `border-${config.color}-500 bg-${config.color}-500`
            : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800';

          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center flex-1"
            >
              {/* Dot */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-3 transition-all ${dotClass}`}
              >
                {isComplete ? (
                  <CheckCircle className={`w-6 h-6 text-white`} />
                ) : isCurrent ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                    <Clock className={`w-6 h-6 text-${config.color}-600 dark:text-${config.color}-400`} />
                  </motion.div>
                ) : (
                  <Circle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                )}
              </motion.div>

              {/* Label */}
              <p className={`text-xs font-semibold whitespace-nowrap ${
                isCurrent || isComplete
                  ? `text-${config.color}-600 dark:text-${config.color}-400`
                  : 'text-slate-400 dark:text-slate-500'
              }`}>
                {config.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
