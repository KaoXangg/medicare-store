import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useAddToCart, useBuyNow } from '../hooks/useBuyNow';

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const productGridRef = useRef(null);
  const didLoadProductsRef = useRef(false);
  const buyNow = useBuyNow();
  const addToCartHandler = useAddToCart();
  const searchKey = params.toString();

  const filters = useMemo(() => {
    const current = new URLSearchParams(searchKey);
    return {
      search: current.get('search') || '',
      category: current.get('category') || '',
      brand: current.get('brand') || '',
      minPrice: current.get('minPrice') || '',
      maxPrice: current.get('maxPrice') || '',
      sort: current.get('sort') || 'newest',
      featured: current.get('featured') || '',
      popular: current.get('popular') || '',
      page: current.get('page') || '1',
    };
  }, [searchKey]);

  const [minPrice, setMinPrice] = useState(filters.minPrice);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);

  useEffect(() => {
    setMinPrice(filters.minPrice);
  }, [filters.minPrice]);

  useEffect(() => {
    setMaxPrice(filters.maxPrice);
  }, [filters.maxPrice]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
    api.get('/brands').then((r) => setBrands(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && q.set(k, v));
    api.get(`/products?${q}`).then((r) => {
      setProducts(r.data);
      setPagination(r.pagination);
    }).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    if (loading) return;
    if (!didLoadProductsRef.current) {
      didLoadProductsRef.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [loading, searchKey]);

  const updateFilter = (key, value) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value); else p.delete(key);
    // Sửa lỗi: Chỉ xóa 'page' nếu bộ lọc thay đổi không phải là chuyển trang
    if (key !== 'page') p.delete('page');
    setParams(p);
  };

  const clearFilters = () => {
    setParams(new URLSearchParams());
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters = filters.search || filters.category || filters.brand || filters.minPrice || filters.maxPrice || filters.sort !== 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Tiêu đề trang và Thống kê */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-indigo-400">
            Danh sách thiết bị y tế
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Khám phá các thiết bị y tế chính hãng chất lượng cao</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700/50">
          Tổng cộng: <span className="text-primary-600 dark:text-primary-400 font-bold">{pagination.total || 0}</span> sản phẩm
        </div>
      </div>

      {/* Bảng Bộ lọc Ngang Hiện đại */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700/60 mb-8 space-y-4">
        {/* Hàng 1: Tìm kiếm & Sắp xếp */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              key={filters.search}
              defaultValue={filters.search}
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateFilter('search', e.target.value);
              }}
              placeholder="Tìm kiếm tên sản phẩm y tế (Nhập từ khóa rồi bấm Enter)..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-sm placeholder-slate-400"
            />
          </div>
          <div className="w-full md:w-64">
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-sm font-semibold cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <option value="newest">Mới nhất</option>
              <option value="bestselling">Bán chạy nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* Hàng 2: Danh mục, Thương hiệu, Khoảng giá, Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          {/* Lọc theo Danh mục */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase px-1">Danh mục</label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.CategoryId} value={c.Slug}>{c.Name}</option>
              ))}
            </select>
          </div>

          {/* Lọc theo Thương hiệu */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase px-1">Thương hiệu</label>
            <select
              value={filters.brand}
              onChange={(e) => updateFilter('brand', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <option value="">Tất cả thương hiệu</option>
              {brands.map((b) => (
                <option key={b.BrandId} value={b.Slug}>{b.Name}</option>
              ))}
            </select>
          </div>

          {/* Lọc theo Khoảng giá */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase px-1">Khoảng giá (VNĐ)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Giá từ"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={() => updateFilter('minPrice', minPrice)}
                onKeyDown={(e) => e.key === 'Enter' && updateFilter('minPrice', minPrice)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm placeholder-slate-400"
              />
              <span className="text-slate-400 text-xs">—</span>
              <input
                type="number"
                placeholder="Giá đến"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={() => updateFilter('maxPrice', maxPrice)}
                onKeyDown={(e) => e.key === 'Enter' && updateFilter('maxPrice', maxPrice)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm placeholder-slate-400"
              />
            </div>
          </div>

          {/* Nút Xóa bộ lọc */}
          <div className="flex items-end">
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition duration-200 shadow-sm border border-slate-200/50 dark:border-slate-600/50 flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Xóa tất cả bộ lọc
              </button>
            ) : (
              <div className="w-full text-center text-xs text-slate-400 dark:text-slate-500 py-3 italic bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-100 dark:border-slate-700/30">
                Sử dụng các bộ lọc để tìm kiếm
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lưới sản phẩm rộng mở 4 cột */}
      <div ref={productGridRef} className="grid scroll-mt-24 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <ProductCardSkeleton key={i} />)
        ) : (
          products.map((p) => <ProductCard key={p.ProductId} product={p} onBuyNow={buyNow} onAddCart={addToCartHandler} />)
        )}
      </div>

      {/* Trạng thái không có sản phẩm */}
      {!loading && !products.length && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 mt-6">
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Không tìm thấy sản phẩm nào</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Vui lòng thử lại với các tiêu chí hoặc bộ lọc khác.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-xl shadow-md transition duration-200"
            >
              Reset bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Thanh Phân trang Hiện đại */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex justify-center overflow-x-auto border-t border-slate-100 pt-6 dark:border-slate-700/50">
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={() => updateFilter('page', String(Math.max(1, Number(filters.page) - 1)))}
            disabled={Number(filters.page) === 1}
            className="w-10 h-10 rounded-xl flex items-center justify-center font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition border border-slate-200/50 dark:border-slate-700/50"
          >
            &larr;
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateFilter('page', String(p))}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                Number(filters.page) === p
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20 scale-105'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => updateFilter('page', String(Math.min(pagination.totalPages, Number(filters.page) + 1)))}
            disabled={Number(filters.page) === pagination.totalPages}
            className="w-10 h-10 rounded-xl flex items-center justify-center font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition border border-slate-200/50 dark:border-slate-700/50"
          >
            &rarr;
          </button>
        </div>
        </div>
      )}
    </div>
  );
}

