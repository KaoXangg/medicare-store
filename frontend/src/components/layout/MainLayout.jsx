import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import CinematicCursor from './CinematicCursor';
import MobileBottomNav from './MobileBottomNav';
import usePageViewTracker from '../../hooks/usePageViewTracker';

export default function MainLayout() {
  const { user } = useAuth();
  const { fetchCart } = useCart();
  usePageViewTracker();

  useEffect(() => {
    if (user) fetchCart();
  }, [user, fetchCart]);

  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden">
      <CinematicCursor />
      <Header />
      <main className="page-enter w-full max-w-[100vw] flex-1 overflow-x-hidden pt-14 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:pt-16 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}