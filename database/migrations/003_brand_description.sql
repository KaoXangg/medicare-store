USE MediCareStore;
GO

IF COL_LENGTH('dbo.Brands', 'Description') IS NULL
BEGIN
    ALTER TABLE dbo.Brands ADD Description NVARCHAR(1000) NULL;
END
GO
