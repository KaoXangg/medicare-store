import { Router } from 'express';
import * as order from '../controllers/orderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, order.createOrder);
router.post('/:id/pay', authenticate, order.payOnline);
router.get('/my', authenticate, order.getMyOrders);
router.get('/my/:id', authenticate, order.getMyOrder);

router.get('/', authenticate, requireAdmin, order.getAllOrders);
router.get('/:id', authenticate, requireAdmin, order.getOrderById);
router.patch('/:id/status', authenticate, requireAdmin, order.updateOrderStatus);
router.delete('/:id', authenticate, requireAdmin, order.deleteOrder);

export default router;
