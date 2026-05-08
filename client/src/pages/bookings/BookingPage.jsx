import { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { hotelsAPI, roomsAPI, bookingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, MapPin, CreditCard, AlertCircle, Check, ChevronLeft } from 'lucide-react';
import dayjs from 'dayjs';

const BookingPage = () => {
  const { hotelId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [specialRequests, setSpecialRequests] = useState('');

  const checkIn = searchParams.get('checkIn') || dayjs().format('YYYY-MM-DD');
  const checkOut = searchParams.get('checkOut') || dayjs().add(1, 'day').format('YYYY-MM-DD');
  const guests = parseInt(searchParams.get('guests')) || 2;

  const { data: hotelData } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: () => hotelsAPI.getById(hotelId),
  });

  const { data: roomData } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomsAPI.getById(roomId),
  });

  const createBookingMutation = useMutation({
    mutationFn: (data) => bookingsAPI.create(data),
    onSuccess: () => {
      navigate('/my-bookings');
    },
  });

  const hotel = hotelData?.data.data.hotel;
  const room = roomData?.data.data.room;

  if (!hotel || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const nights = dayjs(checkOut).diff(dayjs(checkIn), 'day');
  const roomTotal = room.price * nights;
  const taxes = roomTotal * 0.15; // 15% taxes
  const total = roomTotal + taxes;

  const handleBooking = () => {
    createBookingMutation.mutate({
      hotelId,
      roomId,
      checkIn,
      checkOut,
      guests,
      specialRequests: specialRequests || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to={`/hotels/${hotelId}?${searchParams.toString()}`}
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to hotel
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Details */}
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Room Details</h2>
              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0">
                  {room.images?.[0] && (
                    <img src={room.images[0]} alt={room.roomType} className="w-full h-full object-cover rounded-lg" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{room.roomType}</h3>
                  <p className="text-gray-600">{hotel.name}</p>
                  <p className="text-gray-500 text-sm flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {hotel.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Stay Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-medium">{dayjs(checkIn).format('MMM D, YYYY')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-medium">{dayjs(checkOut).format('MMM D, YYYY')}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 mt-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Guests</p>
                  <p className="font-medium">{guests} guest{guests > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  {nights} night{nights > 1 ? 's' : ''} stay
                </p>
              </div>
            </div>

            {/* Special Requests */}
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Requests</h2>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any special requests? (e.g., late check-in, specific room preferences)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={4}
              />
            </div>
          </div>

          {/* Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">${room.price} x {nights} night{nights > 1 ? 's' : ''}</span>
                  <span className="font-medium">${roomTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees (15%)</span>
                  <span className="font-medium">${taxes.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-primary-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {createBookingMutation.isError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">
                    {createBookingMutation.error?.response?.data?.message || 'Booking failed. Please try again.'}
                  </p>
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={createBookingMutation.isPending}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {createBookingMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>

              <p className="mt-4 text-xs text-gray-500 text-center">
                You won't be charged yet. Payment will be processed at the hotel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
