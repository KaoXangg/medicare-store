import { query } from '../config/db.js';
import { paginate } from '../utils/helpers.js';

const genWarrantyCode = () => {
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8).padEnd(8, '0');
  return `MC-WR-${rand}`;
};

const generateUniqueCode = async () => {
  for (let i = 0; i < 5; i++) {
    const code = genWarrantyCode();
    const existing = await query('SELECT WarrantyId FROM Warranties WHERE WarrantyCode = @code', { code });
    if (!existing.recordset.length) return code;
  }
  return `MC-WR-${Date.now()}`;
};

const normalizePhone = (phone) => (phone || '').replace(/[^\d]/g, '');

const computeStatus = (row) => {
  if (row.Status === 'void') return 'void';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(row.ExpiryDate);
  return expiry < today ? 'expired' : 'active';
};

const maskCode = (code) => {
  if (!code) return '';
  const parts = code.split('-');
  const last = parts[parts.length - 1] || '';
  const visible = last.slice(0, Math.ceil(last.length / 2));
  const hidden = '•'.repeat(last.length - visible.length);
  parts[parts.length - 1] = visible + hidden;
  return parts.join('-');
};

export const lookupByPhone = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.query.phone);
    if (!phone || phone.length < 8) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại hợp lệ' });
    }

    const result = await query(
      `SELECT WarrantyId, WarrantyCode, CustomerName, Phone, ProductName, PurchaseDate, ExpiryDate, Status
       FROM Warranties WHERE REPLACE(REPLACE(REPLACE(Phone,' ',''),'-',''),'.','') = @phone
       ORDER BY ExpiryDate DESC`,
      { phone }
    );

    if (!result.recordset.length) {
      return res.json({ success: true, data: [] });
    }

    const data = result.recordset.map((r) => ({
      warrantyCode: r.WarrantyCode,
      customerName: r.CustomerName,
      productName: r.ProductName,
      purchaseDate: r.PurchaseDate,
      expiryDate: r.ExpiryDate,
      status: computeStatus(r),
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getWarranties = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search, status } = req.query;

    let where = 'WHERE 1=1';
    const params = { offset, limit };

    if (search) {
      where += ' AND (CustomerName LIKE @search OR Phone LIKE @search OR WarrantyCode LIKE @search OR ProductName LIKE @search)';
      params.search = `%${search}%`;
    }

    const countResult = await query(`SELECT COUNT(*) AS total FROM Warranties ${where}`, params);
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT * FROM Warranties ${where}
       ORDER BY CreatedAt DESC
       LIMIT @limit OFFSET @offset`,
      params
    );

    let data = result.recordset.map((r) => ({
      ...r,
      ComputedStatus: computeStatus(r),
      MaskedCode: maskCode(r.WarrantyCode),
    }));

    if (status) {
      data = data.filter((d) => d.ComputedStatus === status);
    }

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

export const getWarrantyStats = async (req, res, next) => {
  try {
    const result = await query('SELECT Status, ExpiryDate FROM Warranties');
    let active = 0, expired = 0, voided = 0;
    result.recordset.forEach((r) => {
      const s = computeStatus(r);
      if (s === 'active') active++;
      else if (s === 'expired') expired++;
      else voided++;
    });
    res.json({ success: true, data: { total: result.recordset.length, active, expired, voided } });
  } catch (err) {
    next(err);
  }
};

export const createWarranty = async (req, res, next) => {
  try {
    const { customerName, phone, productId, productName, orderId, purchaseDate, expiryDate, notes } = req.body;
    if (!customerName || !phone || !productName || !purchaseDate || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    const warrantyCode = await generateUniqueCode();

    const result = await query(
      `INSERT INTO Warranties (WarrantyCode, CustomerName, Phone, ProductId, ProductName, OrderId, PurchaseDate, ExpiryDate, Notes)
       VALUES (@warrantyCode, @customerName, @phone, @productId, @productName, @orderId, @purchaseDate, @expiryDate, @notes)
       RETURNING *`,
      {
        warrantyCode,
        customerName,
        phone,
        productId: productId || null,
        productName,
        orderId: orderId || null,
        purchaseDate,
        expiryDate,
        notes: notes || null,
      }
    );
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const updateWarranty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customerName, phone, productName, purchaseDate, expiryDate, status, notes } = req.body;

    await query(
      `UPDATE Warranties SET
        CustomerName = COALESCE(@customerName, CustomerName),
        Phone = COALESCE(@phone, Phone),
        ProductName = COALESCE(@productName, ProductName),
        PurchaseDate = COALESCE(@purchaseDate, PurchaseDate),
        ExpiryDate = COALESCE(@expiryDate, ExpiryDate),
        Status = COALESCE(@status, Status),
        Notes = @notes,
        UpdatedAt = GETUTCDATE()
       WHERE WarrantyId = @id`,
      {
        id,
        customerName: customerName || null,
        phone: phone || null,
        productName: productName || null,
        purchaseDate: purchaseDate || null,
        expiryDate: expiryDate || null,
        status: status || null,
        notes: notes !== undefined ? notes : null,
      }
    );

    const result = await query('SELECT * FROM Warranties WHERE WarrantyId = @id', { id });
    if (!result.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu bảo hành' });
    }
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteWarranty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exists = await query('SELECT WarrantyId FROM Warranties WHERE WarrantyId = @id', { id });
    if (!exists.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu bảo hành' });
    }
    await query('DELETE FROM Warranties WHERE WarrantyId = @id', { id });
    res.json({ success: true, message: 'Đã xóa phiếu bảo hành' });
  } catch (err) {
    next(err);
  }
};
