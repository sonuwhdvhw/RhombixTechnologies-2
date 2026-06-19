import { Router } from 'express';
import {
  sendFriendRequest,
  respondToRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
} from '../controllers/friendships';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getFriends);
router.get('/pending', authenticate, getPendingRequests);
router.post('/request', authenticate, sendFriendRequest);
router.put('/:id/respond', authenticate, respondToRequest);
router.delete('/:id', authenticate, removeFriend);

export default router;
