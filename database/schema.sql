-- MediCare Store - SQL Server Database Schema
-- Run: sqlcmd -S localhost -d master -i schema.sql
-- Or execute in SSMS

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'MediCareStore')
BEGIN
    CREATE DATABASE MediCareStore;
END
GO

USE MediCareStore;
GO

-- Drop tables (child first)
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
    IsApproved BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
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

-- Indexes
CREATE INDEX IX_Products_Category ON dbo.Products(CategoryId);
CREATE INDEX IX_Products_Brand ON dbo.Products(BrandId);
CREATE INDEX IX_Products_Price ON dbo.Products(Price);
CREATE INDEX IX_Orders_User ON dbo.Orders(UserId);
CREATE INDEX IX_Orders_Status ON dbo.Orders(Status);
CREATE INDEX IX_Reviews_Product ON dbo.Reviews(ProductId);
GO
