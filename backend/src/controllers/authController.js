import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { sendEmail, passwordResetEmail } from '../utils/email.js';

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const issueRefreshToken = async (userId) => {
  const refreshToken = `${uuidv4()}.${uuidv4()}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  try {
    await query(
      'INSERT INTO RefreshTokens (UserId, Token, ExpiresAt) VALUES (@userId, @token, @expiresAt)',
      { userId, token: refreshToken, expiresAt }
    );
  } catch {
    /* RefreshTokens table optional */
  }
  return refreshToken;
};

// Kiểm tra email/SĐT đã tồn tại chưa — dùng cho check real-time lúc gõ ở form đăng ký
export const checkAvailability = async (req, res, next) => {
  try {
    const { email, phone, idCard } = req.query;
    if (!email && !phone && !idCard) {
      return res.json({ success: true, data: { emailTaken: false, phoneTaken: false, idCardTaken: false } });
    }
    const result = await query(
      `SELECT Email, Phone, IdCard FROM Users
       WHERE (Email = @email AND @email IS NOT NULL)
          OR (Phone = @phone AND @phone IS NOT NULL)
          OR (IdCard = @idCard AND @idCard IS NOT NULL)`,
      { email: email || null, phone: phone || null, idCard: idCard || null }
    );
    const emailTaken = email ? result.recordset.some((u) => u.Email === email) : false;
    const phoneTaken = phone ? result.recordset.some((u) => u.Phone === phone) : false;
    const idCardTaken = idCard ? result.recordset.some((u) => u.IdCard === idCard) : false;
    res.json({ success: true, data: { emailTaken, phoneTaken, idCardTaken } });
  } catch (err) {
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, idCard } = req.body;
    const conflicts = await query(
      `SELECT UserId, Email, Phone, IdCard FROM Users
       WHERE Email = @email
          OR (Phone = @phone AND @phone IS NOT NULL)
          OR (IdCard = @idCard AND @idCard IS NOT NULL)`,
      { email, phone: phone || null, idCard: idCard || null }
    );
    if (conflicts.recordset.length) {
      const emailTaken = conflicts.recordset.some((u) => u.Email === email);
      const phoneTaken = phone && conflicts.recordset.some((u) => u.Phone === phone);
      const idCardTaken = idCard && conflicts.recordset.some((u) => u.IdCard === idCard);
      const errors = [];
      if (emailTaken) errors.push({ path: 'email', msg: 'Email này đã được sử dụng' });
      if (phoneTaken) errors.push({ path: 'phone', msg: 'Số điện thoại này đã được sử dụng' });
      if (idCardTaken) errors.push({ path: 'idCard', msg: 'Số CCCD/CMND này đã được sử dụng' });
      return res.status(400).json({
        success: false,
        message: errors[0]?.msg || 'Thông tin đăng ký đã được sử dụng',
        errors,
      });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO Users (Email, PasswordHash, FullName, Phone, IdCard)
       VALUES (@email, @hash, @fullName, @phone, @idCard)
       RETURNING UserId, Email, FullName, Phone, IdCard, Role`,
      { email, hash, fullName, phone: phone || null, idCard: idCard || null }
    );
    const user = result.recordset[0];
    const token = signToken(user.UserId);
    const refreshToken = await issueRefreshToken(user.UserId);
    res.status(201).json({ success: true, message: 'Đăng ký thành công', data: { user, token, refreshToken } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await query(
      `SELECT UserId, Email, PasswordHash, FullName, Phone, Address, Avatar, Role, IsActive, DateOfBirth, IsVerified, VerifyRequested, PhoneVerified, PhoneVerifyRequested, NotificationPrefs
       FROM Users
       WHERE Email = @credential OR Phone = @credential`,
      { credential: email }
    );
    const user = result.recordset[0];
    if (!user) return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng' });
    if (!user.IsActive) return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    const valid = await bcrypt.compare(password, user.PasswordHash);
    if (!valid) return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng' });
    delete user.PasswordHash;
    const token = signToken(user.UserId);
    const refreshToken = await issueRefreshToken(user.UserId);
    res.json({ success: true, data: { user, token, refreshToken } });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    // Luôn fetch lại từ DB để có đầy đủ fields (bao gồm DateOfBirth)
    const result = await query(
      `SELECT UserId, Email, FullName, Phone, Address, Avatar, Role, DateOfBirth, IsActive, IsVerified, VerifyRequested, PhoneVerified, PhoneVerifyRequested, NotificationPrefs
       FROM Users WHERE UserId = @userId`,
      { userId: req.user.UserId }
    );
    const user = result.recordset[0];
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, address, avatar, dateOfBirth, DateOfBirth, dob } = req.body;

    // Phân biệt "không gửi field avatar" (giữ nguyên) với
    // "gửi avatar: null" (yêu cầu xóa avatar hiện tại)
    const hasAvatarField = Object.prototype.hasOwnProperty.call(req.body, 'avatar');

    // Accept mọi variant field name frontend có thể gửi
    const dobValue = dateOfBirth || DateOfBirth || dob || null;

    // Lấy dữ liệu hiện tại để so sánh, biết chính xác field nào vừa thay đổi
    const before = (await query(
      'SELECT Phone, FullName, Address, Avatar, DateOfBirth FROM Users WHERE UserId = @userId',
      { userId: req.user.UserId }
    )).recordset[0] || {};

    // Nếu đổi số điện thoại sang một số khác, phải xác thực lại từ đầu
    let resetPhoneVerify = false;
    const changed = [];

    if (fullName && fullName !== before.FullName) changed.push('Họ tên');
    if (phone && phone !== (before.Phone || '')) {
      changed.push('Số điện thoại');
      resetPhoneVerify = true;
    }
    if (address && address !== before.Address) changed.push('Địa chỉ');
    if (dobValue) {
      const beforeDob = before.DateOfBirth ? new Date(before.DateOfBirth).toISOString().slice(0, 10) : null;
      if (dobValue !== beforeDob) changed.push('Ngày sinh');
    }
    if (hasAvatarField && (avatar || null) !== (before.Avatar || null)) changed.push('Ảnh đại diện');

    await query(
      `UPDATE Users SET
        FullName             = COALESCE(@fullName, FullName),
        Phone                = COALESCE(@phone, Phone),
        Address              = COALESCE(@address, Address),
        Avatar               = CASE WHEN @hasAvatarField = 1 THEN @avatar ELSE Avatar END,
        DateOfBirth          = COALESCE(@dateOfBirth, DateOfBirth),
        PhoneVerified      = CASE WHEN @resetPhoneVerify = 1 THEN 0 ELSE PhoneVerified END,
        PhoneVerifyRequested = CASE WHEN @resetPhoneVerify = 1 THEN 0 ELSE PhoneVerifyRequested END,
        LastChangedFields    = CASE WHEN @hasChanges = 1 THEN @lastChangedFields ELSE LastChangedFields END,
        UpdatedAt            = CASE WHEN @hasChanges = 1 THEN GETUTCDATE() ELSE UpdatedAt END
       WHERE UserId = @userId`,
      {
        fullName:    fullName    || null,
        phone:       phone       || null,
        address:     address     || null,
        avatar:      hasAvatarField ? (avatar || null) : null,
        hasAvatarField: hasAvatarField ? 1 : 0,
        dateOfBirth: dobValue,
        resetPhoneVerify: resetPhoneVerify ? 1 : 0,
        hasChanges: changed.length ? 1 : 0,
        lastChangedFields: changed.length ? JSON.stringify(changed) : null,
        userId:      req.user.UserId,
      }
    );

    // Trả về user đầy đủ fields
    const result = await query(
      `SELECT UserId, Email, FullName, Phone, Address, Avatar, Role, DateOfBirth, IsActive, IsVerified, VerifyRequested, PhoneVerified, PhoneVerifyRequested, NotificationPrefs, LastChangedFields, UpdatedAt
       FROM Users WHERE UserId = @userId`,
      { userId: req.user.UserId }
    );
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

// Đổi email đăng nhập — bắt buộc xác nhận bằng mật khẩu hiện tại,
// và yêu cầu xác thực lại tài khoản với email mới sau khi đổi.
export const changeEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body;
    if (!newEmail || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email mới và mật khẩu hiện tại' });
    }

    const dup = await query(
      'SELECT UserId FROM Users WHERE Email = @email AND UserId != @userId',
      { email: newEmail, userId: req.user.UserId }
    );
    if (dup.recordset.length) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng bởi tài khoản khác' });
    }

    const current = await query('SELECT PasswordHash FROM Users WHERE UserId = @userId', { userId: req.user.UserId });
    const valid = await bcrypt.compare(password, current.recordset[0].PasswordHash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    await query(
      `UPDATE Users SET
        Email             = @newEmail,
        IsVerified        = 0,
        VerifyRequested   = 0,
        LastChangedFields = @lastChangedFields,
        UpdatedAt         = GETUTCDATE()
       WHERE UserId = @userId`,
      { newEmail, lastChangedFields: JSON.stringify(['Email']), userId: req.user.UserId }
    );

    const result = await query(
      `SELECT UserId, Email, FullName, Phone, Address, Avatar, Role, DateOfBirth, IsActive, IsVerified, VerifyRequested, PhoneVerified, PhoneVerifyRequested, NotificationPrefs, LastChangedFields, UpdatedAt
       FROM Users WHERE UserId = @userId`,
      { userId: req.user.UserId }
    );
    res.json({ success: true, message: 'Đổi email thành công', data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

// Lưu tuỳ chọn nhận thông báo — lưu thật vào DB dưới dạng JSON, không phải chỉ hiện toast giả.
export const updateNotifications = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ success: false, message: 'Dữ liệu tuỳ chọn thông báo không hợp lệ' });
    }
    const prefsJson = JSON.stringify(preferences);

    await query(
      'UPDATE Users SET NotificationPrefs = @prefs, UpdatedAt = GETUTCDATE() WHERE UserId = @userId',
      { prefs: prefsJson, userId: req.user.UserId }
    );

    const result = await query(
      `SELECT UserId, Email, FullName, Phone, Address, Avatar, Role, DateOfBirth, IsActive, IsVerified, VerifyRequested, PhoneVerified, PhoneVerifyRequested, NotificationPrefs
       FROM Users WHERE UserId = @userId`,
      { userId: req.user.UserId }
    );
    res.json({ success: true, message: 'Đã lưu tuỳ chọn thông báo', data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file ảnh nào được gửi lên' });
    }
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    await query(
      'UPDATE Users SET Avatar = @avatar, UpdatedAt = GETUTCDATE() WHERE UserId = @userId',
      { avatar: avatarPath, userId: req.user.UserId }
    );
    const result = await query(
      `SELECT UserId, Email, FullName, Phone, Address, Avatar, Role, DateOfBirth
       FROM Users WHERE UserId = @userId`,
      { userId: req.user.UserId }
    );
    res.json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: { avatarUrl: avatarPath, user: result.recordset[0] },
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await query('SELECT PasswordHash FROM Users WHERE UserId = @userId', { userId: req.user.UserId });
    const valid = await bcrypt.compare(currentPassword, result.recordset[0].PasswordHash);
    if (!valid) return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE Users SET PasswordHash = @hash, LastChangedFields = @lastChangedFields, UpdatedAt = GETUTCDATE() WHERE UserId = @userId', {
      hash, lastChangedFields: JSON.stringify(['Mật khẩu']), userId: req.user.UserId,
    });
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    // Tìm theo email hoặc số điện thoại
    const result = await query(
      'SELECT UserId, FullName, Email FROM Users WHERE Email = @email OR Phone = @phone',
      { email: email || null, phone: phone || null }
    );
    const user = result.recordset[0];
    if (!user) return res.json({ success: true, message: 'Nếu tài khoản tồn tại, link đặt lại mật khẩu đã được gửi' });
    const token = uuidv4();
    const expires = new Date(Date.now() + 3600000); // 1 giờ
    await query(
      'INSERT INTO PasswordResetTokens (UserId, Token, ExpiresAt) VALUES (@userId, @token, @expires)',
      { userId: user.UserId, token, expires }
    );
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.Email,
      subject: 'MediCare Store - Đặt lại mật khẩu',
      html: passwordResetEmail(user.FullName, resetUrl),
    });
    res.json({ success: true, message: 'Nếu tài khoản tồn tại, link đặt lại mật khẩu đã được gửi' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await query(
      `SELECT t.UserId FROM PasswordResetTokens t
       WHERE t.Token = @token AND t.Used = 0 AND t.ExpiresAt > GETUTCDATE()`,
      { token }
    );
    if (!result.recordset.length) {
      return res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    const userId = result.recordset[0].UserId;
    const hash = await bcrypt.hash(password, 12);
    await query('UPDATE Users SET PasswordHash = @hash WHERE UserId = @userId', { hash, userId });
    await query('UPDATE PasswordResetTokens SET Used = 1 WHERE Token = @token', { token });
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Thiếu refresh token' });
    const result = await query(
      `SELECT rt.UserId FROM RefreshTokens rt
       WHERE rt.Token = @token AND rt.Revoked = 0 AND rt.ExpiresAt > GETUTCDATE()`,
      { token }
    );
    if (!result.recordset[0]) return res.status(401).json({ success: false, message: 'Refresh token không hợp lệ' });
    const userId = result.recordset[0].UserId;
    const accessToken = signToken(userId);
    const newRefresh = await issueRefreshToken(userId);
    await query('UPDATE RefreshTokens SET Revoked = 1 WHERE Token = @token', { token });
    res.json({ success: true, data: { token: accessToken, refreshToken: newRefresh } });
  } catch (err) {
    if (err.message?.includes('RefreshTokens')) {
      return res.status(501).json({ success: false, message: 'Refresh token chưa được cấu hình' });
    }
    next(err);
  }
};

// Gửi yêu cầu xác thực tài khoản lên admin
export const requestVerify = async (req, res, next) => {
  try {
    await query(
      `UPDATE Users SET VerifyRequested = 1, UpdatedAt = GETUTCDATE() WHERE UserId = @userId`,
      { userId: req.user.UserId }
    );
    res.json({ success: true, message: 'Đã gửi yêu cầu xác thực tới admin' });
  } catch (err) {
    next(err);
  }
};

// Gửi yêu cầu xác thực số điện thoại lên admin
export const requestVerifyPhone = async (req, res, next) => {
  try {
    const current = await query('SELECT Phone FROM Users WHERE UserId = @userId', { userId: req.user.UserId });
    if (!current.recordset[0]?.Phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cập nhật số điện thoại trước khi gửi yêu cầu xác thực',
      });
    }
    await query(
      `UPDATE Users SET PhoneVerifyRequested = 1, UpdatedAt = GETUTCDATE() WHERE UserId = @userId`,
      { userId: req.user.UserId }
    );
    res.json({ success: true, message: 'Đã gửi yêu cầu xác thực số điện thoại tới admin' });
  } catch (err) {
    next(err);
  }
};