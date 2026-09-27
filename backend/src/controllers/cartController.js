import { query } from '../config/db.js';
import { getEffectivePrice } from '../utils/helpers.js';

const cartQuery = `
  SELECT c.CartId, c.Quantity, c.ProductId,
    p.Name, p.Slug, p.Price, p.SalePrice, p.Stock,
    (SELECT TOP 1 ImageUrl FROM ProductImages WHERE ProductId = p.ProductId AND IsPrimary = 1) AS ImageUrl
  FROM Cart c JOIN Products p ON c.ProductId = p.ProductId
  WHERE c.UserId = @userId AND p.IsActive = 1
`;

export const getCart = async (req, res, next) => {
  try {
    const result = await query(cartQuery, { userId: req.user.UserId });
    const items = result.recordset.map((item) => ({
      ...item,
      effectivePrice: getEffectivePrice(item),
      subtotal: getEffectivePrice(item) * item.Quantity,
    }));
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    res.json({ success: true, data: { items, total, count: items.length } });
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await query('SELECT ProductId, Stock FROM Products WHERE ProductId = @id AND IsActive = 1', {
      id: productId,
    });
    if (!product.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    const existing = await query(
      'SELECT CartId, Quantity FROM Cart WHERE UserId = @userId AND ProductId = @productId',
      { userId: req.user.UserId, productId }
    );
    const newQty = (existing.recordset[0]?.Quantity || 0) + quantity;
    if (newQty > product.recordset[0].Stock) {
      return res.status(400).json({ success: false, message: 'Vượt quá số lượng tồn kho' });
    }
    if (existing.recordset[0]) {
      await query('UPDATE Cart SET Quantity = @qty, UpdatedAt = GETUTCDATE() WHERE CartId = @cartId', {
        qty: newQty,
        cartId: existing.recordset[0].CartId,
      });
    } else {
      await query(
        'INSERT INTO Cart (UserId, ProductId, Quantity) VALUES (@userId, @productId, @quantity)',
        { userId: req.user.UserId, productId, quantity }
      );
    }
    const cart = await query(cartQuery, { userId: req.user.UserId });
    res.json({ success: true, message: 'Đã thêm vào giỏ hàng', data: cart.recordset });
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cartItem = await query(
      'SELECT c.CartId, p.Stock FROM Cart c JOIN Products p ON c.ProductId = p.ProductId WHERE c.CartId = @id AND c.UserId = @userId',
      { id: req.params.id, userId: req.user.UserId }
    );
    if (!cartItem.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    }
    if (quantity > cartItem.recordset[0].Stock) {
      return res.status(400).json({ success: false, message: 'Vượt quá tồn kho' });
    }
    if (quantity < 1) {
      await query('DELETE FROM Cart WHERE CartId = @id', { id: req.params.id });
    } else {
      await query('UPDATE Cart SET Quantity = @quantity, UpdatedAt = GETUTCDATE() WHERE CartId = @id', {
        quantity,
        id: req.params.id,
      });
    }
    const result = await query(cartQuery, { userId: req.user.UserId });
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    await query('DELETE FROM Cart WHERE CartId = @id AND UserId = @userId', {
      id: req.params.id,
      userId: req.user.UserId,
    });
    const result = await query(cartQuery, { userId: req.user.UserId });
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    await query('DELETE FROM Cart WHERE UserId = @userId', { userId: req.user.UserId });
    res.json({ success: true, message: 'Đã xóa giỏ hàng' });
  } catch (err) {
    next(err);
  }
};
