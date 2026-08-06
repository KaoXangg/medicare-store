import { FileText } from 'lucide-react';
import LegalDocLayout from '../components/layout/LegalDocLayout';

const SECTIONS = [
  {
    id: 'chap-nhan',
    number: '01',
    title: 'Chấp nhận điều khoản',
    navLabel: 'Chấp nhận điều khoản',
    body: 'Khi truy cập và sử dụng MediCare Store, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong văn bản này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.',
  },
  {
    id: 'tai-khoan',
    number: '02',
    title: 'Tài khoản người dùng',
    navLabel: 'Tài khoản người dùng',
    body: 'Bạn có trách nhiệm bảo mật thông tin đăng nhập (email, mật khẩu) và chịu trách nhiệm với mọi hoạt động diễn ra dưới tài khoản của mình. Vui lòng thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép.',
  },
  {
    id: 'san-pham',
    number: '03',
    title: 'Sản phẩm và đặt hàng',
    navLabel: 'Sản phẩm và đặt hàng',
    body: 'Các thiết bị y tế được niêm yết trên nền tảng đã được kiểm định nguồn gốc. Giá và tình trạng còn hàng có thể thay đổi mà không cần báo trước. Đơn hàng chỉ được xác nhận sau khi thanh toán thành công.',
  },
  {
    id: 'thanh-toan',
    number: '04',
    title: 'Thanh toán',
    navLabel: 'Thanh toán',
    body: 'MediCare Store hỗ trợ các phương thức thanh toán được liệt kê tại thời điểm đặt hàng. Mọi giao dịch được xử lý qua cổng thanh toán bảo mật, tuân thủ tiêu chuẩn PCI-DSS.',
  },
  {
    id: 'van-chuyen',
    number: '05',
    title: 'Vận chuyển và đổi trả',
    navLabel: 'Vận chuyển và đổi trả',
    body: 'Thời gian giao hàng dự kiến được hiển thị tại bước thanh toán. Chính sách đổi trả áp dụng trong vòng 7 ngày kể từ ngày nhận hàng đối với sản phẩm còn nguyên tem, chưa qua sử dụng, trừ các sản phẩm y tế đặc thù không hỗ trợ đổi trả vì lý do vệ sinh.',
  },
  {
    id: 'gioi-han',
    number: '06',
    title: 'Giới hạn trách nhiệm',
    navLabel: 'Giới hạn trách nhiệm',
    body: 'MediCare Store không chịu trách nhiệm với thiệt hại gián tiếp phát sinh từ việc sử dụng sai mục đích sản phẩm. Người dùng cần tham khảo ý kiến chuyên gia y tế trước khi sử dụng thiết bị cho mục đích điều trị.',
  },
  {
    id: 'thay-doi',
    number: '07',
    title: 'Thay đổi điều khoản',
    navLabel: 'Thay đổi điều khoản',
    body: 'Chúng tôi có quyền cập nhật điều khoản này theo thời gian. Phiên bản mới nhất sẽ luôn được đăng tải tại trang này kèm ngày cập nhật.',
  },
];

export default function TermsPage() {
  return (
    <LegalDocLayout
      icon={FileText}
      eyebrow="Điều khoản"
      title="Điều khoản sử dụng"
      description="Các quy định áp dụng khi bạn tạo tài khoản, đặt hàng và sử dụng dịch vụ của MediCare Store."
      version="v3.1"
      updatedDate="29/07/2026"
      sections={SECTIONS}
      backTo="/register"
      backLabel="Quay lại"
    />
  );
}