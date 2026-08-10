import { query } from '../config/db.js';
import { paginate } from '../utils/helpers.js';

export const getDashboard = async (req, res, next) => {
  try {
    const [
      revenue,
      orders,
      customers,
      products,
      categories,
      recentOrders,
      revenueChart,
      orderChart,
      productChart,
      orderStats,
      todayStats,
      yesterdayStats,
      topProducts,
      categoryRevenue,
      paymentStats,
      customerChart,
      vipCustomers,
      inventoryStats,
      lowStockProducts,
      reviewStats,
      reviewDist,
      customersGrowthRaw,
      productsGrowthRaw,
      weeklyOrdersRaw,
      avgOrderGrowthRaw,
    ] = await Promise.all([
      query(`SELECT COALESCE(SUM(TotalAmount), 0) AS totalrevenue FROM Orders WHERE Status != 'cancelled'`),
      query(`SELECT COUNT(*) AS totalorderscount FROM Orders`),
      query(`SELECT COUNT(*) AS totalcustomers FROM Users WHERE Role = 'user'`),
      query(`SELECT COUNT(*) AS totalproducts FROM Products WHERE IsActive = 1`),
      query(`SELECT COUNT(*) AS totalcategories FROM Categories WHERE IsActive = 1`),
      query(
        `SELECT o.*, u.FullName FROM Orders o
         JOIN Users u ON o.UserId = u.UserId
         ORDER BY o.CreatedAt DESC
         LIMIT 10`
      ),
      query(
        `SELECT TO_CHAR(CreatedAt, 'YYYY-MM') AS month,
           SUM(TotalAmount) AS revenue,
           COUNT(*) AS orderCount
         FROM Orders
         WHERE Status != 'cancelled'
           AND CreatedAt >= (GETUTCDATE() - INTERVAL '6 months')
         GROUP BY TO_CHAR(CreatedAt, 'YYYY-MM')
         ORDER BY month`
      ),
      query(
        `SELECT TO_CHAR(CreatedAt::date, 'DD/MM') AS day,
           COUNT(*) AS orders
         FROM Orders
         WHERE CreatedAt >= (GETUTCDATE() - INTERVAL '7 days')
         GROUP BY CreatedAt::date, TO_CHAR(CreatedAt::date, 'DD/MM')
         ORDER BY CreatedAt::date`
      ),
      query(
        `SELECT c.Name AS name,
           COUNT(p.ProductId) AS count,
           COALESCE(SUM(p.SoldCount * p.Price), 0) AS revenue
         FROM Categories c
         LEFT JOIN Products p ON p.CategoryId = c.CategoryId AND p.IsActive = 1
         GROUP BY c.Name
         ORDER BY revenue DESC
         LIMIT 5`
      ),
      query(`SELECT Status, COUNT(*) AS count FROM Orders GROUP BY Status`),
      query(
        `SELECT COALESCE(SUM(TotalAmount), 0) AS revenue, COUNT(*) AS orders
         FROM Orders
         WHERE CAST(CreatedAt AS DATE) = CAST(GETUTCDATE() AS DATE)
           AND Status != 'cancelled'`
      ),
      query(
        `SELECT COALESCE(SUM(TotalAmount), 0) AS revenue, COUNT(*) AS orders
         FROM Orders
         WHERE CAST(CreatedAt AS DATE) = CAST((GETUTCDATE() - INTERVAL '1 day') AS DATE)
           AND Status != 'cancelled'`
      ),
      query(
        `SELECT
           p.ProductId,
           p.Name,
           c.Name AS CategoryName,
           (SELECT ImageUrl FROM ProductImages
            WHERE ProductId = p.ProductId
            ORDER BY IsPrimary DESC, SortOrder LIMIT 1) AS PrimaryImage,
           SUM(od.Quantity) AS soldCount,
           SUM(od.Total)    AS revenue
         FROM OrderDetails od
         JOIN Orders o  ON o.OrderId  = od.OrderId  AND o.Status != 'cancelled'
         JOIN Products p ON p.ProductId = od.ProductId
         LEFT JOIN Categories c ON c.CategoryId = p.CategoryId
         GROUP BY p.ProductId, p.Name, c.Name
         ORDER BY revenue DESC
         LIMIT 10`
      ),
      query(
        `SELECT
           c.Name AS name,
           COALESCE(SUM(od.Total), 0) AS revenue,
           COALESCE(SUM(od.Quantity), 0) AS soldCount
         FROM Categories c
         LEFT JOIN Products p  ON p.CategoryId  = c.CategoryId
         LEFT JOIN OrderDetails od ON od.ProductId = p.ProductId
         LEFT JOIN Orders o   ON o.OrderId    = od.OrderId AND o.Status != 'cancelled'
         GROUP BY c.Name
         ORDER BY revenue DESC
         LIMIT 8`
      ),
      query(
        `SELECT
           CASE
             WHEN PaymentMethod = 'cod'    THEN 'COD'
             WHEN PaymentProvider IS NOT NULL THEN PaymentProvider
             ELSE 'Online'
           END AS name,
           COUNT(*)                        AS value,
           COALESCE(SUM(TotalAmount), 0)     AS total
         FROM Orders
         WHERE Status != 'cancelled'
         GROUP BY
           CASE
             WHEN PaymentMethod = 'cod'    THEN 'COD'
             WHEN PaymentProvider IS NOT NULL THEN PaymentProvider
             ELSE 'Online'
           END`
      ),
      query(
        `SELECT TO_CHAR(CreatedAt, 'YYYY-MM') AS month,
           COUNT(*) AS newCustomers,
           0        AS returning
         FROM Users
         WHERE Role = 'user'
           AND CreatedAt >= (GETUTCDATE() - INTERVAL '6 months')
         GROUP BY TO_CHAR(CreatedAt, 'YYYY-MM')
         ORDER BY month`
      ),
      query(
        `SELECT
           u.UserId, u.FullName, u.Email, u.Avatar,
           COUNT(o.OrderId)              AS totalOrders,
           COALESCE(SUM(o.TotalAmount), 0) AS totalSpent
         FROM Users u
         JOIN Orders o ON o.UserId = u.UserId AND o.Status != 'cancelled'
         WHERE u.Role = 'user'
         GROUP BY u.UserId, u.FullName, u.Email, u.Avatar
         ORDER BY totalSpent DESC
         LIMIT 10`
      ),
      query(
        `SELECT
           SUM(CASE WHEN Stock >  10 THEN 1 ELSE 0 END) AS inStock,
           SUM(CASE WHEN Stock >   0 AND Stock <= 10 THEN 1 ELSE 0 END) AS lowStock,
           SUM(CASE WHEN Stock =   0 THEN 1 ELSE 0 END) AS outOfStock
         FROM Products WHERE IsActive = 1`
      ),
      query(
        `SELECT ProductId, Name, Stock
         FROM Products
         WHERE IsActive = 1 AND Stock > 0 AND Stock <= 10
         ORDER BY Stock ASC
         LIMIT 5`
      ),
      query(
        `SELECT
           COALESCE(AVG(CAST(Rating AS FLOAT)), 0) AS avg,
           COUNT(*) AS total
         FROM Reviews`
      ),
      query(
        `SELECT Rating, COUNT(*) AS count
         FROM Reviews
         GROUP BY Rating
         ORDER BY Rating DESC`
      ),
      // ── Growth thật cho từng thẻ (so sánh theo khoảng thời gian thật,
      //    không có sẵn snapshot lịch sử nên KHÔNG tính được cho tồn kho/đơn chờ xử lý) ──
      query(
        `SELECT
           COUNT(*) AS now,
           COUNT(*) FILTER (WHERE CreatedAt < date_trunc('month', GETUTCDATE())) AS monthago
         FROM Users WHERE Role = 'user'`
      ),
      query(
        `SELECT
           COUNT(*) AS now,
           COUNT(*) FILTER (WHERE CreatedAt < date_trunc('month', GETUTCDATE())) AS monthago
         FROM Products WHERE IsActive = 1`
      ),
      query(
        `SELECT
           COUNT(*) FILTER (WHERE CreatedAt >= date_trunc('week', GETUTCDATE())) AS totalthisweek,
           COUNT(*) FILTER (WHERE CreatedAt >= date_trunc('week', GETUTCDATE()) AND Status = 'completed') AS completedthisweek,
           COUNT(*) FILTER (WHERE CreatedAt >= date_trunc('week', GETUTCDATE() - INTERVAL '7 days')
                              AND CreatedAt <  date_trunc('week', GETUTCDATE())) AS totallastweek,
           COUNT(*) FILTER (WHERE CreatedAt >= date_trunc('week', GETUTCDATE() - INTERVAL '7 days')
                              AND CreatedAt <  date_trunc('week', GETUTCDATE())
                              AND Status = 'completed') AS completedlastweek
         FROM Orders`
      ),
      query(
        `SELECT
           COALESCE(AVG(TotalAmount) FILTER (
             WHERE CreatedAt >= date_trunc('month', GETUTCDATE()) AND Status != 'cancelled'), 0) AS avgthismonth,
           COALESCE(AVG(TotalAmount) FILTER (
             WHERE CreatedAt >= date_trunc('month', GETUTCDATE() - INTERVAL '1 month')
               AND CreatedAt <  date_trunc('month', GETUTCDATE()) AND Status != 'cancelled'), 0) AS avglastmonth
         FROM Orders`
      ),
    ]);

    const todayRev     = todayStats.recordset[0]?.revenue || 0;
    const yesterdayRev = yesterdayStats.recordset[0]?.revenue || 1;
    const growth = yesterdayRev
      ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100)
      : todayRev > 0 ? 100 : 0;

    const statsMap = {};
    orderStats.recordset.forEach((row) => { statsMap[row.Status] = row.count; });

    const distMap = {};
    reviewDist.recordset.forEach((r) => { distMap[r.Rating] = r.count; });
    const reviewDistArr = [5, 4, 3, 2, 1].map((s) => distMap[s] || 0);

    // ── Growth thật cho từng thẻ ──
    const pctChange = (now, prev) => {
      now = Number(now) || 0;
      prev = Number(prev) || 0;
      if (prev === 0) return now > 0 ? 100 : 0;
      return Math.round(((now - prev) / prev) * 100);
    };

    const custRow = customersGrowthRaw.recordset[0] || {};
    const customersGrowth = pctChange(custRow.now, custRow.monthago);

    const prodRow = productsGrowthRaw.recordset[0] || {};
    const productsGrowth = pctChange(prodRow.now, prodRow.monthago);

    const wkRow = weeklyOrdersRaw.recordset[0] || {};
    const ordersGrowth = pctChange(wkRow.totalthisweek, wkRow.totallastweek);
    const convThisWeek = Number(wkRow.totalthisweek) ? (Number(wkRow.completedthisweek) / Number(wkRow.totalthisweek)) * 100 : 0;
    const convLastWeek = Number(wkRow.totallastweek) ? (Number(wkRow.completedlastweek) / Number(wkRow.totallastweek)) * 100 : 0;
    const conversionGrowth = pctChange(convThisWeek, convLastWeek);

    const avgRow = avgOrderGrowthRaw.recordset[0] || {};
    const avgOrderGrowth = pctChange(avgRow.avgthismonth, avgRow.avglastmonth);

    res.json({
      success: true,
      data: {
        stats: {
          totalRevenue:    revenue.recordset[0].totalrevenue,
          totalOrders:     orders.recordset[0].totalorderscount,
          totalCustomers:  customers.recordset[0].totalcustomers,
          totalProducts:   products.recordset[0].totalproducts,
          totalCategories: categories.recordset[0].totalcategories,
        },
        growth,
        cardGrowth: {
          orders: ordersGrowth,
          customers: customersGrowth,
          products: productsGrowth,
          conversionRate: conversionGrowth,
          avgOrderValue: avgOrderGrowth,
          // Không có bảng lưu snapshot lịch sử tồn kho / trạng thái đơn theo ngày,
          // nên KHÔNG thể tính growth thật cho 2 chỉ số này — trả null để frontend
          // biết mà ẩn badge %, tránh hiện số bịa.
          inventoryAlerts: null,
          pendingOrders: null,
        },
        orderStats: {
          pending:   statsMap.pending   || 0,
          confirmed: statsMap.confirmed || 0,
          shipping:  statsMap.shipping  || 0,
          completed: statsMap.completed || 0,
          cancelled: statsMap.cancelled || 0,
        },
        recentOrders:     recentOrders.recordset,
        revenueChart:     revenueChart.recordset,
        orderChart:       orderChart.recordset,
        productChart:     productChart.recordset,
        topProducts:      topProducts.recordset,
        categoryRevenue:  categoryRevenue.recordset,
        paymentStats:     paymentStats.recordset,
        customerChart:    customerChart.recordset,
        vipCustomers:     vipCustomers.recordset,
        inventoryStats:   inventoryStats.recordset[0] || { inStock: 0, lowStock: 0, outOfStock: 0 },
        lowStockProducts: lowStockProducts.recordset,
        reviewStats: {
          avg:   reviewStats.recordset[0]?.avg   || 0,
          total: reviewStats.recordset[0]?.total || 0,
          dist:  reviewDistArr,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit || 10);
    const { search, role } = req.query;

    let where = 'WHERE 1=1';
    const params = { offset, limit };

    if (search?.trim()) {
      where += ' AND (Email LIKE @search OR FullName LIKE @search)';
      params.search = `%${search.trim()}%`;
    }
    if (role && role !== 'all') {
      where += ' AND Role = @role';
      params.role = role;
    }

    const countResult = await query(`SELECT COUNT(*) AS total FROM Users ${where}`, params);
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT UserId, Email, FullName, Phone, Address, DateOfBirth, Role, IsActive, IsVerified, PhoneVerified,
          VerifyRequested, PhoneVerifyRequested, CreatedAt, UpdatedAt, LastChangedFields, Avatar
       FROM Users ${where}
       ORDER BY CreatedAt DESC
       LIMIT @limit OFFSET @offset`,
      params
    );

    res.json({
      success: true,
      data: result.recordset,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingVerifyUsers = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT UserId, Email, FullName, Phone, Role, IsActive, IsVerified, VerifyRequested, CreatedAt, Avatar
       FROM Users
       WHERE IsVerified = 0 AND VerifyRequested = 1
       ORDER BY CreatedAt ASC`
    );
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

export const getPendingVerifyPhoneUsers = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT UserId, Email, FullName, Phone, Role, IsActive, PhoneVerified, PhoneVerifyRequested, CreatedAt, Avatar
       FROM Users
       WHERE PhoneVerified = 0 AND PhoneVerifyRequested = 1
       ORDER BY CreatedAt ASC`
    );
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

export const verifyUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const target = await query('SELECT UserId, Email FROM Users WHERE UserId = @id', { id });
    if (!target.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    if (approved) {
      await query(
        `UPDATE Users SET IsVerified = 1, VerifyRequested = 0, UpdatedAt = GETUTCDATE()
         WHERE UserId = @id`,
        { id }
      );
    } else {
      await query(
        `UPDATE Users SET IsVerified = 0, VerifyRequested = 0, UpdatedAt = GETUTCDATE()
         WHERE UserId = @id`,
        { id }
      );
    }

    res.json({
      success: true,
      message: approved ? 'Đã xác thực tài khoản' : 'Đã từ chối xác thực',
    });
  } catch (err) {
    next(err);
  }
};

export const verifyUserPhone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const target = await query('SELECT UserId, Phone FROM Users WHERE UserId = @id', { id });
    if (!target.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    if (approved) {
      await query(
        `UPDATE Users SET PhoneVerified = 1, PhoneVerifyRequested = 0, UpdatedAt = GETUTCDATE()
         WHERE UserId = @id`,
        { id }
      );
    } else {
      await query(
        `UPDATE Users SET PhoneVerified = 0, PhoneVerifyRequested = 0, UpdatedAt = GETUTCDATE()
         WHERE UserId = @id`,
        { id }
      );
    }

    res.json({
      success: true,
      message: approved ? 'Đã xác thực số điện thoại' : 'Đã từ chối xác thực số điện thoại',
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (userId === req.user.UserId) {
      return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản đang đăng nhập' });
    }

    const target = await query(
      'SELECT UserId, Email, Role FROM Users WHERE UserId = @id',
      { id: userId }
    );
    if (!target.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    if (target.recordset[0].Role === 'admin') {
      const admins = await query(
        "SELECT COUNT(*) AS total FROM Users WHERE Role = 'admin' AND IsActive = 1"
      );
      if (admins.recordset[0].total <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa admin cuối cùng đang hoạt động',
        });
      }
    }

    await query('DELETE FROM Reviews             WHERE UserId = @id', { id: userId });
    await query('DELETE FROM Cart                WHERE UserId = @id', { id: userId });
    await query('DELETE FROM Wishlists           WHERE UserId = @id', { id: userId });
    await query('DELETE FROM Orders              WHERE UserId = @id', { id: userId });
    await query('DELETE FROM PasswordResetTokens WHERE UserId = @id', { id: userId });
    const deleted = await query('DELETE FROM Users WHERE UserId = @id', { id: userId });

    if (deleted.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Không thể xóa người dùng' });
    }

    res.json({ success: true, message: `Đã xóa tài khoản ${target.recordset[0].Email}` });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    const changed = [];
    if (isActive !== undefined) changed.push('Trạng thái hoạt động');
    if (role !== undefined) changed.push('Vai trò');

    await query(
      `UPDATE Users SET
        IsActive  = COALESCE(@isActive, IsActive),
        Role      = COALESCE(@role,     Role),
        LastChangedFields = CASE WHEN @hasChanges = 1 THEN @lastChangedFields ELSE LastChangedFields END,
        UpdatedAt = GETUTCDATE()
       WHERE UserId = @id`,
      {
        id,
        isActive: isActive !== undefined ? (isActive ? 1 : 0) : undefined,
        role,
        hasChanges: changed.length ? 1 : 0,
        lastChangedFields: changed.length ? JSON.stringify(changed) : null,
      }
    );
    const result = await query(
      'SELECT UserId, Email, FullName, Phone, Role, IsActive, IsVerified, UpdatedAt, LastChangedFields FROM Users WHERE UserId = @id',
      { id }
    );
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const getAllProductsAdmin = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, c.Name AS CategoryName, b.Name AS BrandName,
        (SELECT ImageUrl FROM ProductImages
         WHERE ProductId = p.ProductId
         ORDER BY IsPrimary DESC, SortOrder LIMIT 1) AS PrimaryImage
       FROM Products p
       LEFT JOIN Categories c ON p.CategoryId = c.CategoryId
       LEFT JOIN Brands      b ON p.BrandId    = b.BrandId
       ORDER BY p.CreatedAt DESC`
    );
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

export const getProductAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT p.*, c.Name AS CategoryName, b.Name AS BrandName
       FROM Products p
       LEFT JOIN Categories c ON p.CategoryId = c.CategoryId
       LEFT JOIN Brands      b ON p.BrandId    = b.BrandId
       WHERE p.ProductId = @id`,
      { id }
    );
    const product = result.recordset[0];
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    const images = await query(
      `SELECT ImageId, ImageUrl, IsPrimary, SortOrder
       FROM ProductImages WHERE ProductId = @id ORDER BY SortOrder`,
      { id }
    );
    res.json({ success: true, data: { ...product, images: images.recordset } });
  } catch (err) {
    next(err);
  }
};