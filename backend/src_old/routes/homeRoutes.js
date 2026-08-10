import { Router } from 'express';
import * as home from '../controllers/homeController.js';

const router = Router();
router.get('/', home.getHomeData);
export default router;
