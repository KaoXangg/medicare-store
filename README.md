# 🏥 MediCare Store

Nền tảng thương mại điện tử bán thiết bị y tế — Full-stack: **React (Vite)** ở frontend, **Node.js/Express** ở backend, **SQL Server** làm database, xác thực bằng **JWT**.

---

## 📋 Mục lục

- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Kiến trúc & công nghệ](#-kiến-trúc--công-nghệ)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Cài đặt nhanh (tự động)](#-cài-đặt-nhanh-tự-động---windows)
- [Cài đặt thủ công từ A → Z](#-cài-đặt-thủ-công-từ-a--z)
  - [1. Clone & cài dependencies](#1-clone--cài-dependencies)
  - [2. Cài đặt SQL Server](#2-cài-đặt-sql-server)
  - [3. Tạo database & seed dữ liệu](#3-tạo-database--seed-dữ-liệu)
  - [4. Cấu hình biến môi trường](#4-cấu-hình-biến-môi-trường)
  - [5. Chạy dự án](#5-chạy-dự-án)
- [Tài khoản demo](#-tài-khoản-demo)
- [Danh sách API chính](#-danh-sách-api-chính)
- [Các lệnh npm hữu ích](#-các-lệnh-npm-hữu-ích)
- [Sơ đồ database (ERD)](#-sơ-đồ-database-erd)
- [Xử lý lỗi thường gặp](#-xử-lý-lỗi-thường-gặp)
- [Build & Deploy](#-build--deploy)

---

## 🖥️ Yêu cầu hệ thống

| Thành phần | Phiên bản khuyến nghị |
|---|---|
| Node.js | 18 LTS trở lên (đã test trên v22) |
| npm | đi kèm Node.js |
| SQL Server | 2019+ (Express/Developer đều được) hoặc SQL Server trong Docker |
| SQL Server Management Studio (SSMS) | khuyến nghị để thao tác DB bằng giao diện |
| Hệ điều hành | Windows (có script cài đặt tự động `.bat`/`.ps1`), macOS/Linux chạy được bằng cách làm thủ công |

---

## 🏗️ Kiến trúc & công nghệ

**Frontend** (`/frontend`):
- React 19 + Vite
- TailwindCSS v4
- React Router v7
- Axios (gọi API)
- Framer Motion, GSAP, AOS, Swiper (animation/UI)
- Recharts (biểu đồ dashboard admin)
- React Hot Toast (thông báo)

**Backend** (`/backend`):
- Node.js + Express (ESM `type: module`)
- SQL Server (thư viện `mssql`)
- JWT (`jsonwebtoken`) cho xác thực
- `bcryptjs` mã hoá mật khẩu
- `express-validator` validate dữ liệu
- `helmet` + `express-rate-limit` bảo mật & chống brute-force
- `multer` upload file/ảnh
- `nodemailer` gửi email (quên mật khẩu, thông báo)
- `slugify`, `uuid`

**Database**: SQL Server — schema đầy đủ tại `database/schema.sql`, dữ liệu mẫu tại `SQL/SQLQuery1.sql`.

---

## 📁 Cấu trúc thư mục

```
thietbiyte_shop/
├── backend/
│   ├── src/
│   │   ├── config/          # Kết nối DB (db.js), tự đồng bộ schema (ensureSchema.js)
│   │   ├── controllers/     # Logic xử lý cho từng module (auth, product, order, admin...)
│   │   ├── middleware/      # auth (JWT), security (helmet/rate-limit), upload (multer), errorHandler
│   │   ├── routes/          # Định nghĩa endpoint cho từng module
│   │   ├── scripts/         # seed.js, seed-products.js, unlock-admin.js...
│   │   ├── utils/           # email.js, helpers.js
│   │   ├── validators/      # authValidator.js
│   │   └── server.js        # Điểm khởi chạy server Express
│   ├── uploads/              # Ảnh upload (products, banners, brands, avatars...)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/            # Trang khách hàng (Home, Product, Cart, Checkout, Orders...)
│   │   ├── pages/admin/      # Trang quản trị (Dashboard, Products, Orders, Users...)
│   │   ├── pages/auth/       # Login, Register, Forgot/Reset password
│   │   ├── components/       # Component dùng chung (layout, product, admin, ui, order, auth, home)
│   │   ├── context/          # React Context (Auth, Cart...)
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # Gọi API (axios instance, service theo module)
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── database/
│   ├── schema.sql             # Toàn bộ schema (DROP + CREATE), dùng khi setup từ đầu bằng SSMS
│   ├── seed.sql                # Dữ liệu mẫu tham khảo
│   └── ERD.md                  # Sơ đồ quan hệ các bảng
├── SQL/
│   ├── SQLQuery1.sql           # Script tạo DB + dữ liệu mẫu — dùng cho máy CHƯA có database
│   └── install-safe.sql        # Script cập nhật AN TOÀN — chỉ thêm bảng/cột thiếu, KHÔNG xoá dữ liệu cũ
├── CAI-DAT.bat                 # Cài đặt tự động (double-click trên Windows)
├── install-all.ps1             # Script PowerShell thực thi bởi CAI-DAT.bat
└── package.json                # Một vài dependency dùng chung ở root
```

---

## ⚡ Cài đặt nhanh (tự động) - Windows

Nếu dùng Windows và đã cài sẵn **Node.js** + **SQL Server**, đây là cách nhanh nhất:

1. Double-click file **`CAI-DAT.bat`** ở thư mục gốc.
2. Script sẽ tự động:
   - Kiểm tra Node.js
   - Tạo file `backend/.env` và `frontend/.env` (mở Notepad để bạn sửa `DB_SERVER`, `DB_USER`, `DB_PASSWORD`)
   - Tạo các thư mục `backend/uploads/*`
   - Chạy `npm install` cho cả backend và frontend
   - Kết nối SQL Server và tự chạy script tạo bảng + dữ liệu mẫu (nếu có `sqlcmd`)
   - Đồng bộ schema (`ensureSchema`) và seed tài khoản admin/user demo
3. Sau khi cài xong, mở 2 terminal:
   ```bash
   # Terminal 1
   cd backend
   npm run dev

   # Terminal 2
   cd frontend
   npm run dev
   ```
4. Truy cập: **http://localhost:5173** (Admin: `http://localhost:5173/admin`)

> Nếu không có `sqlcmd` trong máy, script sẽ bỏ qua bước chạy SQL — bạn cần tự chạy file `SQL/SQLQuery1.sql` (máy mới) hoặc `SQL/install-safe.sql` (máy đã có dữ liệu) bằng SSMS như hướng dẫn ở phần dưới.

Nếu dùng macOS/Linux, hoặc muốn hiểu rõ từng bước, làm theo phần **Cài đặt thủ công** bên dưới.

---

## 🔧 Cài đặt thủ công từ A → Z

### 1. Clone & cài dependencies

```bash
# Giải nén / clone project, sau đó vào thư mục gốc
cd thietbiyte_shop

# Cài dependencies cho backend
cd backend
npm install

# Cài dependencies cho frontend
cd ../frontend
npm install
```

### 2. Cài đặt SQL Server

- Cài **SQL Server** (Express/Developer edition) + **SSMS** để thao tác bằng giao diện.
- Trong quá trình cài, bật chế độ **Mixed Mode Authentication** và đặt mật khẩu cho tài khoản `sa`.
- Đảm bảo SQL Server đang chạy và cho phép kết nối TCP/IP trên cổng `1433` (kiểm tra qua **SQL Server Configuration Manager** nếu kết nối từ xa/Docker).

### 3. Tạo database & seed dữ liệu

Có 2 cách, chọn 1:

**Cách A — Dùng SSMS (khuyến nghị cho lần đầu):**

1. Mở SSMS, kết nối tới SQL Server instance của bạn.
2. Mở file `SQL/SQLQuery1.sql` (máy **chưa có** database `MediCareStore`) và nhấn **Execute**. Script này sẽ tự tạo database, toàn bộ bảng và dữ liệu mẫu (sản phẩm, danh mục, thương hiệu...).
3. Nếu bạn **đã có** database từ trước và chỉ muốn cập nhật thêm bảng/cột mới mà **không mất dữ liệu cũ**, dùng `SQL/install-safe.sql` thay thế.
4. Có thể tham khảo thêm `database/schema.sql` (schema đầy đủ, có DROP + CREATE) và `database/ERD.md` (sơ đồ quan hệ các bảng) để hiểu cấu trúc dữ liệu.

**Cách B — Dùng `sqlcmd` (dòng lệnh):**

```bash
# Database mới hoàn toàn
sqlcmd -S localhost -U sa -P "MatKhauCuaBan" -i SQL/SQLQuery1.sql

# Hoặc cập nhật an toàn cho DB đã có dữ liệu
sqlcmd -S localhost -U sa -P "MatKhauCuaBan" -i SQL/install-safe.sql
```

### 4. Cấu hình biến môi trường

**Backend** — copy `backend/.env.example` thành `backend/.env` rồi chỉnh sửa:

```env
PORT=5000
NODE_ENV=development

# SQL Server
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=MatKhauCuaBan          # ⚠️ đổi đúng mật khẩu SQL Server của bạn
DB_NAME=MediCareStore
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# JWT
JWT_SECRET=doi-thanh-chuoi-bi-mat-that-manh   # ⚠️ đổi trước khi deploy production
JWT_EXPIRES_IN=7d

# Frontend URL (CORS)
CLIENT_URL=http://localhost:5173

# Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Email (SMTP) — dùng cho quên mật khẩu / thông báo
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password         # dùng App Password của Gmail, không dùng mật khẩu thường
EMAIL_FROM=MediCare Store <noreply@medicarestore.com>

# App
APP_NAME=MediCare Store
APP_URL=http://localhost:5000
```

**Frontend** — copy `frontend/.env.example` thành `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_UPLOAD_URL=http://localhost:5000
```

> Chỉ cần đổi giá trị này nếu bạn chạy backend ở cổng khác hoặc deploy lên domain thật.

Sau khi tạo `.env`, tạo sẵn các thư mục lưu ảnh upload (nếu chưa có):

```bash
cd backend
mkdir -p uploads/products uploads/categories uploads/banners uploads/brands uploads/avatars uploads/reviews uploads/pages
```

### 5. Chạy dự án

**Đồng bộ schema & seed tài khoản demo** (khuyến nghị chạy 1 lần sau khi tạo DB):

```bash
cd backend
node -e "import('./src/config/ensureSchema.js').then(m=>m.ensureSchema())"
npm run seed            # tạo tài khoản admin/user demo
npm run seed-products   # (tuỳ chọn) seed thêm dữ liệu sản phẩm mẫu
```

**Chạy backend:**

```bash
cd backend
npm run dev      # chạy với --watch, tự reload khi sửa code
# hoặc
npm start        # chạy production, không watch
```
→ Backend chạy tại `http://localhost:5000`, kiểm tra nhanh bằng `http://localhost:5000/api/health`.

**Chạy frontend** (terminal khác):

```bash
cd frontend
npm run dev
```
→ Frontend chạy tại `http://localhost:5173`.

**Truy cập ứng dụng:**
- Trang khách hàng: http://localhost:5173
- Trang quản trị (admin): http://localhost:5173/admin

---

## 👤 Tài khoản demo

Sau khi chạy `npm run seed` trong backend:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@medicarestore.com` | `Admin@123` |
| User | `user@medicarestore.com` | `User@123` |

Nếu tài khoản admin bị khoá do đăng nhập sai nhiều lần, chạy:
```bash
cd backend
npm run unlock-admin
```

---

## 🔌 Danh sách API chính

Base URL: `http://localhost:5000/api`

| Nhóm | Prefix | Mô tả |
|---|---|---|
| Auth | `/auth` | Đăng ký, đăng nhập, quên/đặt lại mật khẩu |
| Products | `/products` | CRUD sản phẩm, tìm kiếm, lọc |
| Categories | `/categories` | Danh mục sản phẩm |
| Brands | `/brands` | Thương hiệu |
| Banners | `/banners` | Banner trang chủ |
| Contacts | `/contacts` | Form liên hệ |
| Newsletter | `/newsletter` | Đăng ký nhận tin |
| Wishlist | `/wishlist` | Sản phẩm yêu thích |
| Cart | `/cart` | Giỏ hàng |
| Orders | `/orders` | Đặt hàng, lịch sử đơn hàng |
| Coupons | `/coupons` | Mã giảm giá |
| Reviews | `/reviews` | Đánh giá sản phẩm |
| Pages | `/pages` | Trang tĩnh (chính sách, điều khoản...) |
| Home | `/home` | Dữ liệu tổng hợp cho trang chủ |
| Notifications | `/notifications` | Thông báo người dùng |
| Admin | `/admin` | Thống kê dashboard, quản lý người dùng/đơn hàng |
| Activity | `/activity` | Nhật ký hoạt động (activity log) |
| Warranties | `/warranties` | Bảo hành sản phẩm |

Health check: `GET /api/health`

> Các route yêu cầu đăng nhập cần gửi header `Authorization: Bearer <token>` lấy được từ `/auth/login`.

---

## 🛠️ Các lệnh npm hữu ích

**Backend** (`cd backend`):
```bash
npm run dev             # chạy dev với --watch
npm start                # chạy production
npm run seed              # seed tài khoản admin/user demo
npm run seed-products     # seed dữ liệu sản phẩm mẫu
npm run unlock-admin       # mở khoá tài khoản admin bị khoá do đăng nhập sai
```

**Frontend** (`cd frontend`):
```bash
npm run dev        # chạy dev server (Vite)
npm run build       # build production ra thư mục dist/
npm run preview      # xem thử bản build
npm run lint          # kiểm tra lỗi ESLint
```

---

## 🗄️ Sơ đồ database (ERD)

Xem chi tiết đầy đủ tại `database/ERD.md`. Tóm tắt các bảng chính:

| Bảng | Mô tả |
|---|---|
| Users | Tài khoản khách hàng & admin, mật khẩu mã hoá bcrypt |
| Categories | Danh mục sản phẩm |
| Brands | Thương hiệu để lọc sản phẩm |
| Products | Thiết bị y tế |
| ProductImages | Ảnh sản phẩm (nhiều ảnh/sản phẩm) |
| Cart | Giỏ hàng của người dùng |
| Orders / OrderDetails | Đơn hàng và chi tiết từng dòng đơn hàng |
| Payments | Thông tin thanh toán (COD/online) |
| Reviews | Đánh giá & bình luận sản phẩm |
| Coupons | Mã giảm giá |
| Banners | Banner slideshow trang chủ |
| PasswordResetTokens | Token cho luồng quên mật khẩu |

---

## 🩹 Xử lý lỗi thường gặp

**1. Backend báo lỗi kết nối SQL Server (`Failed to start server`)**
- Kiểm tra SQL Server đã bật chưa (SQL Server Configuration Manager → SQL Server Services).
- Kiểm tra đúng `DB_SERVER`, `DB_USER`, `DB_PASSWORD` trong `backend/.env`.
- Đảm bảo đã bật **Mixed Mode Authentication** và tài khoản `sa` đang active.
- Nếu SQL Server chạy trên máy khác/Docker, bật TCP/IP trong SQL Server Configuration Manager và mở port `1433` trên firewall.

**2. Lỗi CORS khi frontend gọi API**
- Kiểm tra `CLIENT_URL` trong `backend/.env` khớp đúng địa chỉ frontend đang chạy (`http://localhost:5173`).

**3. Ảnh upload không hiển thị**
- Kiểm tra các thư mục con trong `backend/uploads/` đã được tạo (`products`, `banners`, `brands`, `avatars`, `categories`, `reviews`, `pages`).
- Kiểm tra `VITE_UPLOAD_URL` trong `frontend/.env` trỏ đúng địa chỉ backend.

**4. Bị chặn quá nhiều request (429 Too Many Requests)**
- Backend có rate limit: 5 lần thất bại/15 phút cho các route auth (login/register/quên mật khẩu) để chống brute-force, và giới hạn chung cho toàn bộ `/api`. Đợi 15 phút hoặc restart backend ở môi trường dev.

**5. Tài khoản admin bị khoá**
- Chạy `npm run unlock-admin` trong thư mục `backend`.

**6. `npm install` lỗi trên Windows do quyền/PowerShell**
- Chạy `CAI-DAT.bat` với quyền Administrator, hoặc bật quyền chạy script: `powershell -ExecutionPolicy Bypass`.

---

## 🚀 Build & Deploy

**Build frontend cho production:**
```bash
cd frontend
npm run build
```
Kết quả nằm ở `frontend/dist/` — có thể deploy lên Vercel (đã có sẵn `vercel.json`), Netlify, hoặc bất kỳ static hosting nào.

**Deploy backend:**
- Cần Node.js runtime + SQL Server accessible từ server (Azure SQL, SQL Server trên VPS, hoặc SQL Server container).
- Set đầy đủ biến môi trường production trong `backend/.env` (đổi `JWT_SECRET`, `DB_PASSWORD` thật, `NODE_ENV=production`, `CLIENT_URL` trỏ đúng domain frontend).
- Chạy bằng `npm start`, khuyến nghị dùng PM2 hoặc tương tự để giữ tiến trình chạy nền và tự restart khi crash.

> ⚠️ **Lưu ý bảo mật trước khi deploy:** không commit file `.env` thật (đã có trong `.gitignore`), đổi toàn bộ mật khẩu/secret mặc định (`JWT_SECRET`, mật khẩu SQL, mật khẩu tài khoản demo admin/user).
