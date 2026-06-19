"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messages_1 = require("../controllers/messages");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/conversations', auth_1.authenticate, messages_1.getConversations);
router.get('/:partnerId', auth_1.authenticate, messages_1.getMessages);
router.post('/', auth_1.authenticate, messages_1.sendMessage);
exports.default = router;
//# sourceMappingURL=messages.js.map