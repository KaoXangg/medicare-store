import { Router } from 'express';
import * as wishlist from '../controllers/wishlistController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', wishlist.getWishlist);
router.get('/ids', wishlist.getWishlistIds);
router.post('/', wishlist.addToWishlist);
router.delete('/:productId', wishlist.removeFromWishlist);

export default router;
