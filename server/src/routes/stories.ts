import { Router } from 'express';
import { getStories, createStory, viewStory } from '../controllers/stories';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getStories);
router.post('/', authenticate, createStory);
router.post('/:id/view', authenticate, viewStory);

export default router;
