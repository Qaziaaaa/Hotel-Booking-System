import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import {
  createHotel,
  getAllHotels,
  getHotel,
  updateHotel,
  deleteHotel,
} from '../controllers/hotelController.js';
import roomRoutes from './roomRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import upload from '../middleware/upload.js';
import cloudinaryUpload from '../middleware/cloudinaryUpload.js';

const router = express.Router();

// Nested routes
router.use('/:hotelId/rooms', roomRoutes);
router.use('/:hotelId/reviews', reviewRoutes);

router.route('/')
  .get(getAllHotels)
  .post(protect, restrictTo('ADMIN'), upload, cloudinaryUpload, createHotel);

router.route('/:id')
  .get(getHotel)
  .patch(protect, restrictTo('ADMIN'), upload, cloudinaryUpload, updateHotel)
  .delete(protect, restrictTo('ADMIN'), deleteHotel);

export default router;
