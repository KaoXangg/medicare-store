import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const securityMiddleware = [
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
];

// Giới hạn chung cho toàn bộ /api
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 600 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' },
});

// Giới hạn riêng cho các route xác thực (login/register/forgot/reset-password)
// Tối đa 5 lần THẤT BẠI trong 15 phút / IP — chống brute-force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // đăng nhập/đăng ký thành công không tính vào giới hạn
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.path}`, // tách riêng bộ đếm cho từng route (login, register, forgot...)
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Bạn đã thử quá 5 lần. Vui lòng thử lại sau 15 phút.',
    });
  },
});