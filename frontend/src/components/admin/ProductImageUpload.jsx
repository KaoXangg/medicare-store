import { useEffect, useRef, useState } from 'react';
import { ImageIcon, X } from 'lucide-react';

export default function ProductImageUpload({ files, onChange, label = 'Upload ảnh từ máy' }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const handleFiles = (fileList) => {
    const picked = Array.from(fileList || []);
    if (!picked.length) return;
    onChange(picked);
  };

  const removeAt = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <p className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>

      <div className="relative min-h-[9rem] overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 transition hover:border-sky-400 dark:border-slate-600 dark:bg-slate-900/40">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="pointer-events-none flex flex-col items-center justify-center px-4 py-8 text-center">
          <ImageIcon size={32} className="mb-2 text-slate-400" />
          <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
            {files.length ? `Đã chọn ${files.length} ảnh — chạm để đổi` : 'Chạm để chọn ảnh từ máy'}
          </p>
          <p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP · tối đa 5 ảnh, mỗi ảnh 5MB</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={`${src}-${i}`} className="relative">
              <img
                src={src}
                alt=""
                className="h-20 w-20 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-white shadow"
                aria-label="Xóa ảnh"
              >
                <X size={12} />
              </button>
              <p className="mt-0.5 max-w-[5rem] truncate text-[10px] text-slate-500">{files[i]?.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
