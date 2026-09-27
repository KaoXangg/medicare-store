import { query } from '../config/db.js';
import { generateOrderCode, paginate, getEffectivePrice } from '../utils/helpers.js';
import { sendEmail, orderConfirmationEmail } from '../utils/email.js';
import { v4 as uuidv4 } from 'uuid';

export const createOrder = async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      note,
      paymentMethod,
      couponCode,
      items,
      paymentProvider,
    } = req.body;

    let cartItems = items;
    if (!cartItems?.length) {
      const cart = await query(
        `SELECT c.Quantity, p.* FROM Cart c JOIN Products p ON c.ProductId = p.ProductId WHERE c.UserId = @userId`,
        { userId: req.user.UserId }
      );
      cartItems = cart.recordset.map((i) => ({
        productId: i.ProductId,
        quantity: i.Quantity,
        product: i,
      }));
    }

    if (!cartItems?.length) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }

    let subtotal = 0;
    const orderDetails = [];

    for (const item of cartItems) {
      const pResult = await query('SELECT * FROM Products WHERE ProductId = @id', {
        id: item.productId,
      });
      const product = pResult.recordset[0];
      if (!product || product.Stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${product?.Name || item.productId} không đủ tồn kho`,
        });
      }
      const price = getEffectivePrice(product);
      const total = price * item.quantity;
      subtotal += total;
      const img = await query(
        'SELECT TOP 1 ImageUrl FROM ProductImages WHERE ProductId = @id AND IsPrimary = 1',
        { id: product.ProductId }
      );
      orderDetails.push({
        productId: product.ProductId,
        productName: product.Name,
        productImage: img.recordset[0]?.ImageUrl,
        price,
        quantity: item.quantity,
        total,
      });
    }

    let discountAmount = 0;
    let couponId = null;
    if (couponCode) {
      const couponRes = await query(
        `SELECT * FROM Coupons WHERE Code = @code AND IsActive = 1 AND GETUTCDATE() BETWEEN StartDate AND EndDate`,
        { code: couponCode.toUpperCase() }
      );
      const coupon = couponRes.recordset[0];
      if (coupon && subtotal >= coupon.MinOrderAmount) {
        couponId = coupon.CouponId;
        if (coupon.DiscountType === 'percent') {
          discountAmount = (subtotal * coupon.DiscountValue) / 100;
          if (coupon.MaxDiscount) discountAmount = Math.min(discountAmount, coupon.MaxDiscount);
        } else {
          discountAmount = coupon.DiscountValue;
        }
      }
    }

    const shippingFee = subtotal >= 1000000 ? 0 : 30000;
    const totalAmount = subtotal - discountAmount + shippingFee;
    const orderCode = generateOrderCode();
    const paymentStatus = paymentMethod === 'online' ? 'unpaid' : 'unpaid';

    const orderResult = await query(
      `INSERT INTO Orders (UserId, OrderCode, CustomerName, CustomerPhone, CustomerEmail, ShippingAddress, Note,
        SubTotal, DiscountAmount, ShippingFee, TotalAmount, CouponId, Status, PaymentMethod, PaymentStatus, PaymentProvider)
       OUTPUT INSERTED.*
       VALUES (@userId, @orderCode, @customerName, @customerPhone, @customerEmail, @shippingAddress, @note,
        @subtotal, @discount, @shippingFee, @total, @couponId, 'pending', @paymentMethod, @paymentStatus, @paymentProvider)`,
      {
        userId: req.user.UserId,
        orderCode,
        customerName,
        customerPhone,
        customerEmail,
        shippingAddress,
        note: note || null,
        subtotal,
        discount: discountAmount,
        shippingFee,
        total: totalAmount,
        couponId,
        paymentMethod,
        paymentStatus,
        paymentProvider: paymentProvider || null,
      }
    );
    const order = orderResult.recordset[0];

    for (const detail of orderDetails) {
      await query(
        `INSERT INTO OrderDetails (OrderId, ProductId, ProductName, ProductImage, Price, Quantity, Total)
         VALUES (@orderId, @productId, @name, @image, @price, @qty, @total)`,
        {
          orderId: order.OrderId,
          productId: detail.productId,
          name: detail.productName,
          image: detail.productImage,
          price: detail.price,
          qty: detail.quantity,
          total: detail.total,
        }
      );
      await query(
        'UPDATE Products SET Stock = Stock - @qty, SoldCount = SoldCount + @qty WHERE ProductId = @id',
        { qty: detail.quantity, id: detail.productId }
      );
    }

    if (couponId) {
      await query('UPDATE Coupons SET UsedCount = UsedCount + 1 WHERE CouponId = @id', { id: couponId });
    }

    await query('DELETE FROM Cart WHERE UserId = @userId', { userId: req.user.UserId });

    const transactionId = paymentMethod === 'online' ? `TXN-${uuidv4().slice(0, 8).toUpperCase()}` : null;
    await query(
      `INSERT INTO Payments (OrderId, Amount, PaymentMethod, TransactionId, Status)
       VALUES (@orderId, @amount, @paymentMethod, @txnId, @status)`,
      {
        orderId: order.OrderId,
        amount: totalAmount,
        paymentMethod: paymentProvider || paymentMethod,
        txnId: transactionId,
        status: paymentMethod === 'online' ? 'pending' : 'pending',
      }
    );

    const detailsResult = await query('SELECT * FROM OrderDetails WHERE OrderId = @id', { id: order.OrderId });
    order.items = detailsResult.recordset;

    await sendEmail({
      to: customerEmail,
      subject: `MediCare Store - Đơn hàng #${orderCode}`,
      html: orderConfirmationEmail(order),
    });

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: {
        order,
        paymentUrl: paymentMethod === 'online' ? `/api/orders/${order.OrderId}/pay` : null,
        transactionId,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const payOnline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await query(
      'SELECT * FROM Orders WHERE OrderId = @id AND UserId = @userId',
      { id, userId: req.user.UserId }
    );
    if (!order.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }
    const o = order.recordset[0];
    if (o.PaymentMethod !== 'online') {
      return res.status(400).json({ success: false, message: 'Đơn hàng không dùng thanh toán online' });
    }
    // Simulate payment gateway success
    await query(
      `UPDATE Orders SET PaymentStatus = 'paid', Status = 'confirmed', UpdatedAt = GETUTCDATE() WHERE OrderId = @id`,
      { id }
    );
    await query(
      `UPDATE Payments SET Status = 'completed', PaidAt = GETUTCDATE() WHERE OrderId = @id`,
      { id }
    );
    res.json({ success: true, message: 'Thanh toán thành công', data: { orderId: id, status: 'paid' } });
  } catch (err) {
    next(err);
  }
};

const attachOrderItems = async (orders) => {
  if (!orders.length) return orders;
  const ids = orders.map((o) => o.OrderId);
  const details = await query(
    `SELECT * FROM OrderDetails WHERE OrderId IN (${ids.join(',')}) ORDER BY OrderDetailId`
  );
  return orders.map((o) => ({
    ...o,
    items: details.recordset.filter((d) => d.OrderId === o.OrderId),
    itemCount: details.recordset.filter((d) => d.OrderId === o.OrderId).length,
  }));
};

export const getMyOrders = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 0, 50);
    const topClause = limit > 0 ? `TOP (${limit})` : '';
    const result = await query(
      `SELECT ${topClause} * FROM Orders WHERE UserId = @userId ORDER BY CreatedAt DESC`,
      { userId: req.user.UserId }
    );
    const data = await attachOrderItems(result.recordset);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getMyOrder = async (req, res, next) => {
  try {
    const order = await query(
      'SELECT * FROM Orders WHERE OrderId = @id AND UserId = @userId',
      { id: req.params.id, userId: req.user.UserId }
    );
    if (!order.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    const details = await query('SELECT * FROM OrderDetails WHERE OrderId = @id', { id: req.params.id });
    res.json({
      success: true,
      data: { ...order.recordset[0], items: details.recordset },
    });
  } catch (err) {
    next(err);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { status, userId } = req.query;
    const conditions = [];
    const params = { offset, limit };
    if (status) {
      conditions.push('o.Status = @status');
      params.status = status;
    }
    if (userId) {
      conditions.push('o.UserId = @userId');
      params.userId = userId;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const count = await query(`SELECT COUNT(*) AS total FROM Orders o ${where}`, params);

    // Khi lọc theo userId (vd: xem 5 đơn gần nhất của 1 khách trong trang chi tiết user),
    // chỉ cần TOP N mới nhất, không cần phân trang OFFSET/FETCH.
    const result = await query(
      userId
        ? `SELECT TOP (@limit) o.*, u.FullName AS UserName, u.Email AS UserEmail,
             (SELECT COUNT(*) FROM OrderDetails od WHERE od.OrderId = o.OrderId) AS ItemCount
           FROM Orders o
           JOIN Users u ON o.UserId = u.UserId ${where}
           ORDER BY o.CreatedAt DESC`
        : `SELECT o.*, u.FullName AS UserName, u.Email AS UserEmail,
             (SELECT COUNT(*) FROM OrderDetails od WHERE od.OrderId = o.OrderId) AS ItemCount
           FROM Orders o
           JOIN Users u ON o.UserId = u.UserId ${where}
           ORDER BY o.CreatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      params
    );

    const data = await attachOrderItems(result.recordset);
    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count.recordset[0].total,
        totalPages: Math.ceil(count.recordset[0].total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await query(
      `SELECT o.*, u.FullName, u.Email FROM Orders o JOIN Users u ON o.UserId = u.UserId WHERE o.OrderId = @id`,
      { id: req.params.id }
    );
    if (!order.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    }
    const details = await query('SELECT * FROM OrderDetails WHERE OrderId = @id', { id: req.params.id });
    res.json({ success: true, data: { ...order.recordset[0], items: details.recordset } });
  } catch (err) {
    next(err);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const orderRes = await query('SELECT OrderId, OrderCode, Status FROM Orders WHERE OrderId = @id', { id });
    if (!orderRes.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }

    const details = await query(
      'SELECT ProductId, Quantity FROM OrderDetails WHERE OrderId = @id',
      { id }
    );

    if (orderRes.recordset[0].Status !== 'cancelled') {
      for (const line of details.recordset) {
        await query(
          `UPDATE Products SET Stock = Stock + @qty,
           SoldCount = CASE WHEN SoldCount >= @qty THEN SoldCount - @qty ELSE 0 END
           WHERE ProductId = @pid`,
          { qty: line.Quantity, pid: line.ProductId }
        );
      }
    }

    await query('DELETE FROM Orders WHERE OrderId = @id', { id });

    res.json({
      success: true,
      message: `Đã xóa đơn hàng #${orderRes.recordset[0].OrderCode}`,
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    await query('UPDATE Orders SET Status = @status, UpdatedAt = GETUTCDATE() WHERE OrderId = @id', {
      status,
      id: req.params.id,
    });
    if (status === 'completed') {
      await query('UPDATE Orders SET PaymentStatus = \'paid\' WHERE OrderId = @id AND PaymentMethod = \'cod\'', {
        id: req.params.id,
      });
    }
    const result = await query('SELECT * FROM Orders WHERE OrderId = @id', { id: req.params.id });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};