import { getPool, query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// We will use a beautiful, high-quality, hotlink-safe blue medical technology banner from Unsplash
const newUrl = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&h=600&fit=crop';

async function run() {
  try {
    await getPool();
    console.log('Connecting to SQL Server to update Banner 2...');
    
    // We update the second banner (BannerId = 2) to ensure it uses a working high-tech blue medical banner
    const res = await query('UPDATE Banners SET ImageUrl = @newUrl WHERE BannerId = 2', { newUrl });
    console.log(`Updated Banner 2 in DB: ${res.rowsAffected[0]} row(s)`);

    process.exit(0);
  } catch (err) {
    console.error('Error updating Banner 2:', err);
    process.exit(1);
  }
}

run();
