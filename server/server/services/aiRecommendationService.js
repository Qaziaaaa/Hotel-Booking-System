import axios from 'axios';
import prisma from '../config/database.js';

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

/**
 * Get AI-powered travel recommendations based on user preferences
 */
export const getTravelRecommendations = async (preferences) => {
  const { destination, budget, interests, travelStyle, duration } = preferences;

  try {
    // Build a prompt for the AI
    const prompt = `Generate travel recommendations for ${destination || 'a destination'} for a ${duration || 'few days'} trip with a ${budget || 'moderate'} budget. The traveler is interested in ${interests?.join(', ') || 'general tourism'} and prefers ${travelStyle || 'balanced'} travel style. Include top attractions, best time to visit, local tips, and accommodation suggestions.`;

    // Call Hugging Face API for text generation
    const response = await axios.post(
      HF_API_URL,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    // Parse and structure the AI response
    const aiText = response.data[0]?.summary_text || response.data[0]?.generated_text || '';
    
    return {
      success: true,
      recommendations: parseRecommendations(aiText),
      rawResponse: aiText,
    };
  } catch (error) {
    console.error('AI Recommendation Error:', error.message);
    
    // Fallback to template-based recommendations
    return {
      success: true,
      recommendations: getFallbackRecommendations(preferences),
      fallback: true,
    };
  }
};

/**
 * Get personalized hotel recommendations based on user history
 */
export const getPersonalizedHotels = async (userId, preferences) => {
  try {
    // Get user's booking history
    const userBookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        hotel: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get hotels based on preferences and past behavior
    let whereClause = {};
    
    if (preferences.location) {
      whereClause.OR = [
        { location: { contains: preferences.location, mode: 'insensitive' } },
        { address: { contains: preferences.location, mode: 'insensitive' } },
      ];
    }

    if (preferences.amenities?.length > 0) {
      whereClause.amenities = { hasSome: preferences.amenities };
    }

    if (preferences.minRating) {
      whereClause.rating = { gte: preferences.minRating };
    }

    const recommendedHotels = await prisma.hotel.findMany({
      where: whereClause,
      include: {
        rooms: {
          where: preferences.maxPrice ? { price: { lte: preferences.maxPrice } } : {},
        },
        reviews: { take: 5 },
      },
      take: 10,
    });

    // Score and rank hotels
    const scoredHotels = recommendedHotels.map(hotel => {
      let score = hotel.rating * 20; // Base score from rating (out of 100)
      
      // Boost for matching user preferences
      if (preferences.amenities) {
        const matchingAmenities = preferences.amenities.filter(amenity => 
          hotel.amenities.includes(amenity)
        ).length;
        score += matchingAmenities * 10;
      }

      // Boost for price within budget
      const cheapestRoom = hotel.rooms.reduce((min, room) => 
        room.price < min.price ? room : min, hotel.rooms[0]
      );
      
      if (preferences.budget && cheapestRoom) {
        const budgetMap = { low: 100, moderate: 250, high: 500, luxury: 1000 };
        const budgetLimit = budgetMap[preferences.budget] || 250;
        if (cheapestRoom.price <= budgetLimit) {
          score += 15;
        }
      }

      return { ...hotel, score, cheapestRoom };
    });

    // Sort by score
    scoredHotels.sort((a, b) => b.score - a.score);

    return {
      success: true,
      hotels: scoredHotels.slice(0, 6),
      basedOnHistory: userBookings.length > 0,
    };
  } catch (error) {
    console.error('Personalized Hotel Error:', error);
    throw error;
  }
};

/**
 * Parse AI-generated text into structured recommendations
 */
const parseRecommendations = (text) => {
  const sections = {
    summary: '',
    attractions: [],
    tips: [],
    accommodations: [],
    bestTime: '',
  };

  // Simple parsing logic
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length > 0) {
    sections.summary = lines[0];
  }

  let currentSection = 'summary';
  
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('attraction') || lowerLine.includes('visit')) {
      currentSection = 'attractions';
    } else if (lowerLine.includes('tip') || lowerLine.includes('advice')) {
      currentSection = 'tips';
    } else if (lowerLine.includes('hotel') || lowerLine.includes('accommodation') || lowerLine.includes('stay')) {
      currentSection = 'accommodations';
    } else if (lowerLine.includes('best time') || lowerLine.includes('when to visit')) {
      currentSection = 'bestTime';
      sections.bestTime = line;
    }

    if (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line)) {
      sections[currentSection].push(line.replace(/^[-•\d.\s]+/, '').trim());
    }
  });

  return sections;
};

/**
 * Fallback recommendations when AI is unavailable
 */
const getFallbackRecommendations = (preferences) => {
  const destination = preferences.destination || 'this destination';
  
  return {
    summary: `Discover the best of ${destination} with our curated travel guide.`,
    attractions: [
      'Visit historic landmarks and cultural sites',
      'Explore local markets and shopping districts',
      'Experience authentic local cuisine',
      'Enjoy scenic views and photo opportunities',
    ],
    tips: [
      'Book accommodations in advance for better rates',
      'Use public transportation to explore like a local',
      'Try to learn a few basic phrases in the local language',
      'Keep copies of important documents',
    ],
    accommodations: [
      'Boutique hotels in the city center',
      'Budget-friendly hostels for backpackers',
      'Luxury resorts for a premium experience',
      'Vacation rentals for longer stays',
    ],
    bestTime: 'Spring and fall typically offer the best weather and fewer crowds.',
  };
};

/**
 * Analyze sentiment of user reviews for a hotel
 */
export const analyzeHotelSentiment = async (hotelId) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { hotelId },
      select: { comment: true, rating: true },
    });

    if (reviews.length === 0) {
      return { sentiment: 'neutral', score: 0 };
    }

    // Simple sentiment analysis based on keywords and ratings
    const positiveWords = ['excellent', 'amazing', 'great', 'wonderful', 'perfect', 'beautiful', 'clean', 'friendly', 'helpful', 'recommend'];
    const negativeWords = ['terrible', 'awful', 'bad', 'dirty', 'rude', 'poor', 'worst', 'disappointing', 'overpriced', 'noisy'];

    let sentimentScore = 0;
    let analyzedCount = 0;

    reviews.forEach(review => {
      if (review.comment) {
        const lowerComment = review.comment.toLowerCase();
        
        positiveWords.forEach(word => {
          if (lowerComment.includes(word)) sentimentScore += 1;
        });
        
        negativeWords.forEach(word => {
          if (lowerComment.includes(word)) sentimentScore -= 1;
        });
        
        analyzedCount++;
      }
      
      // Weight by rating
      sentimentScore += (review.rating - 3) * 0.5;
    });

    const normalizedScore = analyzedCount > 0 ? sentimentScore / analyzedCount : 0;
    
    let sentiment = 'neutral';
    if (normalizedScore > 0.5) sentiment = 'positive';
    else if (normalizedScore < -0.5) sentiment = 'negative';

    return {
      sentiment,
      score: Math.round(normalizedScore * 100),
      totalReviews: reviews.length,
    };
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    return { sentiment: 'neutral', score: 0 };
  }
};

export default {
  getTravelRecommendations,
  getPersonalizedHotels,
  analyzeHotelSentiment,
};
