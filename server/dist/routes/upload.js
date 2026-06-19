"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const upload_1 = require("../controllers/upload");
const auth_1 = require("../middleware/auth");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('File type not allowed'));
        }
    },
});
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, upload.single('file'), upload_1.uploadFile);
router.delete('/', auth_1.authenticate, upload_1.deleteFile);
exports.default = router;
//# sourceMappingURL=upload.js.map