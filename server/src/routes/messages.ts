import { Router } from 'express';
import { getConversations, getMessages, sendMessage } from '../controllers/messages';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/conversations', authenticate, getConversations);
router.get('/:partnerId', authenticate, getMessages);
router.post('/', authenticate, sendMessage);

export default router;
