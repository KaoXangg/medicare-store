import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import Button from './Button';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc muốn thực hiện? Hành động này không thể hoàn tác.',
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy bỏ',
  loading = false,
  variant = 'danger',
  children,
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-7 shadow-2xl dark:border-slate-700/60 dark:bg-slate-900">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-500/15">
          <Trash2 size={26} className="text-red-600 dark:text-red-400" />
        </div>
        <h3 className="mb-2 text-xl font-black text-slate-900 dark:text-white">{title}</h3>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{message}</p>
        {children && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
            {children}
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {cancelLabel}
          </button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
            className="h-11 flex-1 rounded-xl"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
