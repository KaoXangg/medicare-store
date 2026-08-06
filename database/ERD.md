# MediCare Store - Entity Relationship Diagram

## Entities & Relationships

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  Categories │───1:N─│   Products   │───1:N─│ProductImages│
└─────────────┘       └──────┬───────┘       └─────────────┘
                               │
┌─────────────┐                │ N:1
│   Brands    │────────────────┘
└─────────────┘

┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    Users    │───1:N─│    Orders    │───1:N─│OrderDetails │
└──────┬──────┘       └──────┬───────┘       └──────┬──────┘
       │                     │                      │
       │ 1:N                 │ 1:1                  │ N:1
       ▼                     ▼                      ▼
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    Cart     │       │   Payments   │       │   Products  │
└─────────────┘       └──────────────┘       └─────────────┘

┌─────────────┐       ┌──────────────┐
│    Users    │───1:N─│   Reviews    │───N:1── Products
└─────────────┘       └──────────────┘

┌─────────────┐       ┌──────────────┐
│   Coupons   │───used in── Orders (optional)
└─────────────┘

┌─────────────┐
│   Banners   │  (homepage slideshow)
└─────────────┘

┌──────────────────┐
│PasswordResetToken│───N:1── Users
└──────────────────┘
```

## Table Summary

| Table | Description |
|-------|-------------|
| Users | Customers & admins, bcrypt passwords |
| Categories | Product categories |
| Brands | Product brands for filtering |
| Products | Medical equipment items |
| ProductImages | Multiple images per product |
| Cart | User shopping cart items |
| Orders | Order header with status |
| OrderDetails | Line items per order |
| Payments | COD / online payment records |
| Reviews | Product ratings & comments |
| Coupons | Discount codes |
| Banners | Homepage slideshow |
| PasswordResetTokens | Forgot password flow |
