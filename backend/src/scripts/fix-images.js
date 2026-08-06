import { getPool, query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const bannerMapping = {
  '/uploads/banners/banner1.jpg': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&h=600&fit=crop',
  '/uploads/banners/banner2.jpg': 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=1600&h=600&fit=crop',
  '/uploads/banners/banner3.jpg': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1600&h=600&fit=crop'
};

const categoryMapping = {
  '/uploads/categories/blood-pressure.jpg': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop',
  '/uploads/categories/glucose.jpg': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=400&fit=crop',
  '/uploads/categories/mask.jpg': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop',
  '/uploads/categories/oxygen.jpg': 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=400&h=400&fit=crop',
  '/uploads/categories/thermometer.jpg': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop',
  '/uploads/categories/wheelchair.jpg': 'https://images.unsplash.com/photo-1597075095404-5cc8e96bfcf0?w=400&h=400&fit=crop'
};

const brandMapping = {
  '/uploads/brands/omron.png': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Omron_Logo.svg',
  '/uploads/brands/beurer.png': 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Beurer_Logo.svg',
  '/uploads/brands/philips.png': 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Philips_logo_new.svg',
  '/uploads/brands/3m.png': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/3M_logo.svg',
  '/uploads/brands/yuwell.png': 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Flag_of_None.svg', // Fallback placeholder
  '/uploads/brands/microlife.png': 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Flag_of_None.svg' // Fallback placeholder
};

const productMapping = {
  '/uploads/products/omron-7130-1.jpg': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&h=600&fit=crop',
  '/uploads/products/omron-7130-2.jpg': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=600&fit=crop',
  '/uploads/products/microlife-a2.jpg': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&h=600&fit=crop',
  '/uploads/products/yuwell-580.jpg': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&h=600&fit=crop',
  '/uploads/products/3m-n95.jpg': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=600&fit=crop',
  '/uploads/products/philips-oxygen.jpg': 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&h=600&fit=crop',
  '/uploads/products/beurer-ft85.jpg': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop',
  '/uploads/products/yuwell-wheelchair.jpg': 'https://images.unsplash.com/photo-1597075095404-5cc8e96bfcf0?w=600&h=600&fit=crop',
  '/uploads/products/beurer-bm26.jpg': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=600&fit=crop'
};

async function run() {
  try {
    await getPool();
    console.log('Connected to SQL Server for fixing images...');

    // 1. Update Banners
    for (const [oldUrl, newUrl] of Object.entries(bannerMapping)) {
      const res = await query('UPDATE Banners SET ImageUrl = @newUrl WHERE ImageUrl = @oldUrl', { oldUrl, newUrl });
      console.log(`Updated banner: ${oldUrl} -> ${res.rowsAffected[0]} row(s)`);
    }

    // 2. Update Categories
    for (const [oldUrl, newUrl] of Object.entries(categoryMapping)) {
      const res = await query('UPDATE Categories SET Image = @newUrl WHERE Image = @oldUrl', { oldUrl, newUrl });
      console.log(`Updated category: ${oldUrl} -> ${res.rowsAffected[0]} row(s)`);
    }

    // 3. Update Brands
    for (const [oldUrl, newUrl] of Object.entries(brandMapping)) {
      const res = await query('UPDATE Brands SET Logo = @newUrl WHERE Logo = @oldUrl', { oldUrl, newUrl });
      console.log(`Updated brand: ${oldUrl} -> ${res.rowsAffected[0]} row(s)`);
    }

    // 4. Update ProductImages
    for (const [oldUrl, newUrl] of Object.entries(productMapping)) {
      const res = await query('UPDATE ProductImages SET ImageUrl = @newUrl WHERE ImageUrl = @oldUrl', { oldUrl, newUrl });
      console.log(`Updated product image: ${oldUrl} -> ${res.rowsAffected[0]} row(s)`);
    }

    console.log('Successfully completed fixing database images to Unsplash urls!');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing database images:', err);
    process.exit(1);
  }
}

run();
