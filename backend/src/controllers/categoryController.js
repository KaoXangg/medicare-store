import { query } from '../config/db.js';
import { slug } from '../utils/helpers.js';

const resolveCategoryImage = (req) => {
  if (req.file) {
    return `/uploads/categories/${req.file.filename}`;
  }
  const url = (req.body?.imageUrl || req.body?.image || '').trim();
  if (url && (/^https?:\/\//i.test(url) || url.startsWith('/uploads/'))) {
    return url;
  }
  return null;
};

export const getCategories = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const where = activeOnly ? 'WHERE IsActive = 1' : '';
    const result = await query(`SELECT * FROM Categories ${where} ORDER BY SortOrder, Name`);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM Categories WHERE CategoryId = @id', { id: req.params.id });
    if (!result.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
    }
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, sortOrder } = req.body;
    const categorySlug = slug(name);
    const image = resolveCategoryImage(req);
    const result = await query(
      `INSERT INTO Categories (Name, Slug, Description, Image, SortOrder)
       VALUES (@name, @categorySlug, @description, @image, @sortOrder)
       RETURNING *`,
      {
        name,
        categorySlug,
        description: description || null,
        image,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
      }
    );
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, sortOrder, isActive } = req.body;
    const newImage = resolveCategoryImage(req);

    const params = {
      id,
      name: name || null,
      categorySlug: name ? slug(name) : null,
      description: description !== undefined ? description || null : null,
      sortOrder: sortOrder !== undefined && sortOrder !== '' ? parseInt(sortOrder, 10) : null,
      isActive:
        isActive !== undefined ? (isActive === 'true' || isActive === true ? 1 : 0) : null,
    };

    let imageClause = '';
    if (newImage) {
      imageClause = 'Image = @image,';
      params.image = newImage;
    }

    await query(
      `UPDATE Categories SET
        Name = COALESCE(@name, Name),
        Slug = CASE WHEN @name IS NOT NULL THEN @categorySlug ELSE Slug END,
        Description = CASE WHEN @description IS NOT NULL THEN @description ELSE Description END,
        ${imageClause}
        SortOrder = COALESCE(@sortOrder, SortOrder),
        IsActive = COALESCE(@isActive, IsActive)
       WHERE CategoryId = @id`,
      params
    );

    const result = await query('SELECT * FROM Categories WHERE CategoryId = @id', { id });
    if (!result.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
    }
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const toggleCategoryVisibility = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const isActive = req.body.isActive === true || req.body.isActive === 'true' || req.body.isActive === 1;
    await query(
      'UPDATE Categories SET IsActive = @isActive WHERE CategoryId = @id',
      { id, isActive: isActive ? 1 : 0 }
    );
    const result = await query('SELECT * FROM Categories WHERE CategoryId = @id', { id });
    if (!result.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
    }
    res.json({
      success: true,
      message: isActive ? 'Đã hiện danh mục' : 'Đã ẩn danh mục',
      data: result.recordset[0],
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const exists = await query('SELECT CategoryId, Name FROM Categories WHERE CategoryId = @id', { id });
    if (!exists.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
    }

    const inProducts = await query(
      'SELECT COUNT(*) AS cnt FROM Products WHERE CategoryId = @id',
      { id }
    );
    if (inProducts.recordset[0].cnt > 0) {
      return res.status(400).json({
        success: false,
        message: `Danh mục đang có ${inProducts.recordset[0].cnt} sản phẩm. Hãy chuyển hoặc xóa sản phẩm trước, hoặc dùng chức năng Ẩn.`,
      });
    }

    await query('DELETE FROM Categories WHERE CategoryId = @id', { id });
    res.json({
      success: true,
      message: `Đã xóa vĩnh viễn "${exists.recordset[0].Name}"`,
    });
  } catch (err) {
    next(err);
  }
};
