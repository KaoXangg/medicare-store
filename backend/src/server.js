import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { securityMiddleware, apiLimiter } from './middleware/security.js';
import { getPool } from './config/db.js';


dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(...securityMiddleware);

app.use(cors({
  origin: process.env.CLIENT_URL || [
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MediCare Store API is running',
    version: '2.0.0'
  });
});

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await getPool();

    console.log('✓ Connected to SQL Server');

    app.listen(PORT, () => {
      console.log(`✓ MediCare Store API: http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();