import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

const STEPS = [
  { key: 'pending', label: 'Chờ xác nhận', icon: Clock },
  { key: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle },
  { key: 'shipping', label: 'Đang giao', icon: CheckCircle },
  { key: 'completed', label: 'Hoàn thành', icon: CheckCircle },
];

const dotStyles = {
  pending: 'border-amber-500 bg-amber-50 dark:bg-amber-500/10',
  confirmed: 'border-sky-500 bg-sky-50 dark:bg-sky-500/10',
  shipping: 'border-violet-500 bg-violet-50 dark:bg-violet-500/10',
  completed: 'border-emerald-500 bg-emerald-500',
  done: 'border-emerald-500 bg-emerald-500',
  idle: 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800',
};

const labelStyles = {
  pending: 'text-amber-600 dark:text-amber-400',
  confirmed: 'text-sky-600 dark:text-sky-400',
  shipping: 'text-violet-600 dark:text-violet-400',
  completed: 'text-emerald-600 dark:text-emerald-400',
  idle: 'text-slate-400 dark:text-slate-500',
};

export default function OrderTimeline({ currentStatus }) {
  const isCancelled = currentStatus === 'cancelled';
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="py-2">
      {isCancelled && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Đơn hàng đã bị hủy</p>
        </div>
      )}

      <div className="relative flex items-start justify-between">
        <div className="absolute left-0 right-0 top-6 h-0.5 bg-slate-200 dark:bg-white/10 -z-0 hidden sm:block" />
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isComplete = !isCancelled && index < currentIndex;
          const isCurrent = !isCancelled && index === currentIndex;
          const dotKey = isComplete ? 'done' : isCurrent ? step.key : 'idle';
          const labelKey = isComplete || isCurrent ? step.key : 'idle';

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="relative z-10 flex flex-1 flex-col items-center px-1"
            >
              <div
                className={`mb-2 grid h-12 w-12 place-items-center rounded-full border-2 transition ${dotStyles[dotKey]}`}
              >
                {isComplete ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : isCurrent ? (
                  <Clock className={`h-6 w-6 ${labelStyles[step.key]}`} />
                ) : (
                  <Circle className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <p className={`text-center text-xs font-semibold leading-tight ${labelStyles[labelKey]}`}>
                {step.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
