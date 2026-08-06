import { Router } from 'express';
import * as banner from '../controllers/bannerController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();

router.get('/', authenticate, requireAdmin, banner.getBannersAdmin);
router.post('/', authenticate, requireAdmin, ...uploadSingle('image', 'banners'), banner.createBanner);
router.put('/:id', authenticate, requireAdmin, ...uploadSingle('image', 'banners'), banner.updateBanner);
router.delete('/:id', authenticate, requireAdmin, banner.deleteBanner);

export default router;
