import { Router } from 'express';
import * as blog from '../controllers/blogController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', blog.getPublishedPosts);
router.get('/admin/all', authenticate, requireAdmin, blog.getAllPostsAdmin);
router.post('/admin', authenticate, requireAdmin, blog.createPost);
router.put('/admin/:id', authenticate, requireAdmin, blog.updatePost);
router.delete('/admin/:id', authenticate, requireAdmin, blog.deletePost);
router.get('/:slug', blog.getPostBySlug);

export default router;
