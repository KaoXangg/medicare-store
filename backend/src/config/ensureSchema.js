import { query } from './db.js';

export async function ensureSchema() {
  const statements = [
    `IF OBJECT_ID('dbo.SiteSettings', 'U') IS NULL
     BEGIN
       CREATE TABLE dbo.SiteSettings (
         SettingKey NVARCHAR(100) PRIMARY KEY,
         SettingValue NVARCHAR(MAX) NULL,
         UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
       );
       INSERT INTO dbo.SiteSettings (SettingKey, SettingValue) VALUES
         (N'site_name', N'MediCare Store'),
         (N'site_description', N'Thiết bị y tế cao cấp chính hãng'),
         (N'contact_email', N'support@medicarestore.com'),
         (N'contact_phone', N'1900 1234');
     END`,
    `IF OBJECT_ID('dbo.Wishlists', 'U') IS NULL
     BEGIN
       CREATE TABLE dbo.Wishlists (
         WishlistId INT IDENTITY(1,1) PRIMARY KEY,
         UserId INT NOT NULL REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
         ProductId INT NOT NULL REFERENCES dbo.Products(ProductId) ON DELETE CASCADE,
         CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
         CONSTRAINT UQ_Wishlist_UserProduct UNIQUE (UserId, ProductId)
       );
       CREATE INDEX IX_Wishlists_User ON dbo.Wishlists(UserId);
     END`,
    `IF OBJECT_ID('dbo.Contacts', 'U') IS NULL
     BEGIN
       CREATE TABLE dbo.Contacts (
         ContactId INT IDENTITY(1,1) PRIMARY KEY,
         UserId INT NULL,
         FullName NVARCHAR(200) NOT NULL,
         Email NVARCHAR(255) NOT NULL,
         Phone NVARCHAR(20) NULL,
         Subject NVARCHAR(300) NOT NULL,
         Message NVARCHAR(2000) NOT NULL,
         Status NVARCHAR(20) NOT NULL DEFAULT 'new' CHECK (Status IN ('new', 'read', 'replied')),
         AdminReply NVARCHAR(2000) NULL,
         ReplyAt DATETIME2 NULL,
         ReplyRead BIT NOT NULL DEFAULT 0,
         CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
       );
     END`,
    `IF COL_LENGTH('dbo.Contacts', 'UserId') IS NULL
     ALTER TABLE dbo.Contacts ADD UserId INT NULL`,
    `IF COL_LENGTH('dbo.Contacts', 'ReplyAt') IS NULL
     ALTER TABLE dbo.Contacts ADD ReplyAt DATETIME2 NULL`,
    `IF COL_LENGTH('dbo.Contacts', 'ReplyRead') IS NULL
     ALTER TABLE dbo.Contacts ADD ReplyRead BIT NOT NULL DEFAULT 0`,
    `IF COL_LENGTH('dbo.Reviews', 'ImageUrls') IS NULL
     ALTER TABLE dbo.Reviews ADD ImageUrls NVARCHAR(MAX) NULL`,
    `IF COL_LENGTH('dbo.Reviews', 'UpdatedAt') IS NULL
     ALTER TABLE dbo.Reviews ADD UpdatedAt DATETIME2 NULL`,
    `IF COL_LENGTH('dbo.Orders', 'PaymentProvider') IS NULL
     ALTER TABLE dbo.Orders ADD PaymentProvider NVARCHAR(50) NULL`,
    `IF NOT EXISTS (SELECT 1 FROM dbo.SiteSettings WHERE SettingKey = N'flash_sale_end')
     INSERT INTO dbo.SiteSettings (SettingKey, SettingValue)
     VALUES (N'flash_sale_end', CONVERT(NVARCHAR(30), DATEADD(HOUR, 8, CAST(CAST(GETUTCDATE() AS DATE) AS DATETIME2)), 126))`,
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
