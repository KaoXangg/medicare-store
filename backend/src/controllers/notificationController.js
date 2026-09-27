import { query } from '../config/db.js';

/** Admin: đơn chờ xác nhận + liên hệ mới */
export const getAdminNotifications = async (req, res, next) => {
  try {
    const [orderCount, contactCount, orders, contacts] = await Promise.all([
      query(`SELECT COUNT(*) AS cnt FROM Orders WHERE Status = 'pending'`),
      query(`SELECT COUNT(*) AS cnt FROM Contacts WHERE Status = 'new'`),
      query(
        `SELECT TOP 8 o.OrderId, o.OrderCode, o.TotalAmount, o.Status, o.CreatedAt, u.FullName AS CustomerName
         FROM Orders o
         JOIN Users u ON o.UserId = u.UserId
         WHERE o.Status = 'pending'
         ORDER BY o.CreatedAt DESC`
      ),
      query(
        `SELECT TOP 8 ContactId, FullName, Email, Subject, Message, CreatedAt
         FROM Contacts WHERE Status = 'new'
         ORDER BY CreatedAt DESC`
      ),
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          orders: orderCount.recordset[0]?.cnt || 0,
          contacts: contactCount.recordset[0]?.cnt || 0,
        },
        orders: orders.recordset,
        contacts: contacts.recordset,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Khách: đơn đang chờ + phản hồi liên hệ chưa đọc */
export const getMyNotificationCounts = async (req, res, next) => {
  try {
    const userId = req.user.UserId;
    const [orderPending, contactUnread] = await Promise.all([
      query(
        `SELECT COUNT(*) AS cnt FROM Orders WHERE UserId = @userId AND Status = 'pending'`,
        { userId }
      ),
      query(
        `SELECT COUNT(*) AS cnt FROM Contacts
         WHERE UserId = @userId AND AdminReply IS NOT NULL AND ReplyRead = 0`,
        { userId }
      ),
    ]);

    res.json({
      success: true,
      data: {
        orders: orderPending.recordset[0]?.cnt || 0,
        contacts: contactUnread.recordset[0]?.cnt || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};
