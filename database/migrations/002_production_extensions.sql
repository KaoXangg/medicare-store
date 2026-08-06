-- Production extensions for MediCare Store
-- Run after schema.sql on existing database

USE MediCareStore;
GO

IF OBJECT_ID('dbo.Contacts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Contacts (
        ContactId INT IDENTITY(1,1) PRIMARY KEY,
        FullName NVARCHAR(200) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        Phone NVARCHAR(20) NULL,
        Subject NVARCHAR(300) NOT NULL,
        Message NVARCHAR(2000) NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'new' CHECK (Status IN ('new', 'read', 'replied')),
        AdminReply NVARCHAR(2000) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

IF OBJECT_ID('dbo.NewsletterSubscribers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.NewsletterSubscribers (
        SubscriberId INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
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
END
GO

IF OBJECT_ID('dbo.SiteSettings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SiteSettings (
        SettingKey NVARCHAR(100) PRIMARY KEY,
        SettingValue NVARCHAR(MAX) NULL,
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    INSERT INTO dbo.SiteSettings (SettingKey, SettingValue) VALUES
        ('site_name', N'MediCare Store'),
        ('site_description', N'Thiết bị y tế cao cấp chính hãng'),
        ('contact_email', N'support@medicarestore.com'),
        ('contact_phone', N'1900 1234');
END
GO
