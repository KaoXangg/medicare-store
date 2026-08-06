USE MediCareStore;
GO

IF COL_LENGTH('dbo.Reviews', 'ImageUrls') IS NULL
BEGIN
    ALTER TABLE dbo.Reviews ADD ImageUrls NVARCHAR(MAX) NULL;
END
GO

IF COL_LENGTH('dbo.Reviews', 'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE dbo.Reviews ADD UpdatedAt DATETIME2 NULL;
END
GO
