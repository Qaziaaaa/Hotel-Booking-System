import express from 'express';
import { protect } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  checkCanReview,
} from '../controllers/bookingController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(validate(schemas.createBooking), createBooking)
  .get(getMyBookings);

router.get('/my', getMyBookings);
router.get('/:id/can-review', checkCanReview);

router.route('/:id')
  .get(getBooking)
  .delete(cancelBooking);

export default router;
