import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getRoom,
  updateRoom,
  deleteRoom,
  checkAvailability,
} from '../controllers/roomController.js';
import upload from '../middleware/upload.js';
import cloudinaryUpload from '../middleware/cloudinaryUpload.js';

const router = express.Router();

router.get('/availability', checkAvailability);
router.get('/:id', getRoom);
router.patch('/:id', protect, restrictTo('ADMIN'), upload, cloudinaryUpload, updateRoom);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteRoom);

export default router;
