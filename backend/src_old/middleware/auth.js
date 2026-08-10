import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT UserId, Email, FullName, Phone, Address, Avatar, Role, IsActive FROM Users WHERE UserId = @userId',
      { userId: decoded.userId }
    );
    const user = result.recordset[0];
    if (!user || !user.IsActive) {
      return res.status(401).json({ success: false, message: 'Account inactive or not found' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query(
        'SELECT UserId, Email, FullName, Role, IsActive FROM Users WHERE UserId = @userId',
        { userId: decoded.userId }
      );
      if (result.recordset[0]?.IsActive) req.user = result.recordset[0];
    }
  } catch { /* ignore */ }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.Role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};
