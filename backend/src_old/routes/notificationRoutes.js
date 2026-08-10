import { Router } from 'express';
import * as notification from '../controllers/notificationController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/my', authenticate, notification.getMyNotificationCounts);

export default router;
