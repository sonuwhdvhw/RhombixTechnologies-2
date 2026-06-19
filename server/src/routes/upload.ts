import { Router } from 'express';
import multer from 'multer';
import { uploadFile, deleteFile } from '../controllers/upload';
import { authenticate } from '../middleware/auth';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

const router = Router();

router.post('/', authenticate, upload.single('file'), uploadFile);
router.delete('/', authenticate, deleteFile);

export default router;
