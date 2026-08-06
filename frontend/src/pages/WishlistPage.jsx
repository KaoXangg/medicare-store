import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import api, { getImageUrl } from '../services/api';
import { formatPrice } from '../utils/format';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Button from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';

function WishlistContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refresh } = useWishlist();
  const { addToCart } = useCart();

  const load = () => {
    setLoading(true);
    api.get('/wishlist').then((r) => setItems(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((i) => i.ProductId !== productId));
      refresh();
      toast.success('Đã xóa khỏi yêu thích');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const addCart = async (item) => {
    try {
      await addToCart(item.ProductId, 1);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="mb-8 flex items-center gap-3">
        <Heart className="text-rose-500" fill="currentColor" />
        <div>
          <h1 className="text-3xl font-black">Danh sách yêu thích</h1>
          <p className="text-slate-500">{items.length} sản phẩm</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-white/5" />
          ))}
        </div>
      ) : !items.length ? (
        <div className="surface rounded-3xl p-12 text-center">
          <Heart className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <p className="text-slate-500">Chưa có sản phẩm yêu thích</p>
          <Link to="/products" className="mt-4 inline-block font-semibold text-primary-600">Khám phá sản phẩm →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.WishlistId} className="surface flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center">
              <Link to={`/products/${item.Slug}`} className="flex shrink-0 items-center gap-4">
                <img src={getImageUrl(item.PrimaryImage)} alt="" className="h-24 w-24 rounded-2xl object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/products/${item.Slug}`} className="font-bold hover:text-primary-600">{item.Name}</Link>
                <p className="mt-1 text-lg font-black text-primary-600">{formatPrice(item.effectivePrice ?? item.SalePrice ?? item.Price)}</p>
                <p className="text-sm text-slate-500">Còn {item.Stock} sản phẩm</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => addCart(item)} disabled={!item.Stock}>
                  <ShoppingCart size={16} /> Thêm giỏ
                </Button>
                <button type="button" onClick={() => remove(item.ProductId)} className="grid h-11 w-11 place-items-center rounded-xl bg-rose-100 text-rose-600">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <WishlistContent />
    </ProtectedRoute>
  );
}
