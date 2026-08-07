🏥 MediCare Store

MediCare Store là website thương mại điện tử chuyên kinh doanh thiết bị y tế, được xây dựng theo mô hình Fullstack với React.js, Node.js (Express) và Microsoft SQL Server.

Dự án được thiết kế theo kiến trúc MVC, giao diện hiện đại, tối ưu trải nghiệm người dùng, hỗ trợ quản trị hệ thống đầy đủ và có thể mở rộng để triển khai trong môi trường thực tế.

⸻

📌 Mục lục

* Tính năng nổi bật
* Công nghệ sử dụng
* Kiến trúc hệ thống
* Cấu trúc thư mục
* Yêu cầu hệ thống
* Hướng dẫn cài đặt
* Biến môi trường
* Tài khoản mặc định
* API chính
* Chức năng hệ thống
* Thanh toán
* Email
* Roadmap
* License

⸻

✨ Tính năng nổi bật

👤 Khách hàng

* Đăng ký / Đăng nhập bằng JWT
* Quên mật khẩu
* Quản lý hồ sơ cá nhân
* Xem lịch sử đơn hàng
* Tìm kiếm sản phẩm
* Lọc theo danh mục, thương hiệu, giá
* Sắp xếp sản phẩm
* Phân trang
* Xem chi tiết sản phẩm
* Bộ sưu tập hình ảnh sản phẩm
* Đánh giá sản phẩm
* Thêm vào giỏ hàng
* Áp dụng mã giảm giá
* Thanh toán COD
* Thanh toán Online (Mock)
* Responsive trên mọi thiết bị
* Dark Mode

⸻

👨‍💼 Quản trị viên

* Dashboard thống kê
* Doanh thu
* Biểu đồ
* Quản lý sản phẩm
* Upload nhiều ảnh (Multer)
* Quản lý danh mục
* Quản lý thương hiệu
* Quản lý đơn hàng
* Cập nhật trạng thái đơn
* Quản lý người dùng
* Khóa/Mở khóa tài khoản
* Phân quyền
* Kiểm duyệt đánh giá
* Quản lý Banner
* Quản lý Blog
* Quản lý Liên hệ

⸻

🚀 Công nghệ sử dụng

Frontend

* React 19
* Vite
* Tailwind CSS v4
* React Router DOM
* Axios
* Context API
* Framer Motion
* React Icons

⸻

Backend

* Node.js
* Express.js
* MVC Architecture
* JWT Authentication
* bcrypt
* Multer
* CORS
* Helmet
* Express Rate Limit
* Morgan

⸻

Database

* Microsoft SQL Server

⸻

UI/UX

* Responsive Design
* Dark Mode
* Toast Notification
* Modal
* Skeleton Loading
* Loading Spinner
* Modern Dashboard

⸻

🏗 Kiến trúc hệ thống

React (Frontend)
        │
        │ Axios
        ▼
Express REST API
        │
 Controllers
        │
 Services
        │
 SQL Server

⸻

📁 Cấu trúc thư mục

thietbiyte_shop
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── utils
│   │   ├── scripts
│   │   └── server.js
│   │
│   ├── uploads
│   ├── .env.example
│   └── package.json
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   ├── context
│   │   ├── hooks
│   │   ├── layouts
│   │   ├── pages
│   │   ├── services
│   │   ├── utils
│   │   └── App.jsx
│   │
│   ├── .env.example
│   └── package.json
│
├── database
│   ├── schema.sql
│   ├── seed.sql
│   └── ERD.md
│
└── README.md

⸻

💻 Yêu cầu hệ thống

* Node.js 18 trở lên
* SQL Server 2019 hoặc SQL Server Express
* SQL Server Management Studio (SSMS)
* npm hoặc Yarn

⸻

⚙ Hướng dẫn cài đặt

1. Clone project

git clone https://github.com/KaoXangg/medicare-store.git
cd medicare-store

⸻

2. Tạo Database

Mở SQL Server Management Studio và thực hiện:

database/schema.sql

sau đó chạy

database/seed.sql

Hoặc dùng sqlcmd

sqlcmd -S localhost -U sa -P "YourPassword" -i database\schema.sql
sqlcmd -S localhost -U sa -P "YourPassword" -d MediCareStore -i database\seed.sql

⸻

3. Cài đặt Backend

cd backend
npm install

Tạo file

.env

từ

.env.example

Sau đó chỉnh sửa các thông tin kết nối SQL Server.

Khởi động:

npm run seed
npm run dev

Backend chạy tại

http://localhost:5000

⸻

4. Cài đặt Frontend

cd frontend
npm install

Tạo file

.env

từ

.env.example

Khởi động

npm run dev

Frontend chạy tại

http://localhost:5173

⸻

🔐 Biến môi trường

Backend (.env)

PORT=5000
DB_SERVER=localhost
DB_DATABASE=MediCareStore
DB_USER=sa
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

⸻

Frontend (.env)

VITE_API_URL=http://localhost:5000/api

⸻

🌐 Địa chỉ truy cập

URL	Chức năng
http://localhost:5173	Website khách hàng
http://localhost:5173/admin	Trang quản trị
http://localhost:5000/api/health	Kiểm tra API

⸻

👥 Tài khoản mặc định

Vai trò	Email	Mật khẩu
Admin	admin@medicarestore.com	Admin@123
User	user@medicarestore.com	User@123

Sau khi tạo database, chạy:

npm run seed

để sinh dữ liệu mẫu.

⸻

🎁 Mã giảm giá mẫu

Mã	Ưu đãi
WELCOME10	Giảm 10%
MEDICARE50K	Giảm 50.000 VNĐ
VIP15	Giảm 15%

⸻

📡 API chính

Authentication

POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password

⸻

Product

GET /api/products
GET /api/products/:slug

⸻

Category

GET /api/categories

⸻

Brand

GET /api/brands

⸻

Cart

GET /api/cart
POST /api/cart

⸻

Order

POST /api/orders
GET /api/orders/my
POST /api/orders/:id/pay

⸻

Review

POST /api/reviews

⸻

Admin

GET /api/admin/dashboard
CRUD /api/products
CRUD /api/categories
GET /api/orders
PATCH /api/orders/:id/status
GET /api/admin/users
PATCH /api/admin/users/:id

⸻

📦 Chức năng hệ thống

✅ Đăng ký tài khoản

✅ Đăng nhập JWT

✅ Phân quyền

✅ CRUD sản phẩm

✅ CRUD danh mục

✅ CRUD thương hiệu

✅ Upload nhiều ảnh

✅ Giỏ hàng

✅ Đặt hàng

✅ Thanh toán

✅ Mã giảm giá

✅ Đánh giá sản phẩm

✅ Dashboard thống kê

✅ Quản lý đơn hàng

✅ Quản lý người dùng

✅ Responsive

✅ Dark Mode

⸻

💳 Thanh toán

Hiện tại hệ thống hỗ trợ:

* Thanh toán khi nhận hàng (COD)
* Thanh toán Online (Mock)

Có thể tích hợp thêm:

* VNPay
* MoMo
* ZaloPay
* Stripe
* PayPal

⸻

📧 Email

Hệ thống hỗ trợ gửi email xác nhận đơn hàng.

Nếu chưa cấu hình SMTP, email sẽ được ghi ra Console (Mock Mode).

⸻

🛣 Roadmap

* Tích hợp VNPay
* Tích hợp MoMo
* Chat trực tuyến
* Wishlist
* So sánh sản phẩm
* AI Chatbot tư vấn
* Thống kê nâng cao
* Báo cáo PDF
* Đa ngôn ngữ
* PWA
* Docker Deployment
* CI/CD

⸻

📄 License

MIT License

Dự án được xây dựng phục vụ mục đích học tập, nghiên cứu và có thể mở rộng để triển khai trong môi trường thực tế.

⸻

👨‍💻 Tác giả

Trần Cao Sang
Nếu dự án hữu ích, hãy ⭐ repository để ủng hộ quá trình phát triển.
