import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import { PageSkeleton } from './components/ui/Skeleton';
import CreateProduct from './pages/admin/product/CreateProduct';
import EditProduct from './pages/admin/product/EditProduct';
import CreateCategories from './pages/admin/categories/CreateCategories';
import EditCategories from './pages/admin/categories/EditCategories';

const AdminBrands = lazy(() => import('./pages/admin/AdminBrands'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ReturnPolicyPage = lazy(() => import('./pages/ReturnPolicyPage'));
const WarrantyPage = lazy(() => import('./pages/WarrantyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminContacts = lazy(() => import('./pages/admin/AdminContacts'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AdminFlashSale = lazy(() => import('./pages/admin/AdminFlashSale'));
const AdminActivityLog = lazy(() => import('./pages/admin/AdminActivityLog'));
const AdminWarranties = lazy(() => import('./pages/admin/AdminWarranties'));
const AdminWarrantyForm = lazy(() => import('./pages/admin/AdminWarrantyForm'));

function LazyPage({ children }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

export default function App() {
  useEffect(() => {
    AOS.init({ duration: 650, easing: 'ease-out-cubic', once: true, offset: 80 });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Toaster position="top-right" toastOptions={{ duration: 3000, className: 'surface soft-ring', style: { borderRadius: '16px' } }} />
              <Routes>
                <Route element={<MainLayout />}>
                  <Route index element={<LazyPage><HomePage /></LazyPage>} />
                  <Route path="products" element={<LazyPage><ProductsPage /></LazyPage>} />
                  <Route path="products/:slug" element={<LazyPage><ProductDetailPage /></LazyPage>} />
                  <Route path="cart" element={<LazyPage><CartPage /></LazyPage>} />
                  <Route path="checkout" element={<LazyPage><CheckoutPage /></LazyPage>} />
                  <Route path="login" element={<LazyPage><LoginPage /></LazyPage>} />
                  <Route path="register" element={<LazyPage><RegisterPage /></LazyPage>} />
                  <Route path="forgot-password" element={<LazyPage><ForgotPasswordPage /></LazyPage>} />
                  <Route path="reset-password" element={<LazyPage><ResetPasswordPage /></LazyPage>} />
                  <Route path="profile" element={<LazyPage><ProfilePage /></LazyPage>} />
                  <Route path="orders" element={<LazyPage><OrdersPage /></LazyPage>} />
                  <Route path="orders/:id" element={<LazyPage><OrderDetailPage /></LazyPage>} />
                  <Route path="about" element={<LazyPage><AboutPage /></LazyPage>} />
                  <Route path="contact" element={<LazyPage><ContactPage /></LazyPage>} />
                  <Route path="return-policy" element={<LazyPage><ReturnPolicyPage /></LazyPage>} />
                  <Route path="warranty" element={<LazyPage><WarrantyPage /></LazyPage>} />
                  <Route path="wishlist" element={<LazyPage><WishlistPage /></LazyPage>} />
                  <Route path="terms" element={<LazyPage><TermsPage /></LazyPage>} />
                  <Route path="privacy" element={<LazyPage><PrivacyPage /></LazyPage>} />
                </Route>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<LazyPage><AdminDashboard /></LazyPage>} />
                  <Route path="products" element={<LazyPage><AdminProducts /></LazyPage>} />
                  <Route path="categories" element={<LazyPage><AdminCategories /></LazyPage>} />
                  <Route path="orders" element={<LazyPage><AdminOrders /></LazyPage>} />
                  <Route path="orders/:id" element={<LazyPage><AdminOrderDetail /></LazyPage>} />
                  <Route path="users" element={<LazyPage><AdminUsers /></LazyPage>} />
                  <Route path="users/:id" element={<LazyPage><AdminUserDetail /></LazyPage>} />
                  <Route path="reviews" element={<LazyPage><AdminReviews /></LazyPage>} />
                  <Route path="contacts" element={<LazyPage><AdminContacts /></LazyPage>} />
                  <Route path="coupons" element={<LazyPage><AdminCoupons /></LazyPage>} />
                  <Route path="products/create" element={<CreateProduct />} />
                  <Route path="products/edit/:id" element={<EditProduct />} />
                  <Route path="categories/create" element={<CreateCategories />} />
                  <Route path="categories/edit/:id" element={<EditCategories />} />
                  <Route path="brands" element={<LazyPage><AdminBrands /></LazyPage>} />
                  <Route path="flash-sale" element={<LazyPage><AdminFlashSale /></LazyPage>} />
                  <Route path="activity" element={<LazyPage><AdminActivityLog /></LazyPage>} />
                  <Route path="warranties" element={<LazyPage><AdminWarranties /></LazyPage>} />
                  <Route path="warranties/create" element={<LazyPage><AdminWarrantyForm /></LazyPage>} />
                  <Route path="warranties/edit/:id" element={<LazyPage><AdminWarrantyForm /></LazyPage>} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}