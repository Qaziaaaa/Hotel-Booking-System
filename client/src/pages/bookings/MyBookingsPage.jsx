import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI } from '../../services/api';
import dayjs from 'dayjs';
import ReviewModal from '../../components/ReviewModal';

const MyBookingsPage = () => {
  const queryClient = useQueryClient();
  const [reviewBooking, setReviewBooking] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const { data, isLoading, error } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingsAPI.getMyBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const allBookings = data?.data.data.bookings || [];

  const handleCancel = (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      cancelMutation.mutate(id);
    }
  };

  const canCancel = (booking) => {
    return booking.status === 'CONFIRMED' && dayjs(booking.checkIn).isAfter(dayjs());
  };

  const canReview = (booking) => {
    return (
      booking.status === 'COMPLETED' &&
      dayjs(booking.checkOut).isBefore(dayjs()) &&
      !booking.review
    );
  };

  const filters = ['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'];

  const filteredBookings = allBookings.filter((booking) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'UPCOMING') return booking.status === 'CONFIRMED' && dayjs(booking.checkIn).isAfter(dayjs());
    if (activeFilter === 'COMPLETED') return booking.status === 'COMPLETED';
    if (activeFilter === 'CANCELLED') return booking.status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-sans text-[11px] font-semibold uppercase tracking-widest">
            Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-sans text-[11px] font-semibold uppercase tracking-widest">
            Pending
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-block px-3 py-1 bg-surface-container text-on-surface-variant border border-outline-variant/50 rounded-full font-sans text-[11px] font-semibold uppercase tracking-widest">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-block px-3 py-1 bg-error-container text-on-error-container rounded-full font-sans text-[11px] font-semibold uppercase tracking-widest">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 bg-surface-container text-on-surface-variant rounded-full font-sans text-[11px] font-semibold uppercase tracking-widest">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-serif text-[48px] leading-tight text-on-surface">My Reservations</h1>
          <p className="font-sans text-base text-on-surface-variant mt-2">
            Manage your upcoming and past stays
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-6 border-b border-outline-variant mb-8 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`pb-3 font-sans text-[12px] font-semibold uppercase tracking-widest whitespace-nowrap transition-colors ${
                activeFilter === filter
                  ? 'border-b-2 border-secondary text-secondary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-error-container rounded-xl p-6 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-error-container mx-auto mb-2 block">error</span>
            <p className="font-sans text-on-error-container">Failed to load bookings. Please try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!error && filteredBookings.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-16 text-center shadow-ambient">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 block mb-4">luggage</span>
            <h2 className="font-serif text-[24px] text-on-surface mb-2">No reservations found</h2>
            <p className="font-sans text-base text-on-surface-variant mb-8">
              {activeFilter === 'ALL'
                ? 'Start exploring hotels and make your first booking!'
                : `No ${activeFilter.toLowerCase()} bookings to show.`}
            </p>
            {activeFilter === 'ALL' && (
              <a
                href="/hotels"
                className="inline-block bg-primary-container text-on-primary font-sans text-[12px] font-semibold uppercase tracking-widest px-8 py-3 rounded-full hover:-translate-y-1 hover:shadow-md transition-all duration-300"
              >
                Browse Hotels
              </a>
            )}
          </div>
        )}

        {/* Booking Cards */}
        {!error && filteredBookings.length > 0 && (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden flex flex-col md:flex-row hover:-translate-y-1 transition-transform duration-300"
              >
                {/* Hotel Image — Left 1/3 */}
                <div className="w-full md:w-1/3 h-56 md:h-auto relative flex-shrink-0">
                  {booking.hotel.images?.[0] ? (
                    <img
                      src={booking.hotel.images[0]}
                      alt={booking.hotel.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">hotel</span>
                    </div>
                  )}
                </div>

                {/* Booking Info — Right 2/3 */}
                <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                  <div>
                    {/* Status + Hotel Name */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        {getStatusBadge(booking.status)}
                        <h3 className="font-serif text-[32px] leading-tight text-on-surface mt-2">
                          {booking.hotel.name}
                        </h3>
                        <p className="font-sans text-base text-on-surface-variant mt-1">
                          {booking.room.roomType} · {booking.guests} Guest{booking.guests !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Total</p>
                        <p className="font-serif text-[32px] leading-none text-on-surface">${booking.totalPrice}</p>
                      </div>
                    </div>

                    {/* Dates + Location */}
                    <div className="flex flex-wrap gap-4 text-on-surface-variant font-sans text-sm">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        {dayjs(booking.checkIn).format('MMM D')} – {dayjs(booking.checkOut).format('MMM D, YYYY')}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {booking.hotel.location}
                      </span>
                    </div>

                    {/* Special Requests */}
                    {booking.specialRequests && (
                      <p className="font-sans text-sm text-on-surface-variant mt-3 italic">
                        "{booking.specialRequests}"
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-outline-variant/50">
                    {canCancel(booking) && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelMutation.isPending}
                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-secondary text-secondary rounded-full font-sans text-[12px] font-semibold uppercase tracking-widest hover:bg-secondary hover:text-on-secondary transition-colors duration-300 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        Cancel
                      </button>
                    )}
                    {canReview(booking) && (
                      <button
                        onClick={() => setReviewBooking(booking)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary-fixed-dim text-on-secondary-fixed rounded-full font-sans text-[12px] font-semibold uppercase tracking-widest hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
                      >
                        <span className="material-symbols-outlined text-[16px]">star</span>
                        Write Review
                      </button>
                    )}
                    {booking.review && (
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-container text-secondary rounded-full font-sans text-[12px] font-semibold uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Reviewed ({booking.review.rating}/5)
                      </div>
                    )}
                    <a
                      href={`/hotels/${booking.hotel.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary rounded-full font-sans text-[12px] font-semibold uppercase tracking-widest hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      View Hotel
                    </a>
                  </div>
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
