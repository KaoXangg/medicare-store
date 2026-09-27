import { query } from '../config/db.js';

const parseNum = (v) => (v !== undefined && v !== '' && v !== null ? Number(v) : null);

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const result = await query(
      `SELECT * FROM Coupons WHERE Code = @code AND IsActive = 1 
       AND GETUTCDATE() BETWEEN StartDate AND EndDate`,
      { code: code.toUpperCase() }
    );
    const coupon = result.recordset[0];
    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá không hợp lệ' });
    }
    if (coupon.UsageLimit && coupon.UsedCount >= coupon.UsageLimit) {
      return res.status(400).json({ success: false, message: 'Mã đã hết lượt sử dụng' });
    }
    if (subtotal < coupon.MinOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Đơn tối thiểu ${Number(coupon.MinOrderAmount).toLocaleString('vi-VN')}đ`,
      });
    }
    let discount = 0;
    if (coupon.DiscountType === 'percent') {
      discount = (subtotal * coupon.DiscountValue) / 100;
      if (coupon.MaxDiscount) discount = Math.min(discount, coupon.MaxDiscount);
    } else {
      discount = coupon.DiscountValue;
    }
    res.json({
      success: true,
      data: { couponId: coupon.CouponId, code: coupon.Code, discountAmount: discount },
    });
  } catch (err) {
    next(err);
  }
};

export const getCoupons = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM Coupons ORDER BY CouponId DESC');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const body = req.body;
    const code = (body.code || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá không được để trống' });
    }
    if (!body.discountType || !['percent', 'fixed'].includes(body.discountType)) {
      return res.status(400).json({ success: false, message: 'Loại giảm giá không hợp lệ' });
    }
    const discountValue = parseNum(body.discountValue);
    if (!discountValue || discountValue <= 0) {
      return res.status(400).json({ success: false, message: 'Giá trị giảm phải lớn hơn 0' });
    }
    if (body.discountType === 'percent' && discountValue > 100) {
      return res.status(400).json({ success: false, message: 'Giảm % tối đa 100' });
    }
    if (!body.startDate || !body.endDate) {
      return res.status(400).json({ success: false, message: 'Cần ngày bắt đầu và kết thúc' });
    }

    const dup = await query('SELECT CouponId FROM Coupons WHERE Code = @code', { code });
    if (dup.recordset[0]) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã tồn tại' });
    }

    const result = await query(
      `INSERT INTO Coupons (Code, Description, DiscountType, DiscountValue, MinOrderAmount, MaxDiscount, UsageLimit, StartDate, EndDate, IsActive)
       OUTPUT INSERTED.*
       VALUES (@code, @description, @discountType, @discountValue, @minOrder, @maxDiscount, @usageLimit, @startDate, @endDate, @isActive)`,
      {
        code,
        description: body.description?.trim() || null,
        discountType: body.discountType,
        discountValue,
        minOrder: parseNum(body.minOrderAmount) ?? 0,
        maxDiscount: parseNum(body.maxDiscount),
        usageLimit: parseNum(body.usageLimit),
        startDate: body.startDate,
        endDate: body.endDate,
        isActive: body.isActive === false || body.isActive === 'false' ? 0 : 1,
      }
    );
    res.status(201).json({ success: true, data: result.recordset[0], message: 'Đã tạo mã giảm giá' });
  } catch (err) {
    next(err);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body;
    const exists = await query('SELECT CouponId FROM Coupons WHERE CouponId = @id', { id });
    if (!exists.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
    }

    const code = body.code ? body.code.trim().toUpperCase() : undefined;
    if (code) {
      const dup = await query(
        'SELECT CouponId FROM Coupons WHERE Code = @code AND CouponId <> @id',
        { code, id }
      );
      if (dup.recordset[0]) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá đã tồn tại' });
      }
    }

    await query(
      `UPDATE Coupons SET
        Code = COALESCE(@code, Code),
        Description = COALESCE(@description, Description),
        DiscountType = COALESCE(@discountType, DiscountType),
        DiscountValue = COALESCE(@discountValue, DiscountValue),
        MinOrderAmount = COALESCE(@minOrder, MinOrderAmount),
        MaxDiscount = @maxDiscount,
        UsageLimit = @usageLimit,
        StartDate = COALESCE(@startDate, StartDate),
        EndDate = COALESCE(@endDate, EndDate),
        IsActive = COALESCE(@isActive, IsActive)
       WHERE CouponId = @id`,
      {
        id,
        code,
        description: body.description !== undefined ? (body.description?.trim() || null) : undefined,
        discountType: body.discountType,
        discountValue: parseNum(body.discountValue),
        minOrder: parseNum(body.minOrderAmount),
        maxDiscount: body.maxDiscount !== undefined ? parseNum(body.maxDiscount) : undefined,
        usageLimit: body.usageLimit !== undefined ? parseNum(body.usageLimit) : undefined,
        startDate: body.startDate,
        endDate: body.endDate,
        isActive:
          body.isActive !== undefined
            ? body.isActive === true || body.isActive === 'true' || body.isActive === 1
              ? 1
              : 0
            : undefined,
      }
    );

    const result = await query('SELECT * FROM Coupons WHERE CouponId = @id', { id });
    res.json({ success: true, data: result.recordset[0], message: 'Đã cập nhật mã giảm giá' });
  } catch (err) {
    next(err);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const exists = await query('SELECT CouponId, Code FROM Coupons WHERE CouponId = @id', { id });
    if (!exists.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
    }

    // Gỡ liên kết đơn hàng (DiscountAmount vẫn giữ trên đơn)
    await query('UPDATE Orders SET CouponId = NULL WHERE CouponId = @id', { id });
    await query('DELETE FROM Coupons WHERE CouponId = @id', { id });

    res.json({
      success: true,
      message: `Đã xóa mã "${exists.recordset[0].Code}"`,
    });
  } catch (err) {
    next(err);
  }
};
