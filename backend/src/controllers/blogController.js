import { query } from '../config/db.js';
import { slug } from '../utils/helpers.js';

export const getPublishedPosts = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 20);
    const result = await query(
      `SELECT TOP (@limit) PostId, Title, Slug, Excerpt, ImageUrl, CreatedAt
       FROM BlogPosts WHERE IsPublished = 1 ORDER BY CreatedAt DESC`,
      { limit }
    );
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    if (err.message?.includes('BlogPosts')) {
      return res.json({ success: true, data: [] });
    }
    next(err);
  }
};

export const getPostBySlug = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM BlogPosts WHERE Slug = @slug AND IsPublished = 1',
      { slug: req.params.slug }
    );
    if (!result.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
    }
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const getAllPostsAdmin = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM BlogPosts ORDER BY CreatedAt DESC');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    if (err.message?.includes('BlogPosts')) {
      return res.json({ success: true, data: [] });
    }
    next(err);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { title, excerpt, content, imageUrl, isPublished } = req.body;
    const postSlug = req.body.slug || slug(title || '');
    const result = await query(
      `INSERT INTO BlogPosts (Title, Slug, Excerpt, Content, ImageUrl, IsPublished)
       OUTPUT INSERTED.* VALUES (@title, @postSlug, @excerpt, @content, @imageUrl, @isPublished)`,
      {
        title,
        postSlug,
        excerpt: excerpt || null,
        content: content || null,
        imageUrl: imageUrl || null,
        isPublished: isPublished === false || isPublished === 'false' ? 0 : 1,
      }
    );
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, imageUrl, isPublished } = req.body;
    await query(
      `UPDATE BlogPosts SET
        Title = COALESCE(@title, Title),
        Excerpt = COALESCE(@excerpt, Excerpt),
        Content = COALESCE(@content, Content),
        ImageUrl = COALESCE(@imageUrl, ImageUrl),
        IsPublished = COALESCE(@isPublished, IsPublished),
        UpdatedAt = GETUTCDATE()
       WHERE PostId = @id`,
      {
        id,
        title,
        excerpt,
        content,
        imageUrl,
        isPublished:
          isPublished !== undefined
            ? isPublished === true || isPublished === 'true' || isPublished === 1
              ? 1
              : 0
            : undefined,
      }
    );
    const result = await query('SELECT * FROM BlogPosts WHERE PostId = @id', { id });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    await query('DELETE FROM BlogPosts WHERE PostId = @id', { id: req.params.id });
    res.json({ success: true, message: 'Đã xóa bài viết' });
  } catch (err) {
    next(err);
  }
};
