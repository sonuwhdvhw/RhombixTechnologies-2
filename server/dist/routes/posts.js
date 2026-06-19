"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const posts_1 = require("../controllers/posts");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/feed', auth_1.optionalAuth, posts_1.getFeedPosts);
router.post('/', auth_1.authenticate, posts_1.createPost);
router.get('/user/:userId', auth_1.optionalAuth, posts_1.getUserPosts);
router.get('/:id', auth_1.optionalAuth, posts_1.getPost);
router.put('/:id', auth_1.authenticate, posts_1.updatePost);
router.delete('/:id', auth_1.authenticate, posts_1.deletePost);
router.post('/:id/like', auth_1.authenticate, posts_1.toggleLike);
exports.default = router;
//# sourceMappingURL=posts.js.map