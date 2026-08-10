import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import * as notification from '../controllers/notificationController.js';
import * as flashSale from '../controllers/flashSaleController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/dashboard', admin.getDashboard);
router.get('/notifications', notification.getAdminNotifications);
router.get('/users', admin.getUsers);
router.patch('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);
router.get('/products', admin.getAllProductsAdmin);
router.get('/products/:id', admin.getProductAdmin);
router.get('/users/pending-verify', admin.getPendingVerifyUsers);
router.patch('/users/:id/verify', admin.verifyUser);
router.get('/users/pending-verify-phone', admin.getPendingVerifyPhoneUsers);
router.patch('/users/:id/verify-phone', admin.verifyUserPhone);


router.get('/flash-sale', flashSale.getFlashSaleAdmin);
router.put('/flash-sale/end', flashSale.updateFlashSaleEnd);
router.put('/flash-sale/items', flashSale.setFlashSaleItems);

export default router;