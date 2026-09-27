import { query } from '../config/db.js';
import { slug } from '../utils/helpers.js';

const resolveLogo = (req) => {
  if (req.body?.logoUrl?.trim()) {
    const u = req.body.logoUrl.trim();
    if (/^https?:\/\//i.test(u) || u.startsWith('/uploads/')) return u;
  }
  if (req.file) return `/uploads/brands/${req.file.filename}`;
  return null;
};

export const getBrands = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const sql = activeOnly
      ? 'SELECT * FROM Brands WHERE IsActive = 1 ORDER BY Name'
      : 'SELECT * FROM Brands ORDER BY Name';
    const result = await query(sql);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

export const createBrand = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên thương hiệu bắt buộc' });
    }
    const brandSlug = req.body.slug || slug(name);
    const logo = resolveLogo(req);
    const result = await query(
      `INSERT INTO Brands (Name, Slug, Logo, Description) OUTPUT INSERTED.* VALUES (@name, @brandSlug, @logo, @description)`,
      { name, brandSlug, logo, description: req.body.description?.trim() || null }
    );
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const logo = resolveLogo(req);
    await query(
      `UPDATE Brands SET
        Name = COALESCE(@name, Name),
        Slug = COALESCE(@brandSlug, Slug),
        Logo = COALESCE(@logo, Logo),
        Description = COALESCE(@description, Description)
       WHERE BrandId = @id`,
      {
        id,
        name: req.body.name || null,
        brandSlug: req.body.slug || null,
        logo,
        description: req.body.description !== undefined ? req.body.description?.trim() || null : undefined,
      }
    );
    const result = await query('SELECT * FROM Brands WHERE BrandId = @id', { id });
    if (!result.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Thương hiệu không tồn tại' });
    }
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const setBrandVisibility = async (req, res, next) => {
  try {
    const isActive =
      req.body.isActive === true || req.body.isActive === 'true' || req.body.isActive === 1;
    const result = await query(
      `UPDATE Brands SET IsActive = @isActive OUTPUT INSERTED.* WHERE BrandId = @id`,
      { id: req.params.id, isActive: isActive ? 1 : 0 }
    );
    if (!result.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Thương hiệu không tồn tại' });
    }
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inUse = await query('SELECT COUNT(*) AS cnt FROM Products WHERE BrandId = @id', { id });
    if (inUse.recordset[0].cnt > 0) {
      return res.status(400).json({
        success: false,
        message: 'Thương hiệu đang được sử dụng bởi sản phẩm. Hãy ẩn thay vì xóa.',
      });
    }
    await query('DELETE FROM Brands WHERE BrandId = @id', { id });
    res.json({ success: true, message: 'Đã xóa thương hiệu' });
  } catch (err) {
    next(err);
  }
};
