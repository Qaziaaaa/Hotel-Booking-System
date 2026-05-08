import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { hotelsAPI, roomsAPI, reviewsAPI } from '../../services/api';
import { MapPin, Star, Wifi, Car, Coffee, Dumbbell, Waves, Check, X, ChevronLeft } from 'lucide-react';
import dayjs from 'dayjs';

const amenityIcons = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee,
  gym: Dumbbell,
  pool: Waves,
};

const HotelDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [selectedImage, setSelectedImage] = useState(0);

  const checkIn = searchParams.get('checkIn') || dayjs().format('YYYY-MM-DD');
  const checkOut = searchParams.get('checkOut') || dayjs().add(1, 'day').format('YYYY-MM-DD');
  const guests = parseInt(searchParams.get('guests')) || 2;

  const { data: hotelData, isLoading: hotelLoading } = useQuery({
    queryKey: ['hotel', id],
    queryFn: () => hotelsAPI.getById(id),
  });

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', id, { checkIn, checkOut, guests }],
    queryFn: () => roomsAPI.getByHotel(id, { checkIn, checkOut, guests }),
  });

  const [reviewPage, setReviewPage] = useState(1);

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id, reviewPage],
    queryFn: () => reviewsAPI.getByHotel(id, { page: reviewPage, limit: 5 }),
  });

  const hotel = hotelData?.data.data.hotel;
  const rooms = roomsData?.data.data.rooms || [];
  const reviews = reviewsData?.data.data.reviews || hotel?.reviews?.slice(0, 3) || [];
  const reviewPagination = reviewsData?.data.data.pagination;

  if (hotelLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hotel not found</h2>
          <Link to="/hotels" className="text-primary-600 hover:underline">
            Back to hotels
          </Link>
        </div>
      </div>
    );
  }

  const nights = dayjs(checkOut).diff(dayjs(checkIn), 'day');

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          to={`/hotels?${searchParams.toString()}`}
          className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to search
        </Link>
      </div>

      {/* Image Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="aspect-video lg:aspect-auto lg:h-[400px] rounded-xl overflow-hidden">
            <img
              src={hotel.images?.[selectedImage] || '/placeholder-hotel.jpg'}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {hotel.images?.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-video rounded-lg overflow-hidden ${
                  selectedImage === idx ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <img src={img} alt={`${hotel.name} ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Hotel Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
                <p className="text-gray-600 flex items-center">
                  <MapPin className="h-5 w-5 mr-1 text-gray-400" />
                  {hotel.address || hotel.location}
                </p>
              </div>
              <div className="flex items-center bg-primary-50 px-3 py-2 rounded-lg">
                <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                <span className="font-bold text-lg">{hotel.avgRating?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-500 text-sm ml-1">({hotel.reviews?.length || 0} reviews)</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 leading-relaxed">{hotel.description}</p>
            </div>

            <div className="bg-white rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-3">
                {hotel.amenities?.map((amenity) => {
                  const Icon = amenityIcons[amenity.toLowerCase()] || Check;
                  return (
                    <span
                      key={amenity}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {amenity}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Reviews */}
            {(reviews.length > 0) && (
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {review.user.firstName} {review.user.lastName}
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
                {reviewPagination && reviewPagination.pages > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    <button
                      onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                      disabled={reviewPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
                    >Prev</button>
                    <span className="px-3 py-1 text-sm text-gray-600">{reviewPage} / {reviewPagination.pages}</span>
                    <button
                      onClick={() => setReviewPage(p => Math.min(reviewPagination.pages, p + 1))}
                      disabled={reviewPage === reviewPagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 text-sm"
                    >Next</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rooms Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Rooms</h2>
              <div className="text-sm text-gray-500 mb-4">
                {nights} night{nights > 1 ? 's' : ''} • {guests} guest{guests > 1 ? 's' : ''}
              </div>

              {roomsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : rooms.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No rooms available for selected dates.</p>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`border rounded-lg p-4 ${
                        room.isAvailable ? 'border-primary-200 bg-primary-50' : 'border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{room.roomType}</h3>
                        {room.isAvailable ? (
                          <span className="text-green-600 text-sm flex items-center">
                            <Check className="h-4 w-4 mr-1" /> Available
                          </span>
                        ) : (
                          <span className="text-red-600 text-sm flex items-center">
                            <X className="h-4 w-4 mr-1" /> Booked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Up to {room.capacity} guests</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-2xl font-bold text-primary-600">${room.price}</span>
                          <span className="text-gray-500 text-sm">/night</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total: <span className="font-semibold">${room.price * nights}</span></p>
                        </div>
                      </div>
                      {room.isAvailable && (
                        <Link
                          to={`/book/${hotel.id}/${room.id}?${searchParams.toString()}`}
                          className="mt-3 w-full block text-center bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                        >
                          Book Now
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailPage;
