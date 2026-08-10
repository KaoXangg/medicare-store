import { query } from './db.js';

// Ghi chú: hàm này không được gọi ở đâu trong server.js (giữ nguyên như bản
// gốc — đã kiểm tra không có import ensureSchema ở nơi khác). Để dùng, gọi
// `await ensureSchema()` trong start() ở server.js trước khi app.listen().
// Các lệnh dưới dùng IF NOT EXISTS/ADD COLUMN IF NOT EXISTS sẵn có của
// Postgres nên an toàn chạy lại nhiều lần.
export async function ensureSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS SiteSettings (
       SettingKey VARCHAR(100) PRIMARY KEY,
       SettingValue TEXT NULL,
       UpdatedAt TIMESTAMP NOT NULL DEFAULT GETUTCDATE()
     )`,
    `INSERT INTO SiteSettings (SettingKey, SettingValue) VALUES
       ('site_name', 'MediCare Store'),
       ('site_description', 'Thiết bị y tế cao cấp chính hãng'),
       ('contact_email', 'support@medicarestore.com'),
       ('contact_phone', '1900 1234')
     ON CONFLICT (SettingKey) DO NOTHING`,
    `CREATE TABLE IF NOT EXISTS Wishlists (
       WishlistId SERIAL PRIMARY KEY,
       UserId INTEGER NOT NULL REFERENCES Users(UserId) ON DELETE CASCADE,
       ProductId INTEGER NOT NULL REFERENCES Products(ProductId) ON DELETE CASCADE,
       CreatedAt TIMESTAMP NOT NULL DEFAULT GETUTCDATE(),
       CONSTRAINT UQ_Wishlist_UserProduct UNIQUE (UserId, ProductId)
     )`,
    `CREATE INDEX IF NOT EXISTS IX_Wishlists_User ON Wishlists(UserId)`,
    `CREATE TABLE IF NOT EXISTS Contacts (
       ContactId SERIAL PRIMARY KEY,
       UserId INTEGER NULL,
       FullName VARCHAR(200) NOT NULL,
       Email VARCHAR(255) NOT NULL,
       Phone VARCHAR(20) NULL,
       Subject VARCHAR(300) NOT NULL,
       Message VARCHAR(2000) NOT NULL,
       Status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (Status IN ('new', 'read', 'replied')),
       AdminReply VARCHAR(2000) NULL,
       ReplyAt TIMESTAMP NULL,
       ReplyRead SMALLINT NOT NULL DEFAULT 0,
       CreatedAt TIMESTAMP NOT NULL DEFAULT GETUTCDATE()
     )`,
    `ALTER TABLE Contacts ADD COLUMN IF NOT EXISTS UserId INTEGER NULL`,
    `ALTER TABLE Contacts ADD COLUMN IF NOT EXISTS ReplyAt TIMESTAMP NULL`,
    `ALTER TABLE Contacts ADD COLUMN IF NOT EXISTS ReplyRead SMALLINT NOT NULL DEFAULT 0`,
    `ALTER TABLE Reviews ADD COLUMN IF NOT EXISTS ImageUrls TEXT NULL`,
    `ALTER TABLE Reviews ADD COLUMN IF NOT EXISTS UpdatedAt TIMESTAMP NULL`,
    `ALTER TABLE Orders ADD COLUMN IF NOT EXISTS PaymentProvider VARCHAR(50) NULL`,
    `INSERT INTO SiteSettings (SettingKey, SettingValue)
     SELECT 'flash_sale_end', TO_CHAR(date_trunc('day', GETUTCDATE()) + INTERVAL '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
     WHERE NOT EXISTS (SELECT 1 FROM SiteSettings WHERE SettingKey = 'flash_sale_end')`,
  ];

  for (const sql of statements) {
    try {
      await query(sql);
    } catch (err) {
      console.warn('[ensureSchema]', err.message);
    }
  }
  console.log('✓ Database schema ensured (SiteSettings, Wishlists, Contacts, …)');
}
