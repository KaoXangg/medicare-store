import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

export const registerRules = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('fullName').notEmpty().withMessage('Họ tên bắt buộc'),
  validate,
];

export const loginRules = [
  body('email')
    .notEmpty().withMessage('Vui lòng nhập email hoặc số điện thoại')
    .custom((value) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^(\+84|0)[0-9]{8,10}$/.test(value);
      if (!isEmail && !isPhone) {
        throw new Error('Email hoặc số điện thoại không hợp lệ');
      }
      return true;
    }),
  body('password').notEmpty(),
  validate,
];

export const forgotPasswordRules = [body('email').isEmail(), validate];

export const resetPasswordRules = [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }),
  validate,
];