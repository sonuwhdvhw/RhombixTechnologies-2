"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const friendships_1 = require("../controllers/friendships");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, friendships_1.getFriends);
router.get('/pending', auth_1.authenticate, friendships_1.getPendingRequests);
router.post('/request', auth_1.authenticate, friendships_1.sendFriendRequest);
router.put('/:id/respond', auth_1.authenticate, friendships_1.respondToRequest);
router.delete('/:id', auth_1.authenticate, friendships_1.removeFriend);
exports.default = router;
//# sourceMappingURL=friendships.js.map