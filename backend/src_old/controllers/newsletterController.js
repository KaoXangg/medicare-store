import { query } from '../config/db.js';

export const subscribe = async (req, res, next) => {
  try {
    const email = req.body.email?.trim()?.toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
    }

    try {
      const exists = await query(
        'SELECT SubscriberId FROM NewsletterSubscribers WHERE Email = @email',
        { email }
      );
      if (exists.recordset.length) {
        await query('UPDATE NewsletterSubscribers SET IsActive = 1 WHERE Email = @email', { email });
        return res.json({ success: true, message: 'Email đã được đăng ký nhận tin' });
      }
      await query('INSERT INTO NewsletterSubscribers (Email) VALUES (@email)', { email });
    } catch (dbErr) {
      if (dbErr.message?.includes('NewsletterSubscribers')) {
        console.log('[Newsletter]', email);
      } else {
        throw dbErr;
      }
    }

    res.status(201).json({ success: true, message: 'Đăng ký nhận tin thành công!' });
  } catch (err) {
    next(err);
  }
};

export const getSubscribers = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM NewsletterSubscribers WHERE IsActive = 1 ORDER BY CreatedAt DESC'
    );
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    if (err.message?.includes('NewsletterSubscribers')) {
      return res.json({ success: true, data: [] });
    }
    next(err);
  }
};
