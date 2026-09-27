import { getPool, query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  await getPool();
  const res = await query('SELECT TOP 10 * FROM ProductImages');
  console.log('ProductImages content:', res.recordset);
  
  const banners = await query('SELECT TOP 10 * FROM Banners');
  console.log('Banners content:', banners.recordset);
  
  const cats = await query('SELECT TOP 10 * FROM Categories');
  console.log('Categories content:', cats.recordset);

  process.exit(0);
}

run();
