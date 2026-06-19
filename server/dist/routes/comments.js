"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comments_1 = require("../controllers/comments");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/', comments_1.getComments);
router.post('/', auth_1.authenticate, comments_1.createComment);
router.delete('/:id', auth_1.authenticate, comments_1.deleteComment);
exports.default = router;
//# sourceMappingURL=comments.js.map