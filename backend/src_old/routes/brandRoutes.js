import { Router } from 'express';
import * as brand from '../controllers/brandController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();

router.get('/', brand.getBrands);
router.post('/', authenticate, requireAdmin, ...uploadSingle('logo', 'brands'), brand.createBrand);
router.put('/:id', authenticate, requireAdmin, ...uploadSingle('logo', 'brands'), brand.updateBrand);
router.patch('/:id/visibility', authenticate, requireAdmin, brand.setBrandVisibility);
router.delete('/:id', authenticate, requireAdmin, brand.deleteBrand);

export default router;
