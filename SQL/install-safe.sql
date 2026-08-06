-- =============================================================================
-- MediCare Store - CAP NHAT AN TOAN (KHONG XOA DU LIEU)
-- Chi them bang/cot con thieu. KHONG DROP bang. KHONG xoa du lieu cu.
-- Dung khi: may da co DB cu, chi thieu Wishlists, SiteSettings, PaymentProvider...
--
-- sqlcmd -S localhost -U sa -P "MatKhau" -i SQL\install-safe.sql
-- =============================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'MediCareStore')
BEGIN
    CREATE DATABASE MediCareStore;
    PRINT N'[OK] Da tao database MediCareStore.';
    PRINT N'[!] Database moi - hay chay them SQL\SQLQuery1.sql de co du lieu mau.';
END
GO

USE MediCareStore;
GO

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    RAISERROR(N'Chua co bang Users. May moi can chay SQL\SQLQuery1.sql truoc!', 16, 1);
    RETURN;
END
GO

-- Contacts
IF OBJECT_ID('dbo.Contacts', 'U') IS NULL
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
    PRINT N'[OK] Tao bang Contacts';
END
GO

IF COL_LENGTH('dbo.Contacts', 'UserId') IS NULL
    ALTER TABLE dbo.Contacts ADD UserId INT NULL;
IF COL_LENGTH('dbo.Contacts', 'ReplyAt') IS NULL
    ALTER TABLE dbo.Contacts ADD ReplyAt DATETIME2 NULL;
IF COL_LENGTH('dbo.Contacts', 'ReplyRead') IS NULL
    ALTER TABLE dbo.Contacts ADD ReplyRead BIT NOT NULL DEFAULT 0;
GO

-- SiteSettings
IF OBJECT_ID('dbo.SiteSettings', 'U') IS NULL
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
    PRINT N'[OK] Tao bang SiteSettings';
END
GO

-- Wishlists
IF OBJECT_ID('dbo.Wishlists', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Wishlists (
        WishlistId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
        ProductId INT NOT NULL REFERENCES dbo.Products(ProductId) ON DELETE CASCADE,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_Wishlist_UserProduct UNIQUE (UserId, ProductId)
    );
    CREATE INDEX IX_Wishlists_User ON dbo.Wishlists(UserId);
    PRINT N'[OK] Tao bang Wishlists';
END
GO

-- Newsletter, RefreshTokens, BlogPosts
IF OBJECT_ID('dbo.NewsletterSubscribers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.NewsletterSubscribers (
        SubscriberId INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT N'[OK] Tao bang NewsletterSubscribers';
END
GO

IF OBJECT_ID('dbo.RefreshTokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RefreshTokens (
        TokenId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
        Token NVARCHAR(500) NOT NULL UNIQUE,
        ExpiresAt DATETIME2 NOT NULL,
        Revoked BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_RefreshTokens_User ON dbo.RefreshTokens(UserId);
    PRINT N'[OK] Tao bang RefreshTokens';
END
GO

IF OBJECT_ID('dbo.BlogPosts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.BlogPosts (
        PostId INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(300) NOT NULL,
        Slug NVARCHAR(320) NOT NULL UNIQUE,
        Excerpt NVARCHAR(500) NULL,
        Content NVARCHAR(MAX) NULL,
        ImageUrl NVARCHAR(500) NULL,
        IsPublished BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL
    );
    PRINT N'[OK] Tao bang BlogPosts';
END
GO

-- Cot bo sung
IF COL_LENGTH('dbo.Brands', 'Description') IS NULL
    ALTER TABLE dbo.Brands ADD Description NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.Reviews', 'ImageUrls') IS NULL
    ALTER TABLE dbo.Reviews ADD ImageUrls NVARCHAR(MAX) NULL;
IF COL_LENGTH('dbo.Reviews', 'UpdatedAt') IS NULL
    ALTER TABLE dbo.Reviews ADD UpdatedAt DATETIME2 NULL;
IF COL_LENGTH('dbo.Orders', 'PaymentProvider') IS NULL
    ALTER TABLE dbo.Orders ADD PaymentProvider NVARCHAR(50) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.SiteSettings WHERE SettingKey = N'flash_sale_end')
    INSERT INTO dbo.SiteSettings (SettingKey, SettingValue)
    VALUES (N'flash_sale_end', CONVERT(NVARCHAR(30), DATEADD(HOUR, 8, CAST(CAST(GETUTCDATE() AS DATE) AS DATETIME2)), 126));
GO

PRINT N'';
PRINT N'========================================';
PRINT N'  CAP NHAT AN TOAN HOAN TAT!';
PRINT N'  Du lieu cu duoc GIU NGUYEN.';
PRINT N'========================================';
GO
