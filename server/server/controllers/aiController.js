import catchAsync from '../utils/catchAsync.js';
import aiService from '../services/aiRecommendationService.js';

export const getRecommendations = catchAsync(async (req, res) => {
  const { destination, budget, interests, travelStyle, duration } = req.body;

  const result = await aiService.getTravelRecommendations({
    destination,
    budget,
    interests,
    travelStyle,
    duration,
  });

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const getPersonalizedHotels = catchAsync(async (req, res) => {
  const { location, amenities, minRating, maxPrice, budget } = req.body;

  const result = await aiService.getPersonalizedHotels(req.user.id, {
    location,
    amenities,
    minRating,
    maxPrice,
    budget,
  });

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const analyzeSentiment = catchAsync(async (req, res) => {
  const { hotelId } = req.params;

  const result = await aiService.analyzeHotelSentiment(hotelId);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export default {
  getRecommendations,
  getPersonalizedHotels,
  analyzeSentiment,
};
