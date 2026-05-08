import express from 'express';
import { protect } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import {
  createReview,
  getHotelReviews,
  getMyReviews,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';

const router = express.Router({ mergeParams: true });

// Routes for reviews of a specific hotel
router.route('/')
  .get(getHotelReviews)
  .post(protect, validate(schemas.createReview), createReview);

// My reviews route (not nested)
router.get('/my/reviews', protect, getMyReviews);

// Individual review routes
router.route('/:id')
  .patch(protect, updateReview)
  .delete(protect, deleteReview);

export default router;
