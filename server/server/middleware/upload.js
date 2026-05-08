import multer from 'multer';
import AppError from '../utils/AppError.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

export default upload.array('images', 10);
