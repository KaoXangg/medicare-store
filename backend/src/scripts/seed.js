import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getPool, query } from '../config/db.js';

dotenv.config();

async function seed() {
  await getPool();
  console.log('Seeding users...');

  const adminHash = await bcrypt.hash('Admin@123', 12);
  const userHash = await bcrypt.hash('User@123', 12);

  const adminExists = await query("SELECT UserId FROM Users WHERE Email = 'admin@medicarestore.com'");
  if (!adminExists.recordset.length) {
    await query(
      `INSERT INTO Users (Email, PasswordHash, FullName, Phone, Role) 
       VALUES ('admin@medicarestore.com', @hash, 'Admin MediCare', '0901234567', 'admin')`,
      { hash: adminHash }
    );
    console.log('✓ Admin: admin@medicarestore.com / Admin@123');
  }

  const userExists = await query("SELECT UserId FROM Users WHERE Email = 'user@medicarestore.com'");
  if (!userExists.recordset.length) {
    await query(
      `INSERT INTO Users (Email, PasswordHash, FullName, Phone, Address, Role) 
       VALUES ('user@medicarestore.com', @hash, 'Nguyễn Văn User', '0912345678', '123 Lê Lợi, Q1, TP.HCM', 'user')`,
      { hash: userHash }
    );
    console.log('✓ User: user@medicarestore.com / User@123');
  }

  console.log('Seed completed.');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
