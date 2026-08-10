import { query } from '../config/db.js';
import { paginate } from '../utils/helpers.js';

const parseReviewImages = (req) => {
  const urls = [];
  const raw = req.body?.imageUrls;
  if (raw !== undefined && raw !== null && raw !== '') {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[')) {
        try {
          JSON.parse(trimmed).forEach((u) => u && urls.push(String(u).trim()));
        } catch {
          trimmed.split(/[\n,]+/).forEach((s) => s.trim() && urls.push(s.trim()));
        }
      } else if (trimmed) {
        trimmed.split(/[\n,]+/).forEach((s) => s.trim() && urls.push(s.trim()));
      }
    } else if (Array.isArray(raw)) {
      raw.forEach((u) => u && urls.push(String(u).trim()));
    }
  }
  if (req.files?.length) {
    req.files.forEach((f) => urls.push(`/uploads/reviews/${f.filename}`));
  }
  if (raw !== undefined || req.files?.length) {
    return JSON.stringify(urls.slice(0, 5));
  }
  return null;
};

const mapReviewRow = (row) => {
  let images = [];
  if (row.ImageUrls) {
    try {
      images = JSON.parse(row.ImageUrls);
    } catch {
      images = [];
    }
  }
  return { ...row, images };
};

const updateProductRating = async (productId) => {
  await query(
    `UPDATE Products SET 
      AverageRating = COALESCE((SELECT AVG(CAST(Rating AS DECIMAL(3,2))) FROM Reviews WHERE ProductId = @id AND IsApproved = 1), 0),
      ReviewCount = (SELECT COUNT(*) FROM Reviews WHERE ProductId = @id AND IsApproved = 1)
     WHERE ProductId = @id`,
    { id: productId }
  );
};

export const getProductReviews = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const sort = req.query.sort || 'newest';

    const sortMap = {
      newest: 'r.CreatedAt DESC',
      oldest: 'r.CreatedAt ASC',
      highest: 'r.Rating DESC, r.CreatedAt DESC',
      lowest: 'r.Rating ASC, r.CreatedAt DESC',
    };
    const orderBy = sortMap[sort] || sortMap.newest;

    const [reviewsResult, distResult] = await Promise.all([
      query(
        `SELECT r.ReviewId, r.ProductId, r.UserId, r.Rating, r.Comment, r.ImageUrls, r.IsApproved,
                r.CreatedAt, r.UpdatedAt, u.FullName, u.Avatar
         FROM Reviews r JOIN Users u ON r.UserId = u.UserId
         WHERE r.ProductId = @productId AND r.IsApproved = 1
         ORDER BY ${orderBy}`,
        { productId }
      ).catch(async () => {
        const fallback = await query(
          `SELECT r.ReviewId, r.ProductId, r.UserId, r.Rating, r.Comment, r.IsApproved,
                  r.CreatedAt, u.FullName, u.Avatar
           FROM Reviews r JOIN Users u ON r.UserId = u.UserId
           WHERE r.ProductId = @productId AND r.IsApproved = 1
           ORDER BY ${orderBy}`,
          { productId }
        );
        return fallback;
      }),
      query(
        `SELECT Rating, COUNT(*) AS count FROM Reviews
         WHERE ProductId = @productId AND IsApproved = 1 GROUP BY Rating`,
        { productId }
      ),
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distResult.recordset.forEach((row) => {
      distribution[row.Rating] = row.count;
    });
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    const avg = total
      ? distResult.recordset.reduce((s, row) => s + row.Rating * row.count, 0) / total
      : 0;

    res.json({
      success: true,
      data: {
        reviews: reviewsResult.recordset.map(mapReviewRow),
        summary: {
          total,
          average: Math.round(avg * 10) / 10,
          distribution,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMyProductReview = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    let result;
    try {
      result = await query(
        `SELECT r.ReviewId, r.ProductId, r.UserId, r.Rating, r.Comment, r.ImageUrls, r.IsApproved,
                r.CreatedAt, r.UpdatedAt, u.FullName, u.Avatar
         FROM Reviews r JOIN Users u ON r.UserId = u.UserId
         WHERE r.ProductId = @productId AND r.UserId = @userId`,
        { productId, userId: req.user.UserId }
      );
    } catch {
      result = await query(
        `SELECT r.ReviewId, r.ProductId, r.UserId, r.Rating, r.Comment, r.IsApproved,
                r.CreatedAt, u.FullName, u.Avatar
         FROM Reviews r JOIN Users u ON r.UserId = u.UserId
         WHERE r.ProductId = @productId AND r.UserId = @userId`,
        { productId, userId: req.user.UserId }
      );
    }
    res.json({
      success: true,
      data: result.recordset[0] ? mapReviewRow(result.recordset[0]) : null,
    });
  } catch (err) {
    next(err);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const productId = parseInt(req.body.productId, 10);
    const rating = parseInt(req.body.rating, 10);
    const comment = req.body.comment?.trim() || null;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Dữ liệu đánh giá không hợp lệ' });
    }

    const exists = await query(
      'SELECT ReviewId FROM Reviews WHERE UserId = @userId AND ProductId = @productId',
      { userId: req.user.UserId, productId }
    );
    if (exists.recordset.length) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này. Hãy chỉnh sửa đánh giá hiện có.' });
    }

    const imageUrls = parseReviewImages(req);
    let result;
    try {
      result = await query(
        `INSERT INTO Reviews (ProductId, UserId, Rating, Comment, ImageUrls, IsApproved)
         VALUES (@productId, @userId, @rating, @comment, @imageUrls, 1)
         RETURNING *`,
        {
          productId,
          userId: req.user.UserId,
          rating,
          comment,
          imageUrls,
        }
      );
    } catch (dbErr) {
      if (dbErr.message?.includes('ImageUrls')) {
        result = await query(
          `INSERT INTO Reviews (ProductId, UserId, Rating, Comment, IsApproved)
           VALUES (@productId, @userId, @rating, @comment, 1)
           RETURNING *`,
          { productId, userId: req.user.UserId, rating, comment }
        );
      } else {
        throw dbErr;
      }
    }
    await updateProductRating(productId);
    res.status(201).json({ success: true, data: mapReviewRow(result.recordset[0]) });
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await query('SELECT * FROM Reviews WHERE ReviewId = @id', { id });
    const review = existing.recordset[0];
    if (!review) {
      return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
    }

    const isOwner = review.UserId === req.user.UserId;
    const isAdmin = req.user.Role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Không có quyền sửa đánh giá này' });
    }

    const rating = req.body.rating !== undefined ? parseInt(req.body.rating, 10) : review.Rating;
    const comment = req.body.comment !== undefined ? req.body.comment?.trim() || null : review.Comment;

    let imageUrls = review.ImageUrls;
    const parsed = parseReviewImages(req);
    if (parsed !== null) {
      imageUrls = parsed;
    }

    try {
      await query(
        `UPDATE Reviews SET Rating = @rating, Comment = @comment, ImageUrls = @imageUrls,
          IsApproved = CASE WHEN @isAdmin = 1 THEN IsApproved ELSE 1 END,
          UpdatedAt = GETUTCDATE()
         WHERE ReviewId = @id`,
        { id, rating, comment, imageUrls, isAdmin: isAdmin ? 1 : 0 }
      );
    } catch (dbErr) {
      if (dbErr.message?.includes('ImageUrls') || dbErr.message?.includes('UpdatedAt')) {
        await query(
          `UPDATE Reviews SET Rating = @rating, Comment = @comment,
            IsApproved = CASE WHEN @isAdmin = 1 THEN IsApproved ELSE 1 END
           WHERE ReviewId = @id`,
          { id, rating, comment, isAdmin: isAdmin ? 1 : 0 }
        );
      } else {
        throw dbErr;
      }
    }

    const updated = await query('SELECT * FROM Reviews WHERE ReviewId = @id', { id });
    await updateProductRating(review.ProductId);
    res.json({ success: true, data: mapReviewRow(updated.recordset[0]) });
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await query('SELECT * FROM Reviews WHERE ReviewId = @id', { id });
    const review = existing.recordset[0];
    if (!review) {
      return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
    }

    const isOwner = review.UserId === req.user.UserId;
    const isAdmin = req.user.Role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa đánh giá này' });
    }

    await query('DELETE FROM Reviews WHERE ReviewId = @id', { id });
    await updateProductRating(review.ProductId);
    res.json({ success: true, message: 'Đã xóa đánh giá' });
  } catch (err) {
    next(err);
  }
};

export const getReviews = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit || 8);
    const { search, status, rating } = req.query;

    let where = 'WHERE 1=1';
    const params = { offset, limit };

    if (status === 'approved') where += ' AND r.IsApproved = 1';
    if (status === 'hidden') where += ' AND r.IsApproved = 0';
    if (rating) {
      where += ' AND r.Rating = @rating';
      params.rating = parseInt(rating, 10);
    }
    if (search?.trim()) {
      where += ' AND (p.Name LIKE @search OR u.FullName LIKE @search OR r.Comment LIKE @search)';
      params.search = `%${search.trim()}%`;
    }

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM Reviews r
       JOIN Products p ON r.ProductId = p.ProductId
       JOIN Users u ON r.UserId = u.UserId ${where}`,
      params
    );
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT r.*, p.Name AS ProductName, u.FullName, u.Email
       FROM Reviews r
       JOIN Products p ON r.ProductId = p.ProductId
       JOIN Users u ON r.UserId = u.UserId
       ${where}
       ORDER BY r.CreatedAt DESC
       LIMIT @limit OFFSET @offset`,
      params
    );

    res.json({
      success: true,
      data: result.recordset.map(mapReviewRow),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

export const approveReview = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const r = await query('SELECT ProductId FROM Reviews WHERE ReviewId = @id', { id });
    if (!r.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
    }
    await query('UPDATE Reviews SET IsApproved = 1 WHERE ReviewId = @id', { id });
    await updateProductRating(r.recordset[0].ProductId);
    res.json({ success: true, message: 'Đã duyệt đánh giá' });
  } catch (err) {
    next(err);
  }
};

export const toggleReviewApproval = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const isApproved = req.body.isApproved === true || req.body.isApproved === 'true' || req.body.isApproved === 1;
    const r = await query('SELECT ProductId FROM Reviews WHERE ReviewId = @id', { id });
    if (!r.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
    }
    await query('UPDATE Reviews SET IsApproved = @approved WHERE ReviewId = @id', {
      approved: isApproved ? 1 : 0,
      id,
    });
    await updateProductRating(r.recordset[0].ProductId);
    res.json({ success: true, message: isApproved ? 'Đã hiện đánh giá' : 'Đã ẩn đánh giá' });
  } catch (err) {
    next(err);
  }
};

export const bulkReviewAction = async (req, res, next) => {
  try {
    const { ids = [], action } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: 'Chưa chọn đánh giá' });
    }

    const productIds = new Set();
    for (const rawId of ids) {
      const id = parseInt(rawId, 10);
      const r = await query('SELECT ProductId FROM Reviews WHERE ReviewId = @id', { id });
      if (r.recordset[0]) productIds.add(r.recordset[0].ProductId);

      if (action === 'delete') {
        await query('DELETE FROM Reviews WHERE ReviewId = @id', { id });
      } else if (action === 'approve') {
        await query('UPDATE Reviews SET IsApproved = 1 WHERE ReviewId = @id', { id });
      } else if (action === 'hide') {
        await query('UPDATE Reviews SET IsApproved = 0 WHERE ReviewId = @id', { id });
      }
    }

    for (const pid of productIds) {
      await updateProductRating(pid);
    }

    res.json({ success: true, message: `Đã xử lý ${ids.length} đánh giá` });
  } catch (err) {
    next(err);
  }
};