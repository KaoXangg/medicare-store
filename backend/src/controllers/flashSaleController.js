import { query } from '../config/db.js';
import { getEffectivePrice } from '../utils/helpers.js';

// GET /admin/flash-sale — thời gian kết thúc + danh sách sản phẩm đang ghim
export const getFlashSaleAdmin = async (req, res, next) => {
  try {
    const [endRow, itemRows] = await Promise.all([
      query("SELECT SettingValue FROM SiteSettings WHERE SettingKey = 'flash_sale_end'"),
      query(
        `SELECT fsi.FlashSaleItemId, fsi.ProductId, fsi.SortOrder,
          p.Name, p.Slug, p.Price, p.SalePrice, p.Stock, p.IsActive,
          (SELECT TOP 1 ImageUrl FROM ProductImages WHERE ProductId = p.ProductId ORDER BY IsPrimary DESC, SortOrder) AS PrimaryImage
         FROM FlashSaleItems fsi
         JOIN Products p ON p.ProductId = fsi.ProductId
         ORDER BY fsi.SortOrder`
      ),
    ]);

    const items = itemRows.recordset.map((p) => ({ ...p, effectivePrice: getEffectivePrice(p) }));

    res.json({
      success: true,
      data: {
        endTime: endRow.recordset?.[0]?.SettingValue || null,
        items,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /admin/flash-sale/end  body: { endTime: ISOString }
export const updateFlashSaleEnd = async (req, res, next) => {
  try {
    const { endTime } = req.body;
    if (!endTime) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn thời gian kết thúc' });
    }
    const parsed = new Date(endTime);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ success: false, message: 'Thời gian không hợp lệ' });
    }

    await query(
      `MERGE SiteSettings AS target
       USING (SELECT 'flash_sale_end' AS SettingKey) AS src
       ON target.SettingKey = src.SettingKey
       WHEN MATCHED THEN UPDATE SET SettingValue = @endTime
       WHEN NOT MATCHED THEN INSERT (SettingKey, SettingValue) VALUES ('flash_sale_end', @endTime);`,
      { endTime: parsed.toISOString() }
    );

    res.json({ success: true, message: 'Đã cập nhật thời gian Flash Sale', data: { endTime: parsed.toISOString() } });
  } catch (err) {
    next(err);
  }
};

// PUT /admin/flash-sale/items  body: { productIds: [3, 7, 12] } — theo đúng thứ tự hiển thị
export const setFlashSaleItems = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ success: false, message: 'Danh sách sản phẩm không hợp lệ' });
    }

    await query('DELETE FROM FlashSaleItems');
    for (let i = 0; i < productIds.length; i++) {
      const pid = parseInt(productIds[i], 10);
      if (!pid) continue;
      await query(
        'INSERT INTO FlashSaleItems (ProductId, SortOrder) VALUES (@pid, @sort)',
        { pid, sort: i }
      );
    }

    res.json({ success: true, message: 'Đã cập nhật danh sách sản phẩm Flash Sale' });
  } catch (err) {
    next(err);
  }
};