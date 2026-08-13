// config/supabase.js
import { createClient } from '@supabase/supabase-js';

// Dùng SERVICE ROLE KEY (không phải anon key) vì đây là server-side,
// cần quyền ghi vào bucket bỏ qua Row Level Security.
// Lấy 2 giá trị này trong Supabase Dashboard > Project Settings > API.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[supabase] Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong biến môi trường');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});