import { Router } from 'express';
import * as product from '../controllers/productController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = Router();

router.get('/search/suggest', product.searchSuggest);
router.get('/', product.getProducts);
router.get('/featured', product.getFeatured);
router.get('/popular', product.getPopular);
router.get('/:slug', product.getProductBySlug);

router.post('/', authenticate, requireAdmin, ...uploadMultiple('images', 5), product.createProduct);
router.put('/:id', authenticate, requireAdmin, ...uploadMultiple('images', 5), product.updateProduct);
router.patch('/:id/visibility', authenticate, requireAdmin, product.setProductVisibility);
router.delete('/:id', authenticate, requireAdmin, product.deleteProduct);

export default router;
