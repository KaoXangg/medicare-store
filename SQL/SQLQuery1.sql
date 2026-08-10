-- MediCare Store - SQL Server (ALL-IN-ONE: schema + dữ liệu mẫu)
-- Chạy 1 lần trong SSMS hoặc sqlcmd khi cài máy mới.
-- File này đã bao gồm: Wishlists, SiteSettings, Contacts, PaymentProvider, Reviews ảnh...
--
-- sqlcmd (đổi -S và -P theo máy bạn):
--   sqlcmd -S localhost -U sa -P "MatKhauCuaBan" -i SQL\SQLQuery1.sql
-- Nếu dùng SQL Express:
--   sqlcmd -S localhost\SQLEXPRESS -U sa -P "MatKhauCuaBan" -i SQL\SQLQuery1.sql

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'MediCareStore')
BEGIN
    CREATE DATABASE MediCareStore;
END
GO

USE MediCareStore;
GO

-- Drop tables (child first)
IF OBJECT_ID('dbo.Wishlists', 'U') IS NOT NULL DROP TABLE dbo.Wishlists;
IF OBJECT_ID('dbo.BlogPosts', 'U') IS NOT NULL DROP TABLE dbo.BlogPosts;
IF OBJECT_ID('dbo.RefreshTokens', 'U') IS NOT NULL DROP TABLE dbo.RefreshTokens;
IF OBJECT_ID('dbo.NewsletterSubscribers', 'U') IS NOT NULL DROP TABLE dbo.NewsletterSubscribers;
IF OBJECT_ID('dbo.Contacts', 'U') IS NOT NULL DROP TABLE dbo.Contacts;
IF OBJECT_ID('dbo.SiteSettings', 'U') IS NOT NULL DROP TABLE dbo.SiteSettings;
IF OBJECT_ID('dbo.PasswordResetTokens', 'U') IS NOT NULL DROP TABLE dbo.PasswordResetTokens;
IF OBJECT_ID('dbo.Payments', 'U') IS NOT NULL DROP TABLE dbo.Payments;
IF OBJECT_ID('dbo.OrderDetails', 'U') IS NOT NULL DROP TABLE dbo.OrderDetails;
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.Cart', 'U') IS NOT NULL DROP TABLE dbo.Cart;
IF OBJECT_ID('dbo.Reviews', 'U') IS NOT NULL DROP TABLE dbo.Reviews;
IF OBJECT_ID('dbo.ProductImages', 'U') IS NOT NULL DROP TABLE dbo.ProductImages;
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Coupons', 'U') IS NOT NULL DROP TABLE dbo.Coupons;
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;
IF OBJECT_ID('dbo.Brands', 'U') IS NOT NULL DROP TABLE dbo.Brands;
IF OBJECT_ID('dbo.Banners', 'U') IS NOT NULL DROP TABLE dbo.Banners;
IF OBJECT_ID('dbo.Testimonials', 'U') IS NOT NULL DROP TABLE dbo.Testimonials;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

-- Users
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
CREATE TABLE dbo.Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(200) NOT NULL,
    Phone NVARCHAR(20) NULL,
    Address NVARCHAR(500) NULL,
    Avatar NVARCHAR(500) NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'user' CHECK (Role IN ('user', 'admin')),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);

-- Password Reset Tokens
IF OBJECT_ID('dbo.PasswordResetTokens', 'U') IS NOT NULL DROP TABLE dbo.PasswordResetTokens;
CREATE TABLE dbo.PasswordResetTokens (
    TokenId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
    Token NVARCHAR(255) NOT NULL UNIQUE,
    ExpiresAt DATETIME2 NOT NULL,
    Used BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Categories
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;
CREATE TABLE dbo.Categories (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Slug NVARCHAR(200) NOT NULL UNIQUE,
    Description NVARCHAR(1000) NULL,
    Image NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    SortOrder INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Brands
IF OBJECT_ID('dbo.Brands', 'U') IS NOT NULL DROP TABLE dbo.Brands;
CREATE TABLE dbo.Brands (
    BrandId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Slug NVARCHAR(200) NOT NULL UNIQUE,
    Logo NVARCHAR(500) NULL,
    Description NVARCHAR(1000) NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Products
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
CREATE TABLE dbo.Products (
    ProductId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryId INT NOT NULL REFERENCES dbo.Categories(CategoryId),
    BrandId INT NULL REFERENCES dbo.Brands(BrandId),
    Name NVARCHAR(300) NOT NULL,
    Slug NVARCHAR(300) NOT NULL UNIQUE,
    Description NVARCHAR(MAX) NULL,
    Specifications NVARCHAR(MAX) NULL,
    Price DECIMAL(18,2) NOT NULL,
    SalePrice DECIMAL(18,2) NULL,
    Stock INT NOT NULL DEFAULT 0,
    SKU NVARCHAR(100) NULL,
    IsFeatured BIT NOT NULL DEFAULT 0,
    IsPopular BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    SoldCount INT NOT NULL DEFAULT 0,
    AverageRating DECIMAL(3,2) NOT NULL DEFAULT 0,
    ReviewCount INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);

-- Product Images
IF OBJECT_ID('dbo.ProductImages', 'U') IS NOT NULL DROP TABLE dbo.ProductImages;
CREATE TABLE dbo.ProductImages (
    ImageId INT IDENTITY(1,1) PRIMARY KEY,
    ProductId INT NOT NULL REFERENCES dbo.Products(ProductId) ON DELETE CASCADE,
    ImageUrl NVARCHAR(500) NOT NULL,
    IsPrimary BIT NOT NULL DEFAULT 0,
    SortOrder INT NOT NULL DEFAULT 0
);

-- Cart
IF OBJECT_ID('dbo.Cart', 'U') IS NOT NULL DROP TABLE dbo.Cart;
CREATE TABLE dbo.Cart (
    CartId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
    ProductId INT NOT NULL REFERENCES dbo.Products(ProductId),
    Quantity INT NOT NULL DEFAULT 1 CHECK (Quantity > 0),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT UQ_Cart_User_Product UNIQUE (UserId, ProductId)
);

-- Coupons
IF OBJECT_ID('dbo.Coupons', 'U') IS NOT NULL DROP TABLE dbo.Coupons;
CREATE TABLE dbo.Coupons (
    CouponId INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(500) NULL,
    DiscountType NVARCHAR(20) NOT NULL CHECK (DiscountType IN ('percent', 'fixed')),
    DiscountValue DECIMAL(18,2) NOT NULL,
    MinOrderAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    MaxDiscount DECIMAL(18,2) NULL,
    UsageLimit INT NULL,
    UsedCount INT NOT NULL DEFAULT 0,
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2 NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Orders
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
CREATE TABLE dbo.Orders (
    OrderId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL REFERENCES dbo.Users(UserId),
    OrderCode NVARCHAR(50) NOT NULL UNIQUE,
    CustomerName NVARCHAR(200) NOT NULL,
    CustomerPhone NVARCHAR(20) NOT NULL,
    CustomerEmail NVARCHAR(255) NOT NULL,
    ShippingAddress NVARCHAR(500) NOT NULL,
    Note NVARCHAR(1000) NULL,
    SubTotal DECIMAL(18,2) NOT NULL,
    DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
    TotalAmount DECIMAL(18,2) NOT NULL,
    CouponId INT NULL REFERENCES dbo.Coupons(CouponId),
    Status NVARCHAR(30) NOT NULL DEFAULT 'pending' 
        CHECK (Status IN ('pending', 'confirmed', 'shipping', 'completed', 'cancelled')),
    PaymentMethod NVARCHAR(20) NOT NULL CHECK (PaymentMethod IN ('cod', 'online')),
    PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'unpaid' 
        CHECK (PaymentStatus IN ('unpaid', 'paid', 'refunded')),
    PaymentProvider NVARCHAR(50) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);

-- Order Details
IF OBJECT_ID('dbo.OrderDetails', 'U') IS NOT NULL DROP TABLE dbo.OrderDetails;
CREATE TABLE dbo.OrderDetails (
    OrderDetailId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL REFERENCES dbo.Orders(OrderId) ON DELETE CASCADE,
    ProductId INT NOT NULL REFERENCES dbo.Products(ProductId),
    ProductName NVARCHAR(300) NOT NULL,
    ProductImage NVARCHAR(500) NULL,
    Price DECIMAL(18,2) NOT NULL,
    Quantity INT NOT NULL,
    Total DECIMAL(18,2) NOT NULL
);

-- Payments
IF OBJECT_ID('dbo.Payments', 'U') IS NOT NULL DROP TABLE dbo.Payments;
CREATE TABLE dbo.Payments (
    PaymentId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL REFERENCES dbo.Orders(OrderId) ON DELETE CASCADE,
    Amount DECIMAL(18,2) NOT NULL,
    PaymentMethod NVARCHAR(20) NOT NULL,
    TransactionId NVARCHAR(255) NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    PaidAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Reviews
IF OBJECT_ID('dbo.Reviews', 'U') IS NOT NULL DROP TABLE dbo.Reviews;
CREATE TABLE dbo.Reviews (
    ReviewId INT IDENTITY(1,1) PRIMARY KEY,
    ProductId INT NOT NULL REFERENCES dbo.Products(ProductId) ON DELETE CASCADE,
    UserId INT NOT NULL REFERENCES dbo.Users(UserId),
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(2000) NULL,
    ImageUrls NVARCHAR(MAX) NULL,
    IsApproved BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT UQ_Review_User_Product UNIQUE (UserId, ProductId)
);

-- Banners
IF OBJECT_ID('dbo.Banners', 'U') IS NOT NULL DROP TABLE dbo.Banners;
CREATE TABLE dbo.Banners (
    BannerId INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(300) NOT NULL,
    Subtitle NVARCHAR(500) NULL,
    ImageUrl NVARCHAR(500) NOT NULL,
    LinkUrl NVARCHAR(500) NULL,
    SortOrder INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Testimonials (customer feedback on homepage)
IF OBJECT_ID('dbo.Testimonials', 'U') IS NOT NULL DROP TABLE dbo.Testimonials;
CREATE TABLE dbo.Testimonials (
    TestimonialId INT IDENTITY(1,1) PRIMARY KEY,
    CustomerName NVARCHAR(200) NOT NULL,
    Role NVARCHAR(200) NULL,
    Content NVARCHAR(1000) NOT NULL,
    Avatar NVARCHAR(500) NULL,
    Rating INT NOT NULL DEFAULT 5,
    IsActive BIT NOT NULL DEFAULT 1,
    SortOrder INT NOT NULL DEFAULT 0
);

-- SiteSettings (ảnh trang Liên hệ/Giới thiệu, cấu hình site)
IF OBJECT_ID('dbo.SiteSettings', 'U') IS NOT NULL DROP TABLE dbo.SiteSettings;
CREATE TABLE dbo.SiteSettings (
    SettingKey NVARCHAR(100) PRIMARY KEY,
    SettingValue NVARCHAR(MAX) NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Wishlists (sản phẩm yêu thích)
IF OBJECT_ID('dbo.Wishlists', 'U') IS NOT NULL DROP TABLE dbo.Wishlists;
CREATE TABLE dbo.Wishlists (
    WishlistId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
    ProductId INT NOT NULL REFERENCES dbo.Products(ProductId) ON DELETE CASCADE,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Wishlist_UserProduct UNIQUE (UserId, ProductId)
);

-- Contacts (form liên hệ + phản hồi admin)
IF OBJECT_ID('dbo.Contacts', 'U') IS NOT NULL DROP TABLE dbo.Contacts;
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

-- Newsletter
IF OBJECT_ID('dbo.NewsletterSubscribers', 'U') IS NOT NULL DROP TABLE dbo.NewsletterSubscribers;
CREATE TABLE dbo.NewsletterSubscribers (
    SubscriberId INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Refresh tokens (đăng nhập)
IF OBJECT_ID('dbo.RefreshTokens', 'U') IS NOT NULL DROP TABLE dbo.RefreshTokens;
CREATE TABLE dbo.RefreshTokens (
    TokenId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
    Token NVARCHAR(500) NOT NULL UNIQUE,
    ExpiresAt DATETIME2 NOT NULL,
    Revoked BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Blog (tùy chọn)
IF OBJECT_ID('dbo.BlogPosts', 'U') IS NOT NULL DROP TABLE dbo.BlogPosts;
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

-- Indexes
CREATE INDEX IX_Products_Category ON dbo.Products(CategoryId);
CREATE INDEX IX_Products_Brand ON dbo.Products(BrandId);
CREATE INDEX IX_Products_Price ON dbo.Products(Price);
CREATE INDEX IX_Orders_User ON dbo.Orders(UserId);
CREATE INDEX IX_Orders_Status ON dbo.Orders(Status);
CREATE INDEX IX_Reviews_Product ON dbo.Reviews(ProductId);
CREATE INDEX IX_Wishlists_User ON dbo.Wishlists(UserId);
CREATE INDEX IX_RefreshTokens_User ON dbo.RefreshTokens(UserId);
GO

USE MediCareStore;
GO

-- Categories
INSERT INTO Categories (Name, Slug, Description, Image, SortOrder) VALUES
(N'Máy đo huyết áp', 'may-do-huyet-ap', N'Thiết bị đo huyết áp chính xác', '/uploads/categories/blood-pressure.jpg', 1),
(N'Máy đo đường huyết', 'may-do-duong-huyet', N'Máy đo glucose và test strip', '/uploads/categories/glucose.jpg', 2),
(N'Khẩu trang y tế', 'khau-trang-y-te', N'Khẩu trang N95, khẩu trang y tế', '/uploads/categories/mask.jpg', 3),
(N'Thiết bị oxy', 'thiet-bi-oxy', N'Máy tạo oxy, bình oxy y tế', '/uploads/categories/oxygen.jpg', 4),
(N'Nhiệt kế y tế', 'nhiet-ke-y-te', N'Nhiệt kế điện tử, hồng ngoại', '/uploads/categories/thermometer.jpg', 5),
(N'Xe lăn & hỗ trợ', 'xe-lan-ho-tro', N'Xe lăn, nạng, thiết bị phục hồi', '/uploads/categories/wheelchair.jpg', 6);

-- Brands
INSERT INTO Brands (Name, Slug, Logo) VALUES
(N'Omron', 'omron', '/uploads/brands/omron.png'),
(N'Beurer', 'beurer', '/uploads/brands/beurer.png'),
(N'Philips', 'philips', '/uploads/brands/philips.png'),
(N'3M', '3m', '/uploads/brands/3m.png'),
(N'Yuwell', 'yuwell', '/uploads/brands/yuwell.png'),
(N'Microlife', 'microlife', '/uploads/brands/microlife.png');

-- Products (sample - images use placeholder paths)
INSERT INTO Products (CategoryId, BrandId, Name, Slug, Description, Specifications, Price, SalePrice, Stock, SKU, IsFeatured, IsPopular, SoldCount, AverageRating, ReviewCount) VALUES
(1, 1, N'Máy đo huyết áp Omron HEM-7130', 'omron-hem-7130', 
 N'Máy đo huyết áp tự động tại nhà, màn hình LCD lớn, cảnh báo nhịp tim bất thường.',
 N'{"display":"LCD 3.5 inch","memory":"60 readings","power":"4x AAA","warranty":"3 years"}',
 1290000, 1090000, 50, 'OMR-7130', 1, 1, 320, 4.8, 45),
(1, 6, N'Máy đo huyết áp Microlife BP A2 Classic', 'microlife-bp-a2',
 N'Công nghệ MAM - đo 3 lần tự động, kết quả chính xác cao.',
 N'{"display":"LCD","memory":"99 readings","power":"4x AAA","warranty":"2 years"}',
 890000, NULL, 35, 'MIC-A2', 1, 0, 120, 4.5, 18),
(2, 5, N'Máy đo đường huyết Yuwell 580', 'yuwell-580',
 N'Đo nhanh 5 giây, cần máu 0.6μL, bộ nhớ 200 kết quả.',
 N'{"time":"5 seconds","memory":"200","sample":"0.6μL","warranty":"2 years"}',
 450000, 399000, 80, 'YW-580', 1, 1, 450, 4.7, 62),
(3, 4, N'Khẩu trang N95 3M 9210', '3m-n95-9210',
 N'Khẩm trang N95 chuẩn FDA, lọc 95% hạt bụi siêu nhỏ.',
 N'{"standard":"N95","pack":"20 pcs","filter":"95%","certification":"FDA"}',
 350000, 299000, 200, '3M-9210', 0, 1, 890, 4.6, 120),
(4, 3, N'Máy tạo oxy Philips EverFlo 5L', 'philips-everflo-5l',
 N'Máy tạo oxy 5L/phút, vận hành êm, tiết kiệm điện.',
 N'{"flow":"5 L/min","noise":"40 dB","power":"350W","warranty":"2 years"}',
 18500000, 16900000, 8, 'PHI-EV5', 1, 0, 25, 4.9, 8),
(5, 2, N'Nhiệt kế hồng ngoại Beurer FT 85', 'beurer-ft85',
 N'Đo không tiếp xúc, kết quả trong 1 giây, phù hợp trẻ em.',
 N'{"type":"Infrared","time":"1 second","range":"32-42.5°C","warranty":"2 years"}',
 650000, 549000, 60, 'BEU-FT85', 1, 1, 280, 4.8, 35),
(6, 5, N'Xe lăn điện Yuwell D05', 'yuwell-d05',
 N'Xe lăn điện gấp gọn, pin lithium, tốc độ 6km/h.',
 N'{"speed":"6 km/h","battery":"Lithium 24V","weight":"25kg","warranty":"1 year"}',
 12500000, NULL, 12, 'YW-D05', 0, 1, 45, 4.7, 12),
(1, 2, N'Máy đo huyết áp Beurer BM 26', 'beurer-bm26',
 N'Đo huyết áp và nhịp tim, màn hình màu, cảnh báo rối loạn nhịp.',
 N'{"display":"Color LCD","memory":"2x60","power":"4x AAA","warranty":"3 years"}',
 750000, 699000, 40, 'BEU-BM26', 0, 1, 190, 4.4, 28);

-- Product Images
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder) VALUES
(1, '/uploads/products/omron-7130-1.jpg', 1, 0),
(1, '/uploads/products/omron-7130-2.jpg', 0, 1),
(2, '/uploads/products/microlife-a2.jpg', 1, 0),
(3, '/uploads/products/yuwell-580.jpg', 1, 0),
(4, '/uploads/products/3m-n95.jpg', 1, 0),
(5, '/uploads/products/philips-oxygen.jpg', 1, 0),
(6, '/uploads/products/beurer-ft85.jpg', 1, 0),
(7, '/uploads/products/yuwell-wheelchair.jpg', 1, 0),
(8, '/uploads/products/beurer-bm26.jpg', 1, 0);

-- Coupons
INSERT INTO Coupons (Code, Description, DiscountType, DiscountValue, MinOrderAmount, MaxDiscount, UsageLimit, StartDate, EndDate) VALUES
('WELCOME10', N'Giảm 10% cho đơn đầu tiên', 'percent', 10, 500000, 200000, 1000, '2024-01-01', '2026-12-31'),
('MEDICARE50K', N'Giảm 50.000đ', 'fixed', 50000, 1000000, NULL, 500, '2024-01-01', '2026-12-31'),
('VIP15', N'Giảm 15% VIP', 'percent', 15, 2000000, 500000, 100, '2024-01-01', '2026-12-31');

-- Banners
INSERT INTO Banners (Title, Subtitle, ImageUrl, LinkUrl, SortOrder) VALUES
(N'Thiết bị y tế chính hãng', N'Cam kết 100% hàng chính hãng - Bảo hành đầy đủ', '/uploads/banners/banner1.jpg', '/products', 1),
(N'Ưu đãi mùa hè', N'Giảm đến 30% máy đo huyết áp & đường huyết', '/uploads/banners/banner2.jpg', '/products?category=may-do-huyet-ap', 2),
(N'Giao hàng toàn quốc', N'Freeship đơn từ 1 triệu - COD toàn quốc', '/uploads/banners/banner3.jpg', '/products', 3);

-- Testimonials
INSERT INTO Testimonials (CustomerName, Role, Content, Rating, SortOrder) VALUES
(N'Nguyễn Văn An', N'Bệnh viện tư nhân', N'MediCare Store cung cấp thiết bị chất lượng, giao hàng nhanh, hỗ trợ kỹ thuật tận tình.', 5, 1),
(N'Trần Thị Bình', N'Điều dưỡng', N'Tôi đã mua máy đo huyết áp Omron, sản phẩm chính hãng, giá tốt hơn nhiều nơi.', 5, 2),
(N'Lê Minh Cường', N'Khách hàng cá nhân', N'Website dễ sử dụng, thanh toán COD tiện lợi. Rất hài lòng với dịch vụ.', 5, 3),
(N'Phạm Thu Hà', N'Phòng khám', N'Đặt hàng số lượng lớn được chiết khấu, nhân viên tư vấn chuyên nghiệp.', 5, 4);

-- SiteSettings
INSERT INTO SiteSettings (SettingKey, SettingValue) VALUES
(N'site_name', N'MediCare Store'),
(N'site_description', N'Thiết bị y tế cao cấp chính hãng'),
(N'contact_email', N'support@medicarestore.com'),
(N'contact_phone', N'1900 1234'),
(N'flash_sale_end', CONVERT(NVARCHAR(30), DATEADD(HOUR, 8, CAST(CAST(GETUTCDATE() AS DATE) AS DATETIME2)), 126));

-- Blog mẫu
INSERT INTO BlogPosts (Title, Slug, Excerpt, Content, ImageUrl, IsPublished) VALUES
(N'Cách chọn máy đo huyết áp chính xác cho gia đình', N'chon-may-do-huyet-ap',
 N'Hướng dẫn chọn máy đo huyết áp phù hợp từng đối tượng',
 N'Nội dung chi tiết về tiêu chí chọn máy đo huyết áp...', NULL, 1),
(N'5 thiết bị chăm sóc sức khỏe nên có tại nhà', N'5-thiet-bi-cham-soc-suc-khoe',
 N'Danh sách thiết bị y tế thiết yếu cho mọi gia đình',
 N'Nội dung chi tiết về thiết bị y tế gia đình...', NULL, 1),
(N'Checklist vệ sinh và bảo quản thiết bị y tế', N'bao-quan-thiet-bi-y-te',
 N'Quy trình vệ sinh, bảo quản thiết bị y tế an toàn',
 N'Nội dung chi tiết về bảo quản thiết bị...', NULL, 1);

GO

-- 1. Thêm DateOfBirth nếu chưa có
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'DateOfBirth'
)
BEGIN
  ALTER TABLE Users ADD DateOfBirth DATE NULL;
  PRINT 'Added column DateOfBirth to Users';
END
ELSE
  PRINT 'Column DateOfBirth already exists';

-- 2. Thêm VerifyRequested nếu chưa có
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'VerifyRequested'
)
BEGIN
  ALTER TABLE Users ADD VerifyRequested BIT NOT NULL DEFAULT 0;
  PRINT 'Added column VerifyRequested to Users';
END
ELSE
  PRINT 'Column VerifyRequested already exists';

-- 3. Thêm EmailVerified nếu chưa có
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'EmailVerified'
)
BEGIN
  ALTER TABLE Users ADD EmailVerified BIT NOT NULL DEFAULT 0;
  PRINT 'Added column EmailVerified to Users';
END
ELSE
  PRINT 'Column EmailVerified already exists';

  -- Chạy script này trong SQL Server để thêm 2 cột xác thực vào bảng Users
-- Kiểm tra trước khi thêm để tránh lỗi nếu cột đã tồn tại

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'VerifyRequested'
)
BEGIN
  ALTER TABLE Users ADD VerifyRequested BIT NOT NULL DEFAULT 0;
  PRINT 'Added column: VerifyRequested';
END
ELSE
  PRINT 'Column VerifyRequested already exists, skipped.';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'IsVerified'
)
BEGIN
  ALTER TABLE Users ADD IsVerified BIT NOT NULL DEFAULT 0;
  PRINT 'Added column: IsVerified';
END
ELSE
  PRINT 'Column IsVerified already exists, skipped.';


IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'PhoneVerified')
  ALTER TABLE Users ADD PhoneVerified BIT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'PhoneOtp')
  ALTER TABLE Users ADD PhoneOtp VARCHAR(6) NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'PhoneOtpExpiry')
  ALTER TABLE Users ADD PhoneOtpExpiry DATETIME NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'PhoneVerified')
  ALTER TABLE Users ADD PhoneVerified BIT NOT NULL DEFAULT 0;
 
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'PhoneVerifyRequested')
  ALTER TABLE Users ADD PhoneVerifyRequested BIT NOT NULL DEFAULT 0;
 
-- Migration: Flash Sale — bảng lưu sản phẩm admin ghim cho khu vực "Deal hôm nay"
-- Chạy 1 lần trên SQL Server (SSMS hoặc sqlcmd)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FlashSaleItems')
BEGIN
  CREATE TABLE FlashSaleItems (
    FlashSaleItemId INT IDENTITY(1,1) PRIMARY KEY,
    ProductId INT NOT NULL,
    SortOrder INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_FlashSaleItems_Product FOREIGN KEY (ProductId)
      REFERENCES Products(ProductId) ON DELETE CASCADE,
    CONSTRAINT UQ_FlashSaleItems_Product UNIQUE (ProductId)
  );
END;

-- Đảm bảo SiteSettings có sẵn key flash_sale_end (nếu bảng SiteSettings đã tồn tại)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SiteSettings')
   AND NOT EXISTS (SELECT * FROM SiteSettings WHERE SettingKey = 'flash_sale_end')
BEGIN
  INSERT INTO SiteSettings (SettingKey, SettingValue)
  VALUES ('flash_sale_end', DATEADD(HOUR, 8, GETUTCDATE()));
END;

ALTER TABLE Users ADD NotificationPrefs NVARCHAR(MAX) NULL;

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'NotificationPrefs'
)
BEGIN
  ALTER TABLE Users ADD NotificationPrefs NVARCHAR(MAX) NULL;
  PRINT 'Added column: NotificationPrefs';
END
ELSE
  PRINT 'Column NotificationPrefs already exists, skipped.';

  IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UQ_Users_Phone' AND object_id = OBJECT_ID('dbo.Users')
)
BEGIN
  CREATE UNIQUE INDEX UQ_Users_Phone ON dbo.Users(Phone) WHERE Phone IS NOT NULL;
  PRINT 'Added unique index: UQ_Users_Phone';
END
ELSE
  PRINT 'Index UQ_Users_Phone already exists, skipped.';



IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'IdCard'
)
BEGIN
  ALTER TABLE Users ADD IdCard VARCHAR(20) NULL;
  PRINT 'Added column: IdCard';
END
ELSE
  PRINT 'Column IdCard already exists, skipped.';
GO
 
-- Cho phép nhiều user có IdCard = NULL (chưa nhập CCCD),
-- nhưng không cho trùng khi đã nhập giá trị thật.
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UQ_Users_IdCard' AND object_id = OBJECT_ID('dbo.Users')
)
BEGIN
  CREATE UNIQUE INDEX UQ_Users_IdCard ON dbo.Users(IdCard) WHERE IdCard IS NOT NULL;
  PRINT 'Added unique index: UQ_Users_IdCard';
END
ELSE
  PRINT 'Index UQ_Users_IdCard already exists, skipped.';



  IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ProfileChangeLog')
BEGIN
  CREATE TABLE ProfileChangeLog (
    LogId      INT IDENTITY(1,1) PRIMARY KEY,
    UserId     INT NOT NULL,
    ChangeType NVARCHAR(20) NOT NULL DEFAULT 'field', -- 'field' | 'verify_email' | 'verify_phone'
    Field      NVARCHAR(50) NULL,                     -- 'FullName' | 'Phone' | 'Email' | 'Address' | 'DateOfBirth' | 'Avatar' | 'Password'
    OldValue   NVARCHAR(500) NULL,
    NewValue   NVARCHAR(500) NULL,
    Approved   BIT NULL,                              -- chỉ dùng khi ChangeType là verify_email/verify_phone
    ChangedAt  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ProfileChangeLog_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
  );
 
  CREATE INDEX IX_ProfileChangeLog_UserId ON ProfileChangeLog(UserId, ChangedAt DESC);
END
 
-- 2) Cột yêu cầu xoá tài khoản (khách gửi yêu cầu, admin xử lý và xoá thật
--    bằng endpoint DELETE /admin/users/:id đã có sẵn)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'DeleteRequested')
BEGIN
  ALTER TABLE Users ADD DeleteRequested BIT NOT NULL DEFAULT 0;
END
 
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'DeleteRequestedAt')
BEGIN
  ALTER TABLE Users ADD DeleteRequestedAt DATETIME2 NULL;
END


CREATE TABLE ActivityLogs (
    LogId BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    ActionType NVARCHAR(50) NOT NULL,
    ActionDetail NVARCHAR(MAX) NULL,
    PageUrl NVARCHAR(500) NULL,
    Duration INT NULL,
    IpAddress NVARCHAR(64) NULL,
    UserAgent NVARCHAR(300) NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ActivityLogs_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);

CREATE INDEX IX_ActivityLogs_UserId ON ActivityLogs(UserId);
CREATE INDEX IX_ActivityLogs_ActionType ON ActivityLogs(ActionType);
CREATE INDEX IX_ActivityLogs_CreatedAt ON ActivityLogs(CreatedAt DESC);

-- ActionType chuẩn hoá dùng trong toàn hệ thống:
-- 'page_view'    : xem trang, ActionDetail = { title }, Duration = số giây ở lại trang (ghi khi rời trang)
-- 'search'       : tìm kiếm, ActionDetail = { keyword, resultCount }
-- 'product_view' : xem chi tiết sản phẩm, ActionDetail = { productId, productName }
-- 'add_to_cart'  : thêm giỏ hàng, ActionDetail = { productId, productName, qty }
-- 'buy_now'      : bấm mua ngay, ActionDetail = { productId, productName }
-- 'order_placed' : đặt hàng thành công, ActionDetail = { orderId, total }
-- 'login'        : đăng nhập, ActionDetail = {}
-- 'click'        : click nút/link quan trọng, ActionDetail = { label, target }

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'LastChangedFields'
)
BEGIN
  ALTER TABLE dbo.Users ADD LastChangedFields NVARCHAR(500) NULL;
  PRINT 'Added column: LastChangedFields';
END
ELSE
  PRINT 'Column LastChangedFields already exists, skipped.';

  CREATE TABLE Warranties (
    WarrantyId INT IDENTITY(1,1) PRIMARY KEY,
    WarrantyCode NVARCHAR(30) NOT NULL UNIQUE,
    CustomerName NVARCHAR(150) NOT NULL,
    Phone NVARCHAR(20) NOT NULL,
    ProductId INT NULL,
    ProductName NVARCHAR(255) NOT NULL,
    OrderId INT NULL,
    PurchaseDate DATE NOT NULL,
    ExpiryDate DATE NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'active', -- active | void  (hết hạn tự tính theo ExpiryDate, void = admin thu hồi thủ công)
    Notes NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Warranties_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId),
    CONSTRAINT FK_Warranties_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId)
);

CREATE INDEX IX_Warranties_Phone ON Warranties(Phone);
CREATE INDEX IX_Warranties_ExpiryDate ON Warranties(ExpiryDate);