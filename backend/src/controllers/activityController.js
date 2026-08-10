import { query } from '../config/db.js';
import { paginate } from '../utils/helpers.js';

// CreatedAt trong DB lưu theo UTC (GETUTCDATE()), nhưng "ngày" người dùng chọn trên
// giao diện là ngày theo giờ Việt Nam (UTC+7). Nếu lọc thẳng theo CAST(CreatedAt AS DATE)
// sẽ bị lệch ranh giới ngày. Hàm này quy đổi 1 ngày VN-local ra đúng khoảng UTC tương ứng.
function vnDayRangeUtc(dateStr) {
  const start = new Date(`${dateStr}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function todayStrVN() {
  const now = new Date();
  const vnMs = now.getTime() + 7 * 60 * 60 * 1000; // shift sang giờ VN
  const vn = new Date(vnMs);
  return vn.toISOString().slice(0, 10);
}

const VALID_ACTIONS = [
  'page_view', 'search', 'product_view', 'add_to_cart',
  'buy_now', 'order_placed', 'login', 'logout',
];

const stringifyDetail = (detail) => {
  if (detail === undefined || detail === null) return null;
  if (typeof detail === 'string') return detail.slice(0, 4000);
  try {
    return JSON.stringify(detail).slice(0, 4000);
  } catch {
    return null;
  }
};

export const createLog = async (req, res, next) => {
  try {
    const userId = req.user?.UserId || req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

    const role = req.user?.Role || req.user?.role;
    if (role === 'admin') {
      // Không ghi nhật ký cho tài khoản admin, chỉ theo dõi khách hàng
      return res.status(200).json({ success: true, skipped: true });
    }

    const events = Array.isArray(req.body?.events) ? req.body.events : [req.body];
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
    const userAgent = (req.headers['user-agent'] || '').slice(0, 300);

    for (const ev of events) {
      const actionType = VALID_ACTIONS.includes(ev?.actionType) ? ev.actionType : null;
      if (!actionType) continue;
      await query(
        `INSERT INTO ActivityLogs (UserId, ActionType, ActionDetail, PageUrl, Duration, IpAddress, UserAgent)
         VALUES (@userId, @actionType, @detail, @pageUrl, @duration, @ip, @userAgent)`,
        {
          userId,
          actionType,
          detail: stringifyDetail(ev.detail),
          pageUrl: ev.pageUrl ? String(ev.pageUrl).slice(0, 500) : null,
          duration: Number.isFinite(ev.duration) ? Math.round(ev.duration) : null,
          ip,
          userAgent,
        }
      );
    }

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { userId, actionType, search, date, dateFrom, dateTo } = req.query;

    let where = 'WHERE 1=1';
    const params = { offset, limit };

    if (userId) {
      where += ' AND l.UserId = @userId';
      params.userId = parseInt(userId, 10);
    }
    if (actionType) {
      where += ' AND l.ActionType = @actionType';
      params.actionType = actionType;
    }
    if (search) {
      where += ' AND (l.ActionDetail LIKE @search OR l.PageUrl LIKE @search OR u.FullName LIKE @search OR u.Email LIKE @search)';
      params.search = `%${search}%`;
    }
    if (date) {
      // date = ngày theo giờ VN (vd '2026-08-01') — quy đổi đúng sang khoảng UTC trước khi lọc
      const { start, end } = vnDayRangeUtc(date);
      where += ' AND l.CreatedAt >= @dateStart AND l.CreatedAt < @dateEnd';
      params.dateStart = start;
      params.dateEnd = end;
    } else {
      if (dateFrom) {
        where += ' AND l.CreatedAt >= @dateFrom';
        params.dateFrom = new Date(dateFrom);
      }
      if (dateTo) {
        where += ' AND l.CreatedAt <= @dateTo';
        params.dateTo = new Date(dateTo);
      }
    }

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM ActivityLogs l
       LEFT JOIN Users u ON l.UserId = u.UserId ${where}`,
      params
    );
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT l.LogId, l.UserId, l.ActionType, l.ActionDetail, l.PageUrl, l.Duration,
              l.IpAddress, l.CreatedAt, u.FullName, u.Email, u.Avatar
       FROM ActivityLogs l
       LEFT JOIN Users u ON l.UserId = u.UserId
       ${where}
       ORDER BY l.CreatedAt DESC
       LIMIT @limit OFFSET @offset`,
      params
    );

    const data = result.recordset.map((r) => {
      let detail = null;
      try { detail = r.ActionDetail ? JSON.parse(r.ActionDetail) : null; } catch { detail = r.ActionDetail; }
      return { ...r, ActionDetail: detail };
    });

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// Gộp nhóm hành động theo từng khách hàng cho TOÀN BỘ ngày được chọn — khác với getLogs
// (chỉ trả 20 dòng/trang), endpoint này lấy toàn bộ log trong ngày rồi nhóm ngay tại backend,
// nên "Theo khách hàng" phản ánh đúng tổng số hành động thật sự trong ngày của mỗi khách.
export const getLogsByUser = async (req, res, next) => {
  try {
    const { date, search, actionType } = req.query;
    const targetDate = date || todayStrVN();
    const { start, end } = vnDayRangeUtc(targetDate);

    let where = 'WHERE l.CreatedAt >= @dateStart AND l.CreatedAt < @dateEnd';
    const params = { dateStart: start, dateEnd: end };

    if (actionType) {
      where += ' AND l.ActionType = @actionType';
      params.actionType = actionType;
    }
    if (search) {
      where += ' AND (l.ActionDetail LIKE @search OR l.PageUrl LIKE @search OR u.FullName LIKE @search OR u.Email LIKE @search)';
      params.search = `%${search}%`;
    }

    const result = await query(
      `SELECT l.LogId, l.UserId, l.ActionType, l.ActionDetail, l.PageUrl, l.Duration,
              l.IpAddress, l.CreatedAt, u.FullName, u.Email, u.Avatar
       FROM ActivityLogs l
       LEFT JOIN Users u ON l.UserId = u.UserId
       ${where}
       ORDER BY l.CreatedAt DESC
       LIMIT 5000`,
      params
    );

    const parsed = result.recordset.map((r) => {
      let detail = null;
      try { detail = r.ActionDetail ? JSON.parse(r.ActionDetail) : null; } catch { detail = r.ActionDetail; }
      return { ...r, ActionDetail: detail };
    });

    const map = new Map();
    for (const log of parsed) {
      const key = log.UserId ?? `anon-${log.Email || log.FullName || 'unknown'}`;
      if (!map.has(key)) {
        map.set(key, { key, UserId: log.UserId, FullName: log.FullName, Email: log.Email, Avatar: log.Avatar, logs: [] });
      }
      map.get(key).logs.push(log);
    }
    const groups = Array.from(map.values()).sort((a, b) => b.logs.length - a.logs.length);

    res.json({ success: true, data: groups, totalUsers: groups.length, totalActions: parsed.length });
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const targetDate = req.query.date || todayStrVN();
    const { start, end } = vnDayRangeUtc(targetDate);

    const today = await query(
      `SELECT COUNT(*) AS cnt FROM ActivityLogs WHERE CreatedAt >= @start AND CreatedAt < @end`,
      { start, end }
    );
    const activeUsers = await query(
      `SELECT COUNT(DISTINCT UserId) AS cnt FROM ActivityLogs WHERE CreatedAt >= (GETUTCDATE() - INTERVAL '24 hours')`
    );
    const topActions = await query(
      `SELECT ActionType, COUNT(*) AS cnt FROM ActivityLogs
       WHERE CreatedAt >= (GETUTCDATE() - INTERVAL '7 days')
       GROUP BY ActionType ORDER BY cnt DESC LIMIT 5`
    );
    const topProducts = await query(
      `SELECT
         JSON_VALUE_SAFE(ActionDetail, 'productName') AS productName,
         COUNT(*) AS cnt
       FROM ActivityLogs
       WHERE ActionType = 'product_view' AND CreatedAt >= (GETUTCDATE() - INTERVAL '7 days')
         AND JSON_VALUE_SAFE(ActionDetail, 'productName') IS NOT NULL
       GROUP BY JSON_VALUE_SAFE(ActionDetail, 'productName')
       ORDER BY cnt DESC LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        actionsToday: today.recordset[0].cnt,
        activeUsers24h: activeUsers.recordset[0].cnt,
        topActions: topActions.recordset,
        topProducts: topProducts.recordset,
      },
    });
  } catch (err) {
    next(err);
  }
};