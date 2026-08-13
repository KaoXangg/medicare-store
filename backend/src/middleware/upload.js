import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads');

['products', 'categories', 'banners', 'brands', 'avatars', 'reviews', 'pages'].forEach((sub) => {
  const dir = path.join(uploadDir, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.uploadType || 'products';
    cb(null, path.join(uploadDir, type));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpe?g|png|gif|webp|heic|heif/i;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = !file.mimetype || /image\/(jpe?g|png|gif|webp|heic|heif)/i.test(file.mimetype);
  if (ext || mimeOk) cb(null, true);
  else cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF)'));
};

export const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) },
  fileFilter,
});

export const uploadSingle = (field, type = 'products') => [
  (req, res, next) => { req.uploadType = type; next(); },
  upload.single(field),
];

export const uploadMultiple = (field, max = 5, type = 'products') => [
  (req, res, next) => { req.uploadType = type; next(); },
  upload.array(field, max),
];

// Avatar dùng riêng memoryStorage (không ghi ra ổ đĩa) vì ảnh sẽ được
// upload thẳng lên Supabase Storage trong controller — cần req.file.buffer,
// không phải req.file.filename/path như các loại upload khác ở trên.
const avatarMemoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) },
  fileFilter,
});

export const uploadAvatarMemory = avatarMemoryUpload.single('avatar');