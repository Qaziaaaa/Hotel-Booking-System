import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  createRoom,
  getRoomsByHotel,
  getRoom,
  updateRoom,
  deleteRoom,
  checkAvailability,
} from '../controllers/roomController.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(getRoomsByHotel)
  .post(protect, restrictTo('ADMIN'), createRoom);

router.route('/availability').get(checkAvailability);
router.route('/:id').get(getRoom).patch(protect, restrictTo('ADMIN'), updateRoom).delete(protect, restrictTo('ADMIN'), deleteRoom);

export default router;
