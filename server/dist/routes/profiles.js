"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profiles_1 = require("../controllers/profiles");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/search', auth_1.optionalAuth, profiles_1.searchUsers);
router.get('/suggestions', auth_1.authenticate, profiles_1.getSuggestedUsers);
router.get('/:username', auth_1.optionalAuth, profiles_1.getProfile);
router.put('/', auth_1.authenticate, profiles_1.updateProfile);
exports.default = router;
//# sourceMappingURL=profiles.js.map