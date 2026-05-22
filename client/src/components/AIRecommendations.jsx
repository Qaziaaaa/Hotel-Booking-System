import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiAPI } from '../services/api';
import { Sparkles, MapPin, Loader2, Star, DollarSign, Users, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIRecommendations = () => {
  const [preferences, setPreferences] = useState({
    destination: '',
    budget: 'moderate',
    interests: [],
    travelStyle: 'balanced',
    duration: '3-5 days',
  });
  const [showResults, setShowResults] = useState(false);

  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['aiRecommendations', preferences],
    queryFn: () => aiAPI.getRecommendations(preferences),
    enabled: false,
  });

  const { data: personalizedHotels } = useQuery({
    queryKey: ['personalizedHotels', preferences.destination],
    queryFn: () => aiAPI.getPersonalizedHotels({
      location: preferences.destination,
      budget: preferences.budget,
    }),
    enabled: showResults && !!preferences.destination,
  });

  const interestOptions = [
    'Sightseeing', 'Food & Dining', 'Adventure', 'Relaxation', 
    'Culture', 'Shopping', 'Nightlife', 'Nature'
  ];

  const handleGetRecommendations = () => {
    setShowResults(true);
    refetch();
  };

  const toggleInterest = (interest) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const recData = recommendations?.data?.data?.recommendations;
  const hotels = personalizedHotels?.data?.data?.hotels || [];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 mb-8">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="h-6 w-6 text-purple-600 flex-shrink-0" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">AI Travel Recommendations</h2>
      </div>

      {!showResults ? (
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-300 break-words">
            Let our AI help you plan the perfect trip. Tell us your preferences and get personalized recommendations.
          </p>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" /> Destination (optional)
            </label>
            <input
              type="text"
              value={preferences.destination}
              onChange={(e) => setPreferences({ ...preferences, destination: e.target.value })}
              placeholder="Where would you like to go?"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="inline h-4 w-4 mr-1" /> Budget
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['low', 'moderate', 'high', 'luxury'].map((budget) => (
                <button
                  key={budget}
                  onClick={() => setPreferences({ ...preferences, budget })}
                  className={`py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                    preferences.budget === budget
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {budget}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Compass className="inline h-4 w-4 mr-1" /> Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`py-1.5 px-3 rounded-full text-sm transition-colors ${
                    preferences.interests.includes(interest)
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="inline h-4 w-4 mr-1" /> Travel Style
            </label>
            <select
              value={preferences.travelStyle}
              onChange={(e) => setPreferences({ ...preferences, travelStyle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="relaxed">Relaxed - Take it easy</option>
              <option value="balanced">Balanced - Mix of activities</option>
              <option value="active">Active - Packed schedule</option>
              <option value="adventurous">Adventurous - Thrill seeking</option>
            </select>
          </div>

          <button
            onClick={handleGetRecommendations}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span>Get AI Recommendations</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <button
            onClick={() => setShowResults(false)}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to preferences
          </button>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-300">AI is generating your recommendations...</p>
            </div>
          ) : (
            <>
              {/* AI Recommendations */}
              {recData && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Travel Guide</h3>
                  
                  {recData.summary && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{recData.summary}</p>
                  )}

                  {recData.attractions?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Top Attractions</h4>
                      <ul className="space-y-1">
                        {recData.attractions.map((attr, idx) => (
                          <li key={idx} className="text-gray-600 dark:text-gray-400 flex items-start">
                            <span className="text-purple-500 mr-2">•</span>
                            {attr}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recData.tips?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Travel Tips</h4>
                      <ul className="space-y-1">
                        {recData.tips.map((tip, idx) => (
                          <li key={idx} className="text-gray-600 dark:text-gray-400 flex items-start">
                            <span className="text-purple-500 mr-2">💡</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recData.bestTime && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Best time to visit:</strong> {recData.bestTime}
                    </p>
                  )}
                </div>
              )}

              {/* Personalized Hotels */}
              {hotels.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Recommended Hotels For You
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotels.map((hotel) => (
                      <Link
                        key={hotel.id}
                        to={`/hotels/${hotel.id}`}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                            {hotel.images?.[0] && (
                              <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover rounded-lg" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white break-words">{hotel.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 break-words">{hotel.location}</p>
                            <div className="flex items-center mt-2 space-x-3">
                              <span className="flex items-center text-sm">
                                <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                {hotel.rating}
                              </span>
                              {hotel.cheapestRoom && (
                                <span className="text-sm text-purple-600 font-medium">
                                  From ${hotel.cheapestRoom.price}/night
                                </span>
                              )}
                            </div>
                            {hotel.score > 0 && (
                              <div className="mt-2">
                                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                                  Match: {Math.round(hotel.score)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;
