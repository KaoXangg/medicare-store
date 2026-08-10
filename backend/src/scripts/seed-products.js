/**
 * Thêm 50 sản phẩm y tế mẫu kèm ảnh URL (Unsplash)
 * Chạy: npm run seed-products
 */
import dotenv from 'dotenv';
import { getPool, query } from '../config/db.js';
import { slug } from '../utils/helpers.js';

dotenv.config();

const MEDICAL_IMAGES = [
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1631549916768-4119b2d5eaf7?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1579686516837-52759a9ec3f1?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1584515933497-779824a9e9a0?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1584036561561-d466889a553e?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1597075095404-5cc8e96bfcf0?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1579154204601-01588f351e38?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1587854692152-c3d8bb732bf3?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1581595219315-7b73c8f1d545?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1551190822-cdc71bf4c175?w=600&h=600&fit=crop',
];

const PRODUCT_TEMPLATES = [
  { cat: 'may-do-huyet-ap', brand: 'omron', names: [
    'Máy đo huyết áp bắp tay tự động', 'Máy đo huyết áp cổ tay thông minh', 'Máy đo HA màn hình LED',
    'Máy đo huyết áp cho người cao tuổi', 'Máy đo HA cảnh báo nhịp tim',
  ]},
  { cat: 'may-do-duong-huyet', brand: 'yuwell', names: [
    'Máy đo đường huyết cầm tay', 'Máy đo glucose kèm que thử', 'Máy đo đường huyết bluetooth',
    'Bộ máy đo đường huyết gia đình', 'Máy đo đường huyết 5 giây',
  ]},
  { cat: 'khau-trang-y-te', brand: '3m', names: [
    'Khẩu trang y tế 4 lớp hộp 50', 'Khẩu trang N95 chống bụi mịn', 'Khẩu trang kháng khuẩn',
    'Khẩu trang y tế trẻ em', 'Tấm che mặt y tế trong suốt',
  ]},
  { cat: 'thiet-bi-oxy', brand: 'philips', names: [
    'Máy tạo oxy 5 lít/phút', 'Máy xông oxy mini di động', 'Bình oxy y tế 10 lít',
    'Máy tạo oxy gia đình', 'Bộ dụng cụ hít oxy',
  ]},
  { cat: 'nhiet-ke-y-te', brand: 'beurer', names: [
    'Nhiệt kế điện tử đầu mềm', 'Nhiệt kế hồng ngoại không tiếp xúc', 'Nhiệt kế tai chóng nước',
    'Nhiệt kế thủy ngân y tế', 'Nhiệt kế thông minh kết nối app',
  ]},
  { cat: 'xe-lan-ho-tro', brand: 'yuwell', names: [
    'Xe lăn tay gấp gọn', 'Nạng y tế nhôm cao cấp', 'Khung tập đi có bánh xe',
    'Gối chỉnh hình khớp gối', 'Đai lưng hỗ trợ cột sống',
  ]},
  { cat: 'may-do-huyet-ap', brand: 'microlife', names: [
    'Máy đo HA công nghệ MAM', 'Máy đo huyết áp hai người dùng', 'Máy đo HA kèm adapter',
  ]},
  { cat: 'may-do-duong-huyet', brand: 'beurer', names: [
    'Que thử đường huyết hộp 50', 'Lancet lấy máu vô trùng', 'Máy đo đường huyết GL50',
  ]},
  { cat: 'nhiet-ke-y-te', brand: 'omron', names: [
    'Nhiệt kế điện tử Omron', 'Máy đo SpO2 kẹp ngón', 'Đồng hồ đo nhịp tim oxy máu',
  ]},
  { cat: 'khau-trang-y-te', brand: 'beurer', names: [
    'Găng tay y tế nitrile hộp 100', 'Dung dịch sát khuẩn tay 500ml', 'Cồn y tế 70 độ chai 1 lít',
  ]},
];

const EXTRA_PRODUCTS = [
  { name: 'Máy xông khí dung mũi họng', cat: 'thiet-bi-oxy', brand: 'yuwell' },
  { name: 'Máy massage cổ vai gáy', cat: 'xe-lan-ho-tro', brand: 'beurer' },
  { name: 'Ống nghe y tế đôi', cat: 'may-do-huyet-ap', brand: 'omron' },
  { name: 'Máy đo acid uric', cat: 'may-do-duong-huyet', brand: 'microlife' },
  { name: 'Túi chườm nóng lạnh y tế', cat: 'xe-lan-ho-tro', brand: '3m' },
  { name: 'Máy rung xung điện EMS', cat: 'xe-lan-ho-tro', brand: 'beurer' },
  { name: 'Máy tăng áp khí nén', cat: 'thiet-bi-oxy', brand: 'philips' },
  { name: 'Bộ đo huyết áp + đường huyết', cat: 'may-do-huyet-ap', brand: 'omron' },
  { name: 'Máy khử khuẩn UV di động', cat: 'khau-trang-y-te', brand: '3m' },
  { name: 'Gối hơi chống loét', cat: 'xe-lan-ho-tro', brand: 'yuwell' },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickImage(index) {
  return MEDICAL_IMAGES[index % MEDICAL_IMAGES.length];
}

function buildProducts(categories, brands) {
  const catMap = Object.fromEntries(categories.map((c) => [c.Slug, c.CategoryId]));
  const brandMap = Object.fromEntries(brands.map((b) => [b.Slug, b.BrandId]));
  const list = [];
  let idx = 0;

  for (const tpl of PRODUCT_TEMPLATES) {
    for (const name of tpl.names) {
      const categoryId = catMap[tpl.cat] || categories[0]?.CategoryId;
      const brandId = brandMap[tpl.brand] || brands[0]?.BrandId;
      const price = randomInt(15, 250) * 10000;
      const hasSale = Math.random() > 0.55;
      list.push({
        name: `${name} ${brands.find((b) => b.BrandId === brandId)?.Name || 'MediCare'}`,
        categoryId,
        brandId,
        price,
        salePrice: hasSale ? Math.round(price * (0.75 + Math.random() * 0.15)) : null,
        stock: randomInt(10, 150),
        image: pickImage(idx++),
        isFeatured: Math.random() > 0.75,
        isPopular: Math.random() > 0.65,
        soldCount: randomInt(5, 500),
        rating: (4 + Math.random() * 0.9).toFixed(1),
        reviews: randomInt(3, 80),
      });
    }
  }

  for (const ex of EXTRA_PRODUCTS) {
    if (list.length >= 50) break;
    const categoryId = catMap[ex.cat] || categories[0]?.CategoryId;
    const brandId = brandMap[ex.brand] || brands[0]?.BrandId;
    const price = randomInt(20, 300) * 10000;
    list.push({
      name: ex.name,
      categoryId,
      brandId,
      price,
      salePrice: Math.random() > 0.5 ? Math.round(price * 0.85) : null,
      stock: randomInt(15, 100),
      image: pickImage(idx++),
      isFeatured: false,
      isPopular: Math.random() > 0.5,
      soldCount: randomInt(10, 200),
      rating: (4 + Math.random() * 0.8).toFixed(1),
      reviews: randomInt(5, 40),
    });
  }

  return list.slice(0, 50);
}

async function seedProducts() {
  await getPool();
  console.log('Đang thêm 50 sản phẩm y tế...\n');

  const cats = await query('SELECT CategoryId, Slug FROM Categories WHERE IsActive = 1');
  const brands = await query('SELECT BrandId, Slug, Name FROM Brands WHERE IsActive = 1');

  if (!cats.recordset.length) {
    console.error('Chưa có danh mục. Chạy database/seed.sql trước.');
    process.exit(1);
  }

  const products = buildProducts(cats.recordset, brands.recordset);
  const usedSlugs = new Set();
  let inserted = 0;

  for (const p of products) {
    let productSlug = slug(p.name);
    let n = 1;
    while (usedSlugs.has(productSlug)) {
      productSlug = `${slug(p.name)}-${n++}`;
    }
    usedSlugs.add(productSlug);

    const exists = await query('SELECT ProductId FROM Products WHERE Slug = @slug', { slug: productSlug });
    if (exists.recordset.length) {
      console.log(`  Bỏ qua (đã tồn tại): ${p.name}`);
      continue;
    }

    const specs = JSON.stringify({
      baoHanh: `${randomInt(1, 3)} năm`,
      xuatXu: ['Nhật Bản', 'Đức', 'Mỹ', 'Trung Quốc'][randomInt(0, 3)],
      chungNhan: 'ISO 13485',
    });

    const result = await query(
      `INSERT INTO Products (CategoryId, BrandId, Name, Slug, Description, Specifications, Price, SalePrice, Stock, SKU,
        IsFeatured, IsPopular, SoldCount, AverageRating, ReviewCount, IsActive)
       VALUES (@categoryId, @brandId, @name, @productSlug, @description, @specs, @price, @salePrice, @stock, @sku,
        @isFeatured, @isPopular, @soldCount, @rating, @reviews, 1)
       RETURNING ProductId`,
      {
        categoryId: p.categoryId,
        brandId: p.brandId,
        name: p.name,
        productSlug,
        description: `${p.name} — Thiết bị y tế chính hãng, đảm bảo chất lượng, hỗ trợ bảo hành tại MediCare Store.`,
        specs,
        price: p.price,
        salePrice: p.salePrice,
        stock: p.stock,
        sku: `MC-${productSlug.slice(0, 12).toUpperCase().replace(/-/g, '')}-${randomInt(100, 999)}`,
        isFeatured: p.isFeatured ? 1 : 0,
        isPopular: p.isPopular ? 1 : 0,
        soldCount: p.soldCount,
        rating: parseFloat(p.rating),
        reviews: p.reviews,
      }
    );

    const productId = result.recordset[0].ProductId;
    await query(
      `INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder) VALUES (@pid, @url, 1, 0)`,
      { pid: productId, url: p.image }
    );

    const img2 = pickImage(productId + 3);
    if (img2 !== p.image) {
      await query(
        `INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder) VALUES (@pid, @url, 0, 1)`,
        { pid: productId, url: img2 }
      );
    }

    inserted++;
    console.log(`  ✓ [${inserted}/50] ${p.name}`);
  }

  console.log(`\nHoàn tất! Đã thêm ${inserted} sản phẩm (ảnh URL Unsplash).`);
  process.exit(0);
}

seedProducts().catch((e) => {
  console.error('Lỗi:', e.message);
  process.exit(1);
});
