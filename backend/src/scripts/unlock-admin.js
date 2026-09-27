/**
 * Mở khóa tài khoản admin (IsActive = 1)
 * Chạy: node src/scripts/unlock-admin.js
 * Hoặc: node src/scripts/unlock-admin.js admin@medicarestore.com
 */
import dotenv from 'dotenv';
import { getPool, query } from '../config/db.js';

dotenv.config();

const email = process.argv[2] || 'admin@medicarestore.com';

async function unlock() {
  await getPool();
  const result = await query(
    `UPDATE Users SET IsActive = 1, Role = 'admin', UpdatedAt = GETUTCDATE()
     OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.FullName, INSERTED.Role, INSERTED.IsActive
     WHERE Email = @email`,
    { email }
  );
  if (!result.recordset.length) {
    console.log(`Không tìm thấy user: ${email}`);
    process.exit(1);
  }
  const u = result.recordset[0];
  console.log('✓ Đã mở khóa tài khoản:');
  console.log(`  Email: ${u.Email}`);
  console.log(`  Role: ${u.Role}`);
  console.log(`  IsActive: ${u.IsActive}`);
  process.exit(0);
}

unlock().catch((e) => {
  console.error('Lỗi:', e.message);
  process.exit(1);
});
