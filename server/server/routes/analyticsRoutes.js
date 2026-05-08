import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getDashboardStats,
  getUserStats,
  getHotelStats,
} from '../controllers/analyticsController.js';

const router = express.Router();

router.use(protect, restrictTo('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUserStats);
router.get('/hotel/:hotelId', getHotelStats);

export default router;
