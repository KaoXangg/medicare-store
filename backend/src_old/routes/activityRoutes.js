import { Router } from 'express';
import * as activity from '../controllers/activityController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, activity.createLog);
router.get('/', authenticate, requireAdmin, activity.getLogs);
router.get('/by-user', authenticate, requireAdmin, activity.getLogsByUser);
router.get('/stats', authenticate, requireAdmin, activity.getStats);

export default router;