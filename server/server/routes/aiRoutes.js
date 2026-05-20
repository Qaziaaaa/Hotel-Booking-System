import express from 'express';
import { protect, optionalAuth } from '../middleware/auth.js';
import {
  getRecommendations,
  getPersonalizedHotels,
  analyzeSentiment,
} from '../controllers/aiController.js';

const router = express.Router();

router.post('/recommendations', optionalAuth, getRecommendations);
router.post('/personalized-hotels', protect, getPersonalizedHotels);
router.get('/sentiment/:hotelId', protect, analyzeSentiment);

export default router;
