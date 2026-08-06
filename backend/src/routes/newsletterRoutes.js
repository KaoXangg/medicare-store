import { Router } from 'express';
import * as newsletter from '../controllers/newsletterController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/subscribe', newsletter.subscribe);
router.get('/', authenticate, requireAdmin, newsletter.getSubscribers);

export default router;
