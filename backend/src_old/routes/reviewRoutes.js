import { Router } from 'express';
import * as review from '../controllers/reviewController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = Router();

router.get('/product/:productId/mine', authenticate, review.getMyProductReview);
router.get('/product/:productId', review.getProductReviews);
router.post('/', authenticate, ...uploadMultiple('images', 5, 'reviews'), review.createReview);
router.put('/:id', authenticate, ...uploadMultiple('images', 5, 'reviews'), review.updateReview);
router.delete('/:id', authenticate, review.deleteReview);

router.get('/', authenticate, requireAdmin, review.getReviews);
router.patch('/bulk', authenticate, requireAdmin, review.bulkReviewAction);
router.patch('/:id/approve', authenticate, requireAdmin, review.approveReview);
router.patch('/:id', authenticate, requireAdmin, review.toggleReviewApproval);

export default router;
