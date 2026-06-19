import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notifications';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getNotifications);
router.put('/read', authenticate, markAsRead);

export default router;
