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
    ] = await Promise.all([
      query(`SELECT ISNULL(SUM(TotalAmount), 0) AS total FROM Orders WHERE Status != 'cancelled'`),
      query(`SELECT COUNT(*) AS total FROM Orders`),
      query(`SELECT COUNT(*) AS total FROM Users WHERE Role = 'user'`),
      query(`SELECT COUNT(*) AS total FROM Products WHERE IsActive = 1`),
      query(`SELECT COUNT(*) AS total FROM Categories WHERE IsActive = 1`),
      query(
        `SELECT TOP 10 o.*, u.FullName FROM Orders o
         JOIN Users u ON o.UserId = u.UserId
         ORDER BY o.CreatedAt DESC`
      ),
      query(
        `SELECT FORMAT(CreatedAt, 'yyyy-MM') AS month,
           SUM(TotalAmount) AS revenue,
           COUNT(*) AS orderCount
         FROM Orders
         WHERE Status != 'cancelled'
           AND CreatedAt >= DATEADD(month, -6, GETUTCDATE())
         GROUP BY FORMAT(CreatedAt, 'yyyy-MM')
         ORDER BY month`
      ),
      query(
        `SELECT FORMAT(CAST(CreatedAt AS DATE), 'dd/MM') AS day,
           COUNT(*) AS orders
         FROM Orders
         WHERE CreatedAt >= DATEADD(day, -7, GETUTCDATE())
         GROUP BY CAST(CreatedAt AS DATE), FORMAT(CAST(CreatedAt AS DATE), 'dd/MM')
         ORDER BY CAST(CreatedAt AS DATE)`
      ),
      query(
        `SELECT TOP 5 c.Name AS name,
           COUNT(p.ProductId) AS count,
           ISNULL(SUM(p.SoldCount * p.Price), 0) AS revenue
         FROM Categories c
         LEFT JOIN Products p ON p.CategoryId = c.CategoryId AND p.IsActive = 1
         GROUP BY c.Name
         ORDER BY revenue DESC`
      ),
      query(`SELECT Status, COUNT(*) AS count FROM Orders GROUP BY Status`),
      query(
        `SELECT ISNULL(SUM(TotalAmount), 0) AS revenue, COUNT(*) AS orders
         FROM Orders
         WHERE CAST(CreatedAt AS DATE) = CAST(GETUTCDATE() AS DATE)
           AND Status != 'cancelled'`
      ),
      query(
        `SELECT ISNULL(SUM(TotalAmount), 0) AS revenue, COUNT(*) AS orders
         FROM Orders
         WHERE CAST(CreatedAt AS DATE) = CAST(DATEADD(day, -1, GETUTCDATE()) AS DATE)
           AND Status != 'cancelled'`
      ),
      query(
        `SELECT TOP 10
           p.ProductId,
           p.Name,
           c.Name AS CategoryName,
           (SELECT TOP 1 ImageUrl FROM ProductImages
            WHERE ProductId = p.ProductId
            ORDER BY IsPrimary DESC, SortOrder) AS PrimaryImage,
           SUM(od.Quantity) AS soldCount,
           SUM(od.Total)    AS revenue
         FROM OrderDetails od
         JOIN Orders o  ON o.OrderId  = od.OrderId  AND o.Status != 'cancelled'
         JOIN Products p ON p.ProductId = od.ProductId
         LEFT JOIN Categories c ON c.CategoryId = p.CategoryId
         GROUP BY p.ProductId, p.Name, c.Name
         ORDER BY revenue DESC`
      ),
      query(
        `SELECT TOP 8
           c.Name AS name,
           ISNULL(SUM(od.Total), 0) AS revenue,
           ISNULL(SUM(od.Quantity), 0) AS soldCount
         FROM Categories c
         LEFT JOIN Products p  ON p.CategoryId  = c.CategoryId
         LEFT JOIN OrderDetails od ON od.ProductId = p.ProductId
         LEFT JOIN Orders o   ON o.OrderId    = od.OrderId AND o.Status != 'cancelled'
         GROUP BY c.Name
         ORDER BY revenue DESC`
      ),
      query(
        `SELECT
           CASE
             WHEN PaymentMethod = 'cod'    THEN 'COD'
             WHEN PaymentProvider IS NOT NULL THEN PaymentProvider
             ELSE 'Online'
           END AS name,
           COUNT(*)                        AS value,
           ISNULL(SUM(TotalAmount), 0)     AS total
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
        `SELECT FORMAT(CreatedAt, 'yyyy-MM') AS month,
           COUNT(*) AS newCustomers,
           0        AS returning
         FROM Users
         WHERE Role = 'user'
           AND CreatedAt >= DATEADD(month, -6, GETUTCDATE())
         GROUP BY FORMAT(CreatedAt, 'yyyy-MM')
         ORDER BY month`
      ),
      query(
        `SELECT TOP 10
           u.UserId, u.FullName, u.Email, u.Avatar,
           COUNT(o.OrderId)              AS totalOrders,
           ISNULL(SUM(o.TotalAmount), 0) AS totalSpent
         FROM Users u
         JOIN Orders o ON o.UserId = u.UserId AND o.Status != 'cancelled'
         WHERE u.Role = 'user'
         GROUP BY u.UserId, u.FullName, u.Email, u.Avatar
         ORDER BY totalSpent DESC`
      ),
      query(
        `SELECT
           SUM(CASE WHEN Stock >  10 THEN 1 ELSE 0 END) AS inStock,
           SUM(CASE WHEN Stock >   0 AND Stock <= 10 THEN 1 ELSE 0 END) AS lowStock,
           SUM(CASE WHEN Stock =   0 THEN 1 ELSE 0 END) AS outOfStock
         FROM Products WHERE IsActive = 1`
      ),
      query(
        `SELECT TOP 5 ProductId, Name, Stock
         FROM Products
         WHERE IsActive = 1 AND Stock > 0 AND Stock <= 10
         ORDER BY Stock ASC`
      ),
      query(
        `SELECT
           ISNULL(AVG(CAST(Rating AS FLOAT)), 0) AS avg,
           COUNT(*) AS total
         FROM Reviews`
      ),
      query(
        `SELECT Rating, COUNT(*) AS count
         FROM Reviews
         GROUP BY Rating
         ORDER BY Rating DESC`
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

    res.json({
      success: true,
      data: {
        stats: {
          totalRevenue:    revenue.recordset[0].total,
          totalOrders:     orders.recordset[0].total,
          totalCustomers:  customers.recordset[0].total,
          totalProducts:   products.recordset[0].total,
          totalCategories: categories.recordset[0].total,
        },
        growth,
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
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
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
        (SELECT TOP 1 ImageUrl FROM ProductImages
         WHERE ProductId = p.ProductId
         ORDER BY IsPrimary DESC, SortOrder) AS PrimaryImage
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