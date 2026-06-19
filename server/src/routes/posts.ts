import { Router } from 'express';
import {
  getFeedPosts,
  createPost,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
  getUserPosts,
} from '../controllers/posts';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/feed', optionalAuth, getFeedPosts);
router.post('/', authenticate, createPost);
router.get('/user/:userId', optionalAuth, getUserPosts);
router.get('/:id', optionalAuth, getPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, toggleLike);

export default router;
