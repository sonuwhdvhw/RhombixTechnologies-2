"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_1 = require("../controllers/notifications");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, notifications_1.getNotifications);
router.put('/read', auth_1.authenticate, notifications_1.markAsRead);
exports.default = router;
//# sourceMappingURL=notifications.js.map