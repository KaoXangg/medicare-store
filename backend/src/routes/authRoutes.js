import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { uploadSingle } from '../middleware/upload.js';
import {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
} from '../validators/authValidator.js';

const router = Router();

router.get('/check-availability', auth.checkAvailability);
router.post('/register', authLimiter, registerRules, auth.register);
router.post('/login', authLimiter, loginRules, auth.login);
router.post('/forgot-password', authLimiter, forgotPasswordRules, auth.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordRules, auth.resetPassword);
router.post('/refresh', auth.refreshToken);
router.get('/profile', authenticate, auth.getProfile);
router.put('/profile', authenticate, auth.updateProfile);
router.put('/change-password', authenticate, auth.changePassword);
router.put('/change-email', authenticate, auth.changeEmail);
router.put('/notifications', authenticate, auth.updateNotifications);
router.post('/upload-avatar', authenticate, ...uploadSingle('avatar', 'avatars'), auth.uploadAvatar);
router.post('/request-verify', authenticate, auth.requestVerify);
router.post('/request-verify-phone', authenticate, auth.requestVerifyPhone);


export default router;