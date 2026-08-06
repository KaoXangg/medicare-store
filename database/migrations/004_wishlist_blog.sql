USE MediCareStore;
GO

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
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.BlogPosts)
BEGIN
    INSERT INTO dbo.BlogPosts (Title, Slug, Excerpt, Content, ImageUrl, IsPublished) VALUES
    (N'Cách chọn máy đo huyết áp chính xác cho gia đình', N'chon-may-do-huyet-ap',
     N'Hướng dẫn chọn máy đo huyết áp phù hợp từng đối tượng',
     N'Nội dung chi tiết về tiêu chí chọn máy đo huyết áp...', NULL, 1),
    (N'5 thiết bị chăm sóc sức khỏe nên có tại nhà', N'5-thiet-bi-cham-soc-suc-khoe',
     N'Danh sách thiết bị y tế thiết yếu cho mọi gia đình',
     N'Nội dung chi tiết về thiết bị y tế gia đình...', NULL, 1),
    (N'Checklist vệ sinh và bảo quản thiết bị y tế', N'bao-quan-thiet-bi-y-te',
     N'Quy trình vệ sinh, bảo quản thiết bị y tế an toàn',
     N'Nội dung chi tiết về bảo quản thiết bị...', NULL, 1);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.SiteSettings WHERE SettingKey = 'flash_sale_end')
BEGIN
    INSERT INTO dbo.SiteSettings (SettingKey, SettingValue)
    VALUES ('flash_sale_end', CONVERT(NVARCHAR(30), DATEADD(HOUR, 8, CAST(CAST(GETUTCDATE() AS DATE) AS DATETIME2)), 126));
END
GO
