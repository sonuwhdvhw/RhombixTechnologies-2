import { Router } from 'express';
import { getComments, createComment, deleteComment } from '../controllers/comments';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', getComments);
router.post('/', authenticate, createComment);
router.delete('/:id', authenticate, deleteComment);

export default router;
