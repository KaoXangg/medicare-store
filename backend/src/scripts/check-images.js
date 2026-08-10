import { getPool, query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  await getPool();
  const res = await query('SELECT * FROM ProductImages LIMIT 10');
  console.log('ProductImages content:', res.recordset);
  
  const banners = await query('SELECT * FROM Banners LIMIT 10');
  console.log('Banners content:', banners.recordset);
  
  const cats = await query('SELECT * FROM Categories LIMIT 10');
  console.log('Categories content:', cats.recordset);

  process.exit(0);
}

run();
