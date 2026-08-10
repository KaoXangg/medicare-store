import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter =
  process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;

export async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.log('[Email mock]', { to, subject });
    return { success: true, mock: true };
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'MediCare Store <noreply@medicarestore.com>',
    to,
    subject,
    html,
  });
  return { success: true };
}

export function orderConfirmationEmail(order) {
  const items = order.items
    ?.map(
      (i) =>
        `<tr><td>${i.ProductName}</td><td>${i.Quantity}</td><td>${Number(i.Total).toLocaleString('vi-VN')}đ</td></tr>`
    )
    .join('') || '';

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#0d9488">MediCare Store - Xác nhận đơn hàng</h2>
      <p>Xin chào <strong>${order.CustomerName}</strong>,</p>
      <p>Đơn hàng <strong>#${order.OrderCode}</strong> đã được tiếp nhận.</p>
      <p><strong>Tổng tiền:</strong> ${Number(order.TotalAmount).toLocaleString('vi-VN')}đ</p>
      <p><strong>Thanh toán:</strong> ${order.PaymentMethod === 'cod' ? 'COD (Thanh toán khi nhận)' : 'Thanh toán online'}</p>
      <p><strong>Địa chỉ giao:</strong> ${order.ShippingAddress}</p>
      <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
        <tr><th>Sản phẩm</th><th>SL</th><th>Thành tiền</th></tr>
        ${items}
      </table>
      <p style="color:#666;margin-top:20px">Cảm ơn bạn đã tin tưởng MediCare Store!</p>
    </div>
  `;
}

export function passwordResetEmail(name, resetUrl) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#0d9488">MediCare Store - Đặt lại mật khẩu</h2>
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>Nhấn vào liên kết bên dưới để đặt lại mật khẩu (có hiệu lực 1 giờ):</p>
      <a href="${resetUrl}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Đặt lại mật khẩu</a>
      <p style="color:#666;margin-top:20px">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    </div>
  `;
}
