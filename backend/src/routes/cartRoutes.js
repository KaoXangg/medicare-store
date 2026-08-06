import { Router } from 'express';
import * as cart from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/', cart.getCart);
router.post('/', cart.addToCart);
router.put('/:id', cart.updateCartItem);
router.delete('/:id', cart.removeFromCart);
router.delete('/', cart.clearCart);
export default router;
