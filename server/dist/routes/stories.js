"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stories_1 = require("../controllers/stories");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.optionalAuth, stories_1.getStories);
router.post('/', auth_1.authenticate, stories_1.createStory);
router.post('/:id/view', auth_1.authenticate, stories_1.viewStory);
exports.default = router;
//# sourceMappingURL=stories.js.map