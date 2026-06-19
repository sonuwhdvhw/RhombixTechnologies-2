import { Router } from 'express';
import { getProfile, updateProfile, searchUsers, getSuggestedUsers } from '../controllers/profiles';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/search', optionalAuth, searchUsers);
router.get('/suggestions', authenticate, getSuggestedUsers);
router.get('/:username', optionalAuth, getProfile);
router.put('/', authenticate, updateProfile);

export default router;
