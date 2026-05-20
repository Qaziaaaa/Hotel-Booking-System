import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createReview,
  getMyReviews,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';

const router = express.Router();

router.get('/my/reviews', protect, getMyReviews);
router.post('/', protect, createReview);
router.patch('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;
