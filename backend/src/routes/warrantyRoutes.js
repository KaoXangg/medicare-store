import { Router } from 'express';
import * as warranty from '../controllers/warrantyController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/lookup', warranty.lookupByPhone);

router.get('/', authenticate, requireAdmin, warranty.getWarranties);
router.get('/stats', authenticate, requireAdmin, warranty.getWarrantyStats);
router.post('/', authenticate, requireAdmin, warranty.createWarranty);
router.put('/:id', authenticate, requireAdmin, warranty.updateWarranty);
router.delete('/:id', authenticate, requireAdmin, warranty.deleteWarranty);

export default router;