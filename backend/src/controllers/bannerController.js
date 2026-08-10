import { query } from '../config/db.js';

const resolveImage = (req) => {
  if (req.body?.imageUrl?.trim()) {
    const u = req.body.imageUrl.trim();
    if (/^https?:\/\//i.test(u) || u.startsWith('/uploads/')) return u;
  }
  if (req.file) return `/uploads/banners/${req.file.filename}`;
  return null;
};

export const getBannersAdmin = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM Banners ORDER BY SortOrder, BannerId');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, linkUrl, sortOrder } = req.body;
    const imageUrl = resolveImage(req);
    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Tiêu đề và ảnh banner bắt buộc' });
    }
    const isActive =
      req.body.isActive === 'false' || req.body.isActive === false ? 0 : 1;
    const result = await query(
      `INSERT INTO Banners (Title, Subtitle, ImageUrl, LinkUrl, SortOrder, IsActive)
       VALUES (@title, @subtitle, @imageUrl, @linkUrl, @sortOrder, @isActive)
       RETURNING *`,
      {
        title,
        subtitle: subtitle || null,
        imageUrl,
        linkUrl: linkUrl || null,
        sortOrder: parseInt(sortOrder, 10) || 0,
        isActive,
      }
    );
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const imageUrl = resolveImage(req);
    await query(
      `UPDATE Banners SET
        Title = COALESCE(@title, Title),
        Subtitle = @subtitle,
        ImageUrl = COALESCE(@imageUrl, ImageUrl),
        LinkUrl = @linkUrl,
        SortOrder = COALESCE(@sortOrder, SortOrder),
        IsActive = COALESCE(@isActive, IsActive)
       WHERE BannerId = @id`,
      {
        id,
        title: req.body.title || null,
        subtitle: req.body.subtitle ?? null,
        imageUrl,
        linkUrl: req.body.linkUrl ?? null,
        sortOrder: req.body.sortOrder !== undefined ? parseInt(req.body.sortOrder, 10) : null,
        isActive:
          req.body.isActive !== undefined
            ? req.body.isActive === 'true' || req.body.isActive === true
              ? 1
              : 0
            : null,
      }
    );
    const result = await query('SELECT * FROM Banners WHERE BannerId = @id', { id });
    if (!result.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Banner không tồn tại' });
    }
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    await query('DELETE FROM Banners WHERE BannerId = @id', { id: req.params.id });
    res.json({ success: true, message: 'Đã xóa banner' });
  } catch (err) {
    next(err);
  }
};
