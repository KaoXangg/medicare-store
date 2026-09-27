import { query } from '../config/db.js';
import { paginate } from '../utils/helpers.js';

export const submitContact = async (req, res, next) => {
  try {
    const userId = req.user.UserId;
    const fullName = (req.body.fullName?.trim() || req.user.FullName || '').trim();
    const email = (req.body.email?.trim() || req.user.Email || '').trim();
    const { phone, subject, message } = req.body;

    if (!fullName || !email || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    }

    try {
      await query(
        `INSERT INTO Contacts (UserId, FullName, Email, Phone, Subject, Message)
         VALUES (@userId, @fullName, @email, @phone, @subject, @message)`,
        {
          userId,
          fullName,
          email,
          phone: phone?.trim() || null,
          subject: subject.trim(),
          message: message.trim(),
        }
      );
    } catch (dbErr) {
      console.error('[Contact submit]', dbErr.message);
      return res.status(503).json({
        success: false,
        message: 'Không thể lưu liên hệ. Vui lòng thử lại sau hoặc gọi hotline.',
      });
    }

    res.status(201).json({ success: true, message: 'Gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm!' });
  } catch (err) {
    next(err);
  }
};

export const getMyContacts = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ContactId, Subject, Message, Status, AdminReply, ReplyAt, ReplyRead, CreatedAt
       FROM Contacts WHERE UserId = @userId
       ORDER BY CreatedAt DESC`,
      { userId: req.user.UserId }
    );
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

export const getMyContactNotifications = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT COUNT(*) AS unread FROM Contacts
       WHERE UserId = @userId AND Status = 'replied' AND AdminReply IS NOT NULL AND ReplyRead = 0`,
      { userId: req.user.UserId }
    );
    const recent = await query(
      `SELECT TOP 5 ContactId, Subject, AdminReply, ReplyAt, ReplyRead
       FROM Contacts
       WHERE UserId = @userId AND Status = 'replied' AND AdminReply IS NOT NULL
       ORDER BY ReplyAt DESC, CreatedAt DESC`,
      { userId: req.user.UserId }
    );
    res.json({
      success: true,
      data: {
        unread: result.recordset[0]?.unread || 0,
        items: recent.recordset,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markMyContactRead = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query(
      `UPDATE Contacts SET ReplyRead = 1
       WHERE ContactId = @id AND UserId = @userId`,
      { id, userId: req.user.UserId }
    );
    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (err) {
    next(err);
  }
};

export const getContacts = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit || 8);
    const { status, search } = req.query;

    let where = 'WHERE 1=1';
    const params = { offset, limit };

    if (status) {
      where += ' AND Status = @status';
      params.status = status;
    }
    if (search?.trim()) {
      where += ' AND (FullName LIKE @search OR Email LIKE @search OR Subject LIKE @search OR Message LIKE @search)';
      params.search = `%${search.trim()}%`;
    }

    const countResult = await query(`SELECT COUNT(*) AS total FROM Contacts ${where}`, params);
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT * FROM Contacts ${where}
       ORDER BY CreatedAt DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      params
    );

    res.json({
      success: true,
      data: result.recordset,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    if (err.message?.includes('Contacts')) {
      return res.json({
        success: true,
        data: [],
        pagination: { page: 1, limit: 8, total: 0, totalPages: 1 },
      });
    }
    next(err);
  }
};

export const markContactRead = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query(
      `UPDATE Contacts SET Status = 'read' WHERE ContactId = @id AND Status = 'new'`,
      { id }
    );
    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (err) {
    next(err);
  }
};

export const replyContact = async (req, res, next) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' });
    }
    await query(
      `UPDATE Contacts SET Status = 'replied', AdminReply = @reply, ReplyAt = GETUTCDATE(), ReplyRead = 0
       WHERE ContactId = @id`,
      { id: req.params.id, reply: reply.trim() }
    );
    res.json({ success: true, message: 'Đã gửi phản hồi cho khách hàng' });
  } catch (err) {
    next(err);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await query('DELETE FROM Contacts WHERE ContactId = @id', { id });
    if (!result.rowsAffected?.[0]) {
      return res.status(404).json({ success: false, message: 'Liên hệ không tồn tại' });
    }
    res.json({ success: true, message: 'Đã xóa liên hệ' });
  } catch (err) {
    next(err);
  }
};
