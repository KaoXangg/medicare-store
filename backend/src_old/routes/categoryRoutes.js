import { Router } from 'express';
import * as category from '../controllers/categoryController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();

router.get('/', category.getCategories);
router.get('/:id', category.getCategory);
router.post('/', authenticate, requireAdmin, ...uploadSingle('image', 'categories'), category.createCategory);
router.put('/:id', authenticate, requireAdmin, ...uploadSingle('image', 'categories'), category.updateCategory);
router.patch('/:id/visibility', authenticate, requireAdmin, category.toggleCategoryVisibility);
router.delete('/:id', authenticate, requireAdmin, category.deleteCategory);

export default router;
