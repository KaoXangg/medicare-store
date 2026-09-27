import { query } from '../config/db.js';
import { getEffectivePrice } from '../utils/helpers.js';

export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.UserId;
    const result = await query(
      `SELECT w.WishlistId, w.ProductId, w.CreatedAt,
        p.Name, p.Slug, p.Price, p.SalePrice, p.Stock,
        (SELECT TOP 1 ImageUrl FROM ProductImages WHERE ProductId = p.ProductId ORDER BY IsPrimary DESC, SortOrder) AS PrimaryImage
       FROM Wishlists w
       JOIN Products p ON w.ProductId = p.ProductId
       WHERE w.UserId = @userId AND p.IsActive = 1
       ORDER BY w.CreatedAt DESC`,
      { userId }
    );
    const items = result.recordset.map((row) => ({
      ...row,
      effectivePrice: getEffectivePrice(row),
    }));
    res.json({ success: true, data: items });
  } catch (err) {
    if (err.message?.includes('Wishlists')) {
      return res.json({ success: true, data: [] });
    }
    next(err);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.UserId;
    const productId = parseInt(req.body.productId, 10);
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Thiếu productId' });
    }

    const exists = await query('SELECT ProductId FROM Products WHERE ProductId = @id AND IsActive = 1', { id: productId });
    if (!exists.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    const dup = await query(
      'SELECT WishlistId FROM Wishlists WHERE UserId = @userId AND ProductId = @productId',
      { userId, productId }
    );
    if (dup.recordset[0]) {
      return res.json({ success: true, message: 'Đã có trong yêu thích' });
    }

    await query(
      'INSERT INTO Wishlists (UserId, ProductId) VALUES (@userId, @productId)',
      { userId, productId }
    );
    res.status(201).json({ success: true, message: 'Đã thêm vào yêu thích' });
  } catch (err) {
    next(err);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.UserId;
    const productId = parseInt(req.params.productId, 10);
    await query(
      'DELETE FROM Wishlists WHERE UserId = @userId AND ProductId = @productId',
      { userId, productId }
    );
    res.json({ success: true, message: 'Đã xóa khỏi yêu thích' });
  } catch (err) {
    next(err);
  }
};

export const getWishlistIds = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT ProductId FROM Wishlists WHERE UserId = @userId',
      { userId: req.user.UserId }
    );
    res.json({ success: true, data: result.recordset.map((r) => r.ProductId) });
  } catch (err) {
    if (err.message?.includes('Wishlists')) {
      return res.json({ success: true, data: [] });
    }
    next(err);
  }
};
