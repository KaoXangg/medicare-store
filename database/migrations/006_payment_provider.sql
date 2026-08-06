-- Payment provider for online orders (VNPay, MoMo, etc.)
IF COL_LENGTH('dbo.Orders', 'PaymentProvider') IS NULL
BEGIN
  ALTER TABLE dbo.Orders ADD PaymentProvider NVARCHAR(50) NULL;
END
GO
