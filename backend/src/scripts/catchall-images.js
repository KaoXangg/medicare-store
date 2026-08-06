import { getPool, query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    await getPool();
    console.log('Connected for catch-all image fix...');

    // Update any missing product images
    const pRes = await query(`
      UPDATE ProductImages 
      SET ImageUrl = 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&h=600&fit=crop' 
      WHERE ImageUrl LIKE '/uploads/products/%' OR ImageUrl IS NULL
    `);
    console.log(`Updated ProductImages placeholders: ${pRes.rowsAffected[0]} row(s)`);

    // Update any missing category images
    const cRes = await query(`
      UPDATE Categories 
      SET Image = 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=400&fit=crop' 
      WHERE Image LIKE '/uploads/categories/%' OR Image IS NULL
    `);
    console.log(`Updated Categories placeholders: ${cRes.rowsAffected[0]} row(s)`);

    // Update any missing brand logos
    const bRes = await query(`
      UPDATE Brands 
      SET Logo = 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Flag_of_None.svg' 
      WHERE Logo LIKE '/uploads/brands/%' OR Logo IS NULL
    `);
    console.log(`Updated Brands placeholders: ${bRes.rowsAffected[0]} row(s)`);

    // Update any missing banners
    const banRes = await query(`
      UPDATE Banners 
      SET ImageUrl = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&h=600&fit=crop' 
      WHERE ImageUrl LIKE '/uploads/banners/%' OR ImageUrl IS NULL
    `);
    console.log(`Updated Banners placeholders: ${banRes.rowsAffected[0]} row(s)`);

    console.log('Catch-all image fix complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error running catchall fix:', err);
    process.exit(1);
  }
}

run();
