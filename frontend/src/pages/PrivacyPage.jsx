import { ShieldCheck } from 'lucide-react';
import LegalDocLayout from '../components/layout/LegalDocLayout';

const SECTIONS = [
  {
    id: 'thu-thap',
    number: '01',
    title: 'Thông tin thu thập',
    navLabel: 'Thông tin thu thập',
    body: 'MediCare Store thu thập họ tên, email, số điện thoại, ngày sinh, địa chỉ giao hàng và (tuỳ chọn) số CCCD/CMND để xác thực tài khoản, xử lý đơn hàng và hỗ trợ chăm sóc khách hàng.',
  },
  {
    id: 'muc-dich',
    number: '02',
    title: 'Mục đích sử dụng',
    navLabel: 'Mục đích sử dụng',
    body: 'Thông tin được sử dụng để: xác thực đăng nhập, xử lý và giao đơn hàng, gửi thông báo trạng thái đơn hàng, cải thiện trải nghiệm sản phẩm và hỗ trợ khi có yêu cầu từ khách hàng.',
  },
  {
    id: 'bao-mat',
    number: '03',
    title: 'Bảo mật dữ liệu',
    navLabel: 'Bảo mật dữ liệu',
    body: 'Mật khẩu được mã hoá bằng thuật toán băm một chiều, không lưu trữ dạng plain text. Toàn bộ giao dịch được truyền qua kết nối SSL/TLS. Hệ thống áp dụng xác thực JWT và giới hạn tần suất truy cập (rate limiting) để phòng chống tấn công.',
  },
  {
    id: 'chia-se',
    number: '04',
    title: 'Chia sẻ thông tin với bên thứ ba',
    navLabel: 'Chia sẻ với bên thứ ba',
    body: 'Chúng tôi không bán hoặc cho thuê dữ liệu cá nhân. Thông tin chỉ được chia sẻ với đơn vị vận chuyển và cổng thanh toán ở mức cần thiết để hoàn tất đơn hàng.',
  },
  {
    id: 'quyen',
    number: '05',
    title: 'Quyền của người dùng',
    navLabel: 'Quyền của người dùng',
    body: 'Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xoá dữ liệu cá nhân đã cung cấp, trừ các thông tin cần lưu giữ theo quy định pháp luật (ví dụ: hoá đơn, chứng từ giao dịch).',
  },
  {
    id: 'cookie',
    number: '06',
    title: 'Cookie và theo dõi',
    navLabel: 'Cookie và theo dõi',
    body: 'Website sử dụng cookie để duy trì phiên đăng nhập và ghi nhớ tuỳ chọn hiển thị (sáng/tối). Bạn có thể tắt cookie trong trình duyệt, tuy nhiên một số tính năng có thể không hoạt động đầy đủ.',
  },
  {
    id: 'lien-he',
    number: '07',
    title: 'Liên hệ',
    navLabel: 'Liên hệ',
    body: 'Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ bộ phận hỗ trợ khách hàng của MediCare Store qua email hoặc hotline được công bố trên trang chủ.',
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocLayout
      icon={ShieldCheck}
      eyebrow="Bảo mật"
      title="Chính sách bảo mật"
      description="Cách MediCare Store thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn trong suốt quá trình mua sắm."
      version="v3.1"
      updatedDate="29/07/2026"
      sections={SECTIONS}
      backTo="/register"
      backLabel="Quay lại"
    />
  );
}