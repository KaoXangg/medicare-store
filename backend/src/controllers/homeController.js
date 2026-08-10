import { query } from '../config/db.js';
import { getEffectivePrice } from '../utils/helpers.js';

const safeQuery = (sql) => query(sql).catch(() => ({ recordset: [] }));

const FLASH_SALE_FALLBACK_SQL = `
  SELECT p.ProductId, p.Name, p.Slug, p.Price, p.SalePrice, p.Stock, p.AverageRating, p.ReviewCount,
    (SELECT ImageUrl FROM ProductImages WHERE ProductId = p.ProductId ORDER BY IsPrimary DESC, SortOrder LIMIT 1) AS PrimaryImage
   FROM Products p
   LEFT JOIN Categories c ON p.CategoryId = c.CategoryId
   WHERE p.IsActive = 1 AND (p.CategoryId IS NULL OR c.IsActive = 1)
     AND p.SalePrice IS NOT NULL AND p.SalePrice < p.Price
   ORDER BY (p.Price - p.SalePrice) DESC
   LIMIT 8
`;

export const getHomeData = async (req, res, next) => {
  try {
    const [banners, categories, testimonials, brands, pinnedFlashSale, flashEndRow] = await Promise.all([
      safeQuery('SELECT * FROM Banners WHERE IsActive = 1 OR IsActive IS NULL ORDER BY SortOrder, BannerId'),
      safeQuery('SELECT * FROM Categories WHERE IsActive = 1 ORDER BY SortOrder'),
      safeQuery('SELECT * FROM Testimonials WHERE IsActive = 1 ORDER BY SortOrder'),
      safeQuery('SELECT BrandId, Name, Slug, Logo, Description FROM Brands WHERE IsActive = 1 ORDER BY Name'),
      // Ưu tiên danh sách sản phẩm admin ghim tay trong trang Flash Sale
      safeQuery(
        `SELECT p.ProductId, p.Name, p.Slug, p.Price, p.SalePrice, p.Stock, p.AverageRating, p.ReviewCount,
          (SELECT ImageUrl FROM ProductImages WHERE ProductId = p.ProductId ORDER BY IsPrimary DESC, SortOrder LIMIT 1) AS PrimaryImage
         FROM FlashSaleItems fsi
         JOIN Products p ON p.ProductId = fsi.ProductId
         WHERE p.IsActive = 1
         ORDER BY fsi.SortOrder`
      ),
      safeQuery("SELECT SettingValue FROM SiteSettings WHERE SettingKey = 'flash_sale_end'"),
    ]);

    // Nếu admin chưa ghim sản phẩm nào, fallback về sản phẩm đang giảm giá nhiều nhất
    let flashSaleRows = pinnedFlashSale;
    if (!flashSaleRows.recordset?.length) {
      flashSaleRows = await safeQuery(FLASH_SALE_FALLBACK_SQL);
    }

    const flashSale = (flashSaleRows.recordset || []).map((p) => ({
      ...p,
      effectivePrice: getEffectivePrice(p),
      primaryImage: p.PrimaryImage,
    }));

    res.json({
      success: true,
      data: {
        banners: banners.recordset,
        categories: categories.recordset,
        testimonials: testimonials.recordset,
        brands: brands.recordset,
        flashSale,
        flashSaleEnd: flashEndRow.recordset?.[0]?.SettingValue || null,
      },
    });
  } catch (err) {
    next(err);
  }
};