import { Router } from 'express';
import * as contact from '../controllers/contactController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/my/notifications', authenticate, contact.getMyContactNotifications);
router.get('/my', authenticate, contact.getMyContacts);
router.patch('/my/:id/read', authenticate, contact.markMyContactRead);
router.post('/', authenticate, contact.submitContact);

router.get('/', authenticate, requireAdmin, contact.getContacts);
router.patch('/:id/read', authenticate, requireAdmin, contact.markContactRead);
router.patch('/:id/reply', authenticate, requireAdmin, contact.replyContact);
router.delete('/:id', authenticate, requireAdmin, contact.deleteContact);

export default router;
