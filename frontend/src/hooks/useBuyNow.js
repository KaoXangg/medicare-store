import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function useBuyNow() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return async (product, qty = 1) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      navigate('/login');
      return;
    }
    if (Number(product.Stock) <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }
    // Không thêm vào giỏ hàng — chỉ chuyển sang trang thanh toán
    // kèm thông tin sản phẩm để thanh toán riêng, tránh việc lỡ tay
    // bấm "Mua ngay" lại vô tình thêm sản phẩm vào giỏ.
    navigate('/checkout', { state: { buyNowItem: { productId: product.ProductId, qty, product } } });
  };
}

export function useAddToCart() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  return async (product, qty = 1) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      navigate('/login');
      return;
    }
    if (Number(product.Stock) <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }
    try {
      await addToCart(product.ProductId, qty);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (e) {
      toast.error(e.message);
    }
  };
}