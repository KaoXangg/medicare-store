import { Router } from 'express';
import * as page from '../controllers/pageController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();

router.get('/images', page.getPageImages);
router.get('/images/admin', authenticate, requireAdmin, page.getPageImagesAdmin);
router.put('/images/:page/:slot', authenticate, requireAdmin, ...uploadSingle('image', 'pages'), page.updatePageImage);

export default router;
