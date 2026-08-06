import { Router } from 'express';
import * as coupon from '../controllers/couponController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/validate', coupon.validateCoupon);
router.get('/', authenticate, requireAdmin, coupon.getCoupons);
router.post('/', authenticate, requireAdmin, coupon.createCoupon);
router.put('/:id', authenticate, requireAdmin, coupon.updateCoupon);
router.delete('/:id', authenticate, requireAdmin, coupon.deleteCoupon);

export default router;
