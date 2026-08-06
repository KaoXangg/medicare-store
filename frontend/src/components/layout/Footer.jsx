import { Link } from 'react-router-dom';
import { HeartPulse, Phone, Mail, MapPin, Share2, Video } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-slate-950 text-slate-300 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/70 to-transparent" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-500/15 text-primary-300">
              <HeartPulse size={22} />
            </span>
            MediCare Store
          </div>
          <p className="text-sm leading-relaxed">Thiết bị y tế chính hãng — Cam kết chất lượng — Giao hàng toàn quốc — Hỗ trợ 24/7.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Danh mục</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products?category=may-do-huyet-ap" className="hover:text-primary-300 transition">Máy đo huyết áp</Link></li>
            <li><Link to="/products?category=may-do-duong-huyet" className="hover:text-primary-300 transition">Máy đo đường huyết</Link></li>
            <li><Link to="/products?category=khau-trang-y-te" className="hover:text-primary-300 transition">Khẩu trang y tế</Link></li>
            <li><Link to="/products" className="hover:text-primary-300 transition">Tất cả sản phẩm</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-primary-300 transition">Giới thiệu</Link></li>
            <li><Link to="/contact" className="hover:text-primary-300 transition">Liên hệ</Link></li>
            <li><Link to="/return-policy" className="hover:text-primary-300 transition">Chính sách đổi trả</Link></li>
            <li><Link to="/warranty" className="hover:text-primary-300 transition">Bảo hành</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><MapPin size={16} className="text-primary-400" /> 123 Nguyễn Huệ, Q1, TP.HCM</li>
            <li className="flex items-center gap-2"><Phone size={16} className="text-primary-400" /> 1900 1234</li>
            <li className="flex items-center gap-2"><Mail size={16} className="text-primary-400" /> support@medicarestore.com</li>
          </ul>
          <div className="flex gap-3 mt-4">
            <a href="#" className="p-2 bg-white/5 rounded-xl hover:bg-primary-600 transition"><Share2 size={18} /></a>
            <a href="#" className="p-2 bg-white/5 rounded-xl hover:bg-primary-600 transition"><Video size={18} /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-sm">
        © {new Date().getFullYear()} MediCare Store. All rights reserved.
      </div>
    </footer>
  );
}