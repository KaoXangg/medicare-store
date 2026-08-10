import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// QUAN TRỌNG (lỗi lệch giờ): cột kiểu TIMESTAMP (không có timezone) của
// Postgres lưu đúng giờ UTC, nhưng driver `pg` mặc định hiểu chuỗi đó là
// giờ ĐỊA PHƯƠNG của máy đang chạy Node khi tạo Date object — làm lệch giờ
// một khoảng đúng bằng múi giờ máy chủ (VN lệch +7). Ép nó hiểu đúng là UTC:
pg.types.setTypeParser(1114, (str) => new Date(str + 'Z')); // 1114 = timestamp (không tz)
pg.types.setTypeParser(1082, (str) => str);                  // 1082 = date thuần (YYYY-MM-DD), trả về string, không tự suy diễn giờ

// Ưu tiên DATABASE_URL (connection string dạng Supabase/Postgres chuẩn:
// postgresql://user:password@host:5432/dbname). Nếu không có, ghép từ các
// biến rời DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME.
const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'postgres',
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    });

// Giữ tên hàm giống bản mssql cũ để server.js không cần sửa gì —
// thử lấy 1 connection để "fail fast" ngay lúc khởi động nếu sai cấu hình.
export async function getPool() {
  const client = await pool.connect();
  client.release();
  return pool;
}

// Tương thích ngược với cách gọi cũ của toàn bộ controller:
//   query('SELECT * FROM Users WHERE UserId = @userId', { userId })
// -> tự chuyển @tenTham số thành $1,$2... theo đúng thứ tự xuất hiện đầu tiên
//    (dùng lại đúng $n nếu tên tham số xuất hiện nhiều lần trong 1 câu lệnh),
//    rồi trả kết quả dưới dạng { recordset, rowsAffected } để mọi nơi dùng
//    result.recordset[0]... vẫn hoạt động như cũ, không cần sửa.
// Tương thích ngược với cách gọi cũ của toàn bộ controller:
//   query('SELECT * FROM Users WHERE UserId = @userId', { userId })
// -> tự chuyển @tenTham số thành $1,$2... theo đúng thứ tự xuất hiện đầu tiên
//    (dùng lại đúng $n nếu tên tham số xuất hiện nhiều lần trong 1 câu lệnh).
// QUAN TRỌNG: bộ quét bên dưới bỏ qua mọi dấu @ nằm TRONG chuỗi ký tự
// ('...') — ví dụ email 'admin@medicarestore.com' viết thẳng trong câu SQL
// sẽ không bị nhầm là tham số @medicarestore. Không dùng regex đơn giản vì
// nó không phân biệt được @ trong chuỗi với @ thật là tham số.
function convertNamedParams(text) {
  const order = [];
  const seen = new Map();
  let out = '';
  let inString = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "'") {
      if (inString && text[i + 1] === "'") { out += "''"; i += 2; continue; }
      inString = !inString;
      out += ch;
      i++;
      continue;
    }
    if (!inString && ch === '@') {
      const m = /^@([a-zA-Z_][a-zA-Z0-9_]*)/.exec(text.slice(i));
      if (m) {
        const name = m[1];
        if (!seen.has(name)) {
          seen.set(name, order.length + 1);
          order.push(name);
        }
        out += `$${seen.get(name)}`;
        i += m[0].length;
        continue;
      }
    }
    out += ch;
    i++;
  }
  return { text: out, order };
}

// QUAN TRỌNG: Postgres tự động viết thường mọi tên cột không có dấu ngoặc
// kép khi tạo bảng (IsActive -> isactive). Toàn bộ code cũ được viết cho
// SQL Server, nơi tên cột giữ đúng chữ hoa/thường (result.recordset[0].IsActive).
// Nếu không xử lý, MỌI chỗ đọc thuộc tính kiểu PascalCase (IsActive, UserId,
// FullName...) sẽ luôn là undefined — gây lỗi âm thầm ở khắp nơi (ví dụ:
// "Tài khoản đã bị khóa" dù IsActive=1, vì !undefined === true).
// Bảng dưới đây map tên cột/alias viết thường -> đúng chữ hoa/thường gốc,
// được áp dụng tự động lên MỌI dòng kết quả trả về, để toàn bộ controller
// không cần sửa gì thêm.
const COLUMN_CASE_MAP = {
  actiondetail: 'ActionDetail', actiontype: 'ActionType', address: 'Address',
  adminreply: 'AdminReply', amount: 'Amount', approved: 'Approved', avatar: 'Avatar',
  averagerating: 'AverageRating', bannerid: 'BannerId', brandid: 'BrandId',
  brandlogo: 'BrandLogo', brandname: 'BrandName', brandslug: 'BrandSlug',
  cartid: 'CartId', categoryid: 'CategoryId', categoryname: 'CategoryName',
  categoryslug: 'CategorySlug', changetype: 'ChangeType', changedat: 'ChangedAt',
  code: 'Code', comment: 'Comment', contactid: 'ContactId', content: 'Content',
  couponid: 'CouponId', createdat: 'CreatedAt', customeremail: 'CustomerEmail',
  customername: 'CustomerName', customerphone: 'CustomerPhone', dateofbirth: 'DateOfBirth',
  deleterequested: 'DeleteRequested', deleterequestedat: 'DeleteRequestedAt',
  description: 'Description', discountamount: 'DiscountAmount', discounttype: 'DiscountType',
  discountvalue: 'DiscountValue', duration: 'Duration', email: 'Email',
  emailverified: 'EmailVerified', enddate: 'EndDate', excerpt: 'Excerpt',
  expiresat: 'ExpiresAt', expirydate: 'ExpiryDate', field: 'Field',
  flashsaleitemid: 'FlashSaleItemId', fullname: 'FullName', idcard: 'IdCard',
  image: 'Image', imageid: 'ImageId', imageurl: 'ImageUrl', imageurls: 'ImageUrls',
  ipaddress: 'IpAddress', isactive: 'IsActive', isapproved: 'IsApproved',
  isfeatured: 'IsFeatured', ispopular: 'IsPopular', isprimary: 'IsPrimary',
  ispublished: 'IsPublished', isverified: 'IsVerified', itemcount: 'ItemCount',
  lastchangedfields: 'LastChangedFields', linkurl: 'LinkUrl', logid: 'LogId',
  logo: 'Logo', maxdiscount: 'MaxDiscount', message: 'Message',
  minorderamount: 'MinOrderAmount', name: 'Name', newvalue: 'NewValue',
  note: 'Note', notes: 'Notes', notificationprefs: 'NotificationPrefs',
  oldvalue: 'OldValue', ordercode: 'OrderCode', orderdetailid: 'OrderDetailId',
  orderid: 'OrderId', pageurl: 'PageUrl', paidat: 'PaidAt', passwordhash: 'PasswordHash',
  paymentid: 'PaymentId', paymentmethod: 'PaymentMethod', paymentprovider: 'PaymentProvider',
  paymentstatus: 'PaymentStatus', phone: 'Phone', phoneotp: 'PhoneOtp',
  phoneotpexpiry: 'PhoneOtpExpiry', phoneverified: 'PhoneVerified',
  phoneverifyrequested: 'PhoneVerifyRequested', postid: 'PostId', price: 'Price',
  primaryimage: 'PrimaryImage', productid: 'ProductId', productimage: 'ProductImage',
  productname: 'ProductName', purchasedate: 'PurchaseDate', quantity: 'Quantity',
  rating: 'Rating', replyat: 'ReplyAt', replyread: 'ReplyRead', reviewcount: 'ReviewCount',
  reviewid: 'ReviewId', revoked: 'Revoked', role: 'Role', sku: 'SKU',
  saleprice: 'SalePrice', settingkey: 'SettingKey', settingvalue: 'SettingValue',
  shippingaddress: 'ShippingAddress', shippingfee: 'ShippingFee', slug: 'Slug',
  soldcount: 'SoldCount', sortorder: 'SortOrder', specifications: 'Specifications',
  startdate: 'StartDate', status: 'Status', stock: 'Stock', subtotal: 'SubTotal',
  subject: 'Subject', subscriberid: 'SubscriberId', subtitle: 'Subtitle',
  testimonialid: 'TestimonialId', title: 'Title', token: 'Token', tokenid: 'TokenId',
  total: 'Total', totalamount: 'TotalAmount', transactionid: 'TransactionId',
  updatedat: 'UpdatedAt', usagelimit: 'UsageLimit', used: 'Used', usedcount: 'UsedCount',
  useragent: 'UserAgent', useremail: 'UserEmail', userid: 'UserId', username: 'UserName',
  verifyrequested: 'VerifyRequested', warrantycode: 'WarrantyCode', warrantyid: 'WarrantyId',
  wishlistid: 'WishlistId', flashsale: 'flashSale', instock: 'inStock',
  lowstock: 'lowStock', newcustomers: 'newCustomers', ordercount: 'orderCount',
  outofstock: 'outOfStock', totalorders: 'totalOrders', totalspent: 'totalSpent',
};

function restoreColumnCase(row) {
  const out = {};
  for (const key in row) {
    out[COLUMN_CASE_MAP[key] || key] = row[key];
  }
  return out;
}

export async function query(text, params = {}) {
  const { text: converted, order } = convertNamedParams(text);
  const values = order.map((name) => {
    const v = params[name];
    return v === undefined ? null : v;
  });
  const res = await pool.query(converted, values);
  return { recordset: res.rows.map(restoreColumnCase), rowsAffected: [res.rowCount] };
}

export default pool;