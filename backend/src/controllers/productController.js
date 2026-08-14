import { query } from '../config/db.js';
import { paginate, slug, getEffectivePrice } from '../utils/helpers.js';

const parseNum = (v) => (v !== undefined && v !== '' ? Number(v) : null);

const parseSpecs = (raw) => {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      return trimmed;
    }
  }
  return JSON.stringify(raw);
};

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  if (/^https?:\/\//i.test(u) || u.startsWith('/uploads/')) return u;
  return null;
};

const parseImageUrls = (body) => {
  const raw = body?.imageUrls;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(normalizeImageUrl).filter(Boolean);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed).map(normalizeImageUrl).filter(Boolean);
      } catch {
        /* fall through */
      }
    }
    return trimmed.split(/[\n,]+/).map((s) => normalizeImageUrl(s.trim())).filter(Boolean);
  }
  return [];
};

const collectProductImages = (req) => {
  const urls = parseImageUrls(req.body);
  if (req.files?.length) {
    req.files.forEach((f) => urls.push(`/uploads/products/${f.filename}`));
  }
  return urls;
};

const saveProductImages = async (productId, imageUrls, replaceExisting = true) => {
  if (!imageUrls.length) return;
  if (replaceExisting) {
    await query('DELETE FROM ProductImages WHERE ProductId = @id', { id: productId });
  }
  for (let i = 0; i < imageUrls.length; i++) {
    await query(
      'INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder) VALUES (@pid, @url, @primary, @sort)',
      { pid: productId, url: imageUrls[i], primary: i === 0 ? 1 : 0, sort: i }
    );
  }
};

const productSelect = `
  p.ProductId, p.CategoryId, p.BrandId, p.Name, p.Slug, p.Description, p.Specifications,
  p.Price, p.SalePrice, p.Stock, p.SKU, p.IsFeatured, p.IsPopular, p.IsActive,
  p.SoldCount, p.AverageRating, p.ReviewCount, p.CreatedAt,
  c.Name AS CategoryName, c.Slug AS CategorySlug,
  b.Name AS BrandName, b.Slug AS BrandSlug, b.Logo AS BrandLogo
`;

export const getProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      featured,
      popular,
      sort = 'newest',
    } = req.query;

    let where = 'WHERE p.IsActive = 1 AND (p.CategoryId IS NULL OR c.IsActive = 1)';
    const params = { offset, limit };

    if (search) {
      where += ' AND (p.Name LIKE @search OR p.Description LIKE @search)';
      params.search = `%${search}%`;
    }
    if (category) {
      where += ' AND (c.Slug = @category OR p.CategoryId = TRY_CAST_INT(@category))';
      params.category = category;
    }
    if (brand) {
      where += ' AND (b.Slug = @brand OR p.BrandId = TRY_CAST_INT(@brand))';
      params.brand = brand;
    }
    if (minPrice) {
      where += ' AND COALESCE(p.SalePrice, p.Price) >= @minPrice';
      params.minPrice = parseFloat(minPrice);
    }
    if (maxPrice) {
      where += ' AND COALESCE(p.SalePrice, p.Price) <= @maxPrice';
      params.maxPrice = parseFloat(maxPrice);
    }
    if (featured === 'true') where += ' AND p.IsFeatured = 1';
    if (popular === 'true') where += ' AND p.IsPopular = 1';

    const sortMap = {
      'price-asc': 'COALESCE(p.SalePrice, p.Price) ASC',
      'price-desc': 'COALESCE(p.SalePrice, p.Price) DESC',
      newest: 'p.CreatedAt DESC',
      bestselling: 'p.SoldCount DESC',
    };
    const orderBy = sortMap[sort] || sortMap.newest;

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM Products p
       LEFT JOIN Categories c ON p.CategoryId = c.CategoryId
       LEFT JOIN Brands b ON p.BrandId = b.BrandId ${where}`,
      params
    );
    const total = countResult.recordset[0].Total;

    const result = await query(
      `SELECT ${productSelect} FROM Products p
       LEFT JOIN Categories c ON p.CategoryId = c.CategoryId
       LEFT JOIN Brands b ON p.BrandId = b.BrandId
       ${where} ORDER BY ${orderBy}
       LIMIT @limit OFFSET @offset`,
      params
    );

    const ids = result.recordset.map((p) => p.ProductId);
    let images = [];
    if (ids.length) {
      const imgResult = await query(
        `SELECT ProductId, ImageUrl, IsPrimary FROM ProductImages 
         WHERE ProductId IN (${ids.join(',')}) ORDER BY IsPrimary DESC, SortOrder`
      );
      images = imgResult.recordset;
    }

    const products = result.recordset.map((p) => ({
      ...p,
      effectivePrice: getEffectivePrice(p),
      images: images.filter((i) => i.ProductId === p.ProductId).map((i) => i.ImageUrl),
      primaryImage: images.find((i) => i.ProductId === p.ProductId && i.IsPrimary)?.ImageUrl ||
        images.find((i) => i.ProductId === p.ProductId)?.ImageUrl,
    }));

    res.json({
      success: true,
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug: productSlug } = req.params;
    const result = await query(
      `SELECT ${productSelect} FROM Products p
       LEFT JOIN Categories c ON p.CategoryId = c.CategoryId
       LEFT JOIN Brands b ON p.BrandId = b.BrandId
       WHERE p.Slug = @slug AND p.IsActive = 1`,
      { slug: productSlug }
    );
    const product = result.recordset[0];
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    const images = await query(
      'SELECT ImageId, ImageUrl, IsPrimary, SortOrder FROM ProductImages WHERE ProductId = @id ORDER BY SortOrder',
      { id: product.ProductId }
    );
    const reviews = await query(
      `SELECT r.ReviewId, r.Rating, r.Comment, r.CreatedAt, u.FullName, u.Avatar
       FROM Reviews r JOIN Users u ON r.UserId = u.UserId
       WHERE r.ProductId = @id AND r.IsApproved = 1 ORDER BY r.CreatedAt DESC`,
      { id: product.ProductId }
    );
    let specs = {};
    try {
      specs = product.Specifications ? JSON.parse(product.Specifications) : {};
    } catch { specs = {}; }

    res.json({
      success: true,
      data: {
        ...product,
        effectivePrice: getEffectivePrice(product),
        specifications: specs,
        images: images.recordset,
        reviews: reviews.recordset,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getFeatured = async (req, res, next) => {
  req.query.featured = 'true';
  req.query.limit = req.query.limit || 8;
  return getProducts(req, res, next);
};

export const getPopular = async (req, res, next) => {
  req.query.popular = 'true';
  req.query.sort = 'bestselling';
  req.query.limit = req.query.limit || 8;
  return getProducts(req, res, next);
};

export const createProduct = async (req, res, next) => {
  try {
    const body = req.body;
    const productSlug = body.slug || slug(body.name || '');
    const specs = parseSpecs(body.specifications);
    const imageUrls = collectProductImages(req);

    const result = await query(
      `INSERT INTO Products (CategoryId, BrandId, Name, Slug, Description, Specifications, Price, SalePrice, Stock, SKU, IsFeatured, IsPopular)
       VALUES (@categoryId, @brandId, @name, @productSlug, @description, @specs, @price, @salePrice, @stock, @sku, @isFeatured, @isPopular)
       RETURNING *`,
      {
        categoryId: parseNum(body.categoryId),
        brandId: parseNum(body.brandId),
        name: body.name,
        productSlug,
        description: body.description || null,
        specs,
        price: parseNum(body.price),
        salePrice: parseNum(body.salePrice),
        stock: parseNum(body.stock) ?? 0,
        sku: body.sku || null,
        isFeatured: body.isFeatured === 'true' || body.isFeatured === true ? 1 : 0,
        isPopular: body.isPopular === 'true' || body.isPopular === true ? 1 : 0,
      }
    );
    const product = result.recordset[0];
    await saveProductImages(product.ProductId, imageUrls, true);

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const imageUrls = collectProductImages(req);
    const specs = body.specifications !== undefined ? parseSpecs(body.specifications) : undefined;

    await query(
      `UPDATE Products SET
        CategoryId = COALESCE(@categoryId, CategoryId),
        BrandId = @brandId,
        Name = COALESCE(@name, Name),
        Description = COALESCE(@description, Description),
        Specifications = COALESCE(@specs, Specifications),
        Price = COALESCE(@price, Price),
        SalePrice = @salePrice,
        Stock = COALESCE(@stock, Stock),
        SKU = COALESCE(@sku, SKU),
        IsFeatured = COALESCE(@isFeatured, IsFeatured),
        IsPopular = COALESCE(@isPopular, IsPopular),
        IsActive = COALESCE(@isActive, IsActive),
        UpdatedAt = GETUTCDATE()
       WHERE ProductId = @id`,
      {
        id,
        categoryId: parseNum(body.categoryId),
        brandId: parseNum(body.brandId),
        name: body.name,
        description: body.description,
        specs,
        price: parseNum(body.price),
        salePrice: parseNum(body.salePrice),
        stock: parseNum(body.stock),
        sku: body.sku,
        isFeatured:
          body.isFeatured !== undefined
            ? body.isFeatured === 'true' || body.isFeatured === true
              ? 1
              : 0
            : undefined,
        isPopular:
          body.isPopular !== undefined
            ? body.isPopular === 'true' || body.isPopular === true
              ? 1
              : 0
            : undefined,
        isActive:
          body.isActive !== undefined
            ? body.isActive === 'true' || body.isActive === true
              ? 1
              : 0
            : undefined,
      }
    );

    if (imageUrls.length) {
      await saveProductImages(id, imageUrls, true);
    }

    const result = await query('SELECT * FROM Products WHERE ProductId = @id', { id });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

export const setProductVisibility = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const isActive = req.body.isActive === true || req.body.isActive === 'true' || req.body.isActive === 1;

    const result = await query(
      `UPDATE Products SET IsActive = @isActive, UpdatedAt = GETUTCDATE()
       WHERE ProductId = @id
       RETURNING ProductId, Name, IsActive`,
      { id, isActive: isActive ? 1 : 0 }
    );
    if (!result.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    res.json({
      success: true,
      message: isActive ? 'Đã hiện sản phẩm trên cửa hàng' : 'Đã ẩn sản phẩm khỏi cửa hàng',
      data: result.recordset[0],
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const exists = await query('SELECT ProductId, Name FROM Products WHERE ProductId = @id', { id });
    if (!exists.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    const inOrders = await query(
      'SELECT COUNT(*) AS cnt FROM OrderDetails WHERE ProductId = @id',
      { id }
    );
    const orderCount = inOrders.recordset[0].cnt;
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm đã có trong ${orderCount} dòng đơn hàng. Hãy xóa các đơn liên quan trước, hoặc dùng chức năng Ẩn sản phẩm.`,
      });
    }

    await query('DELETE FROM Cart WHERE ProductId = @id', { id });
    await query('DELETE FROM Reviews WHERE ProductId = @id', { id });
    await query('DELETE FROM ProductImages WHERE ProductId = @id', { id });
    await query('DELETE FROM Products WHERE ProductId = @id', { id });

    res.json({
      success: true,
      message: `Đã xóa vĩnh viễn "${exists.recordset[0].Name}"`,
    });
  } catch (err) {
    next(err);
  }
};

export const searchSuggest = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: [] });
    const result = await query(
      `SELECT p.ProductId, p.Name, p.Slug, p.Price, p.SalePrice,
        (SELECT ImageUrl FROM ProductImages pi WHERE pi.ProductId = p.ProductId ORDER BY pi.IsPrimary DESC LIMIT 1) AS PrimaryImage
       FROM Products p WHERE p.IsActive = 1 AND (p.Name LIKE @search OR p.SKU LIKE @search)
       ORDER BY p.SoldCount DESC LIMIT 8`,
      { search: `%${q}%` }
    );
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};
