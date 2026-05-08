import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI } from '../../services/api';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, Star, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import ReviewModal from '../../components/ReviewModal';

const getStatusColor = (status) => {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const MyBookingsPage = () => {
  const queryClient = useQueryClient();
  const [reviewBooking, setReviewBooking] = useState(null);
  const [cancelBookingId, setCancelBookingId] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingsAPI.getMyBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      setCancelBookingId(null);
    },
  });

  const bookings = data?.data.data.bookings || [];

  const handleCancel = (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      cancelMutation.mutate(id);
    }
  };

  const canCancel = (booking) => {
    return booking.status === 'CONFIRMED' && dayjs(booking.checkIn).isAfter(dayjs());
  };

  const canReview = (booking) => {
    return booking.status === 'COMPLETED' && 
           dayjs(booking.checkOut).isBefore(dayjs()) && 
           !booking.review;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
            <p className="text-red-600">Failed to load bookings. Please try again.</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h2>
            <p className="text-gray-600 mb-6">Start exploring hotels and make your first booking!</p>
            <a href="/hotels" className="btn-primary inline-block">
              Browse Hotels
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    {/* Hotel Info */}
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0">
                          {booking.hotel.images?.[0] && (
                            <img
                              src={booking.hotel.images[0]}
                              alt={booking.hotel.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-xl font-semibold text-gray-900">{booking.hotel.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-gray-600 flex items-center mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.hotel.location}
                          </p>
                          <p className="text-gray-700 font-medium">{booking.room.roomType}</p>
                        </div>
                      </div>

                      {/* Dates & Guests */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Check-in</p>
                          <p className="font-medium">{dayjs(booking.checkIn).format('MMM D, YYYY')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Check-out</p>
                          <p className="font-medium">{dayjs(booking.checkOut).format('MMM D, YYYY')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Guests</p>
                          <p className="font-medium flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {booking.guests}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Price</p>
                          <p className="font-bold text-primary-600">${booking.totalPrice}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                      {canCancel(booking) && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelMutation.isPending}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                          Cancel Booking
                        </button>
                      )}
                      {canReview(booking) && (
                        <button
                          onClick={() => setReviewBooking(booking)}
                          className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium flex items-center justify-center"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Write Review
                        </button>
                      )}
                      {booking.review && (
                        <div className="flex items-center text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Reviewed ({booking.review.rating}/5)
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.specialRequests && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">Special Requests:</p>
                      <p className="text-gray-700">{booking.specialRequests}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null);
            queryClient.invalidateQueries({ queryKey: ['myBookings'] });
          }}
        />
      )}
    </div>
  );
};

export default MyBookingsPage;
