import { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as yup from 'yup';
import { hotelsAPI, roomsAPI, bookingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

const BookingPage = () => {
  const { hotelId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [specialRequests, setSpecialRequests] = useState('');
  const [validationError, setValidationError] = useState('');

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
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate('/my-bookings');
    },
  });

  const hotel = hotelData?.data.data.hotel;
  const room = roomData?.data.data.room;

  const bookingSchema = yup.object({
    checkIn: yup
      .date()
      .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Check-in cannot be in the past')
      .required(),
    checkOut: yup
      .date()
      .min(yup.ref('checkIn'), 'Check-out must be after check-in')
      .required(),
    guests: yup
      .number()
      .min(1)
      .max(room?.capacity || 99, `Max ${room?.capacity} guests`)
      .required(),
  });

  if (!hotel || !room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  const nights = dayjs(checkOut).diff(dayjs(checkIn), 'day');
  const roomTotal = room.price * nights;
  const taxes = roomTotal * 0.15;
  const total = roomTotal + taxes;

  const handleBooking = async () => {
    try {
      await bookingSchema.validate({ checkIn: new Date(checkIn), checkOut: new Date(checkOut), guests });
    } catch (validationErr) {
      setValidationError(validationErr.message);
      return;
    }
    setValidationError('');
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
    <div className="min-h-screen bg-background pb-24 md:pb-16 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to={`/hotels/${hotelId}?${searchParams.toString()}`}
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-secondary font-sans text-sm transition-colors mb-6 md:mb-8"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          Back to hotel
        </Link>

        {/* Page Title */}
        <h1 className="font-serif text-[28px] md:text-[48px] leading-tight text-on-surface mb-6 md:mb-10">
          Complete your booking
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column — 7/12 */}
          <div className="lg:col-span-7 flex flex-col gap-8">

            {/* Room Summary Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-card-3d overflow-hidden flex flex-col sm:flex-row card-edge">
              <div className="sm:w-2/5 h-48 sm:h-auto relative">
                {room.images?.[0] ? (
                  <img
                    src={room.images[0]}
                    alt={room.roomType}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">bed</span>
                  </div>
                )}
              </div>
              <div className="p-6 sm:w-3/5 flex flex-col justify-between">
                <div>
                  <span className="font-sans text-[12px] font-semibold uppercase tracking-widest text-secondary mb-2 block">
                    {room.roomType}
                  </span>
                  <h2 className="font-serif text-[24px] text-on-surface mb-2 break-words">{hotel.name}</h2>
                  <p className="font-sans text-base text-on-surface-variant flex items-center gap-2 break-words">
                    <span className="material-symbols-outlined text-[18px] shrink-0">location_on</span>
                    {hotel.location}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-on-surface-variant font-sans text-sm mt-4">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    {guests} Guest{guests !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Stay Information Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-card-3d p-8">
              <h3 className="font-serif text-[24px] text-on-surface mb-6 border-b border-outline-variant pb-4">
                Stay Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                    Check-In
                  </label>
                  <p className="font-sans text-body-lg text-on-surface font-semibold">
                    {dayjs(checkIn).format('MMM D, YYYY')}
                  </p>
                  <p className="font-sans text-sm text-outline">After 3:00 PM</p>
                </div>
                <div>
                  <label className="font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                    Check-Out
                  </label>
                  <p className="font-sans text-body-lg text-on-surface font-semibold">
                    {dayjs(checkOut).format('MMM D, YYYY')}
                  </p>
                  <p className="font-sans text-sm text-outline">Before 11:00 AM</p>
                </div>
              </div>
              <div className="bg-surface p-4 rounded-lg flex items-center justify-between">
                <span className="font-sans text-base text-on-surface font-medium">Total Length of Stay:</span>
                <span className="font-sans text-base text-on-surface font-semibold">
                  {nights} Night{nights !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Special Requests */}
            <div className="bg-surface-container-lowest rounded-xl shadow-card-3d p-8">
              <h3 className="font-serif text-[24px] text-on-surface mb-6 border-b border-outline-variant pb-4">
                Special Requests
              </h3>
              <p className="font-sans text-base text-on-surface-variant mb-4">
                Have any special requirements? We'll do our best to accommodate them.
              </p>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="E.g., early check-in, dietary restrictions, room preferences..."
                className="w-full bg-surface border-none rounded-lg p-4 font-sans text-on-surface focus:ring-1 focus:ring-secondary focus:outline-none resize-none h-32"
                rows={4}
              />
            </div>
          </div>

          {/* Right Column — 5/12 */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24 flex flex-col gap-8">

              {/* Guest Details Form */}
              <div className="bg-surface-container-lowest rounded-xl shadow-card-3d p-8">
                <h3 className="font-serif text-[24px] text-on-surface mb-6">Guest Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.firstName || ''}
                        readOnly
                        className="w-full bg-surface border-none rounded-lg p-3 font-sans text-on-surface focus:ring-1 focus:ring-secondary focus:outline-none"
                        placeholder="First Name"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.lastName || ''}
                        readOnly
                        className="w-full bg-surface border-none rounded-lg p-3 font-sans text-on-surface focus:ring-1 focus:ring-secondary focus:outline-none"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      readOnly
                      className="w-full bg-surface border-none rounded-lg p-3 font-sans text-on-surface focus:ring-1 focus:ring-secondary focus:outline-none"
                      placeholder="Email Address"
                    />
                  </div>
                  <div>
                    <label className="font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      defaultValue={user?.phone || ''}
                      readOnly
                      className="w-full bg-surface border-none rounded-lg p-3 font-sans text-on-surface focus:ring-1 focus:ring-secondary focus:outline-none"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
              </div>

              {/* Price Summary Card */}
              <div className="bg-primary-container rounded-xl shadow-card-raised p-8">
                <h3 className="font-serif text-[24px] text-white mb-6">Price Summary</h3>

                <div className="space-y-4 mb-6 border-b border-white/20 pb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-base text-white/80">
                      ${room.price} × {nights} night{nights !== 1 ? 's' : ''}
                    </span>
                    <span className="font-sans font-medium text-white">${roomTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-base text-white/80">Taxes &amp; Fees (15%)</span>
                    <span className="font-sans font-medium text-white">${taxes.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                  <span className="font-serif text-[20px] text-white">Total</span>
                  <span className="font-serif text-[36px] text-secondary-fixed-dim leading-none">
                    ${total.toFixed(2)}
                  </span>
                </div>

                {/* Error Messages */}
                {(createBookingMutation.isError || validationError) && (
                  <div className="mb-4 bg-error-container rounded-lg p-3 flex items-start gap-2">
                    <span className="material-symbols-outlined text-on-error-container text-[18px] flex-shrink-0 mt-0.5">error</span>
                    <p className="font-sans text-sm text-on-error-container">
                      {validationError || createBookingMutation.error?.response?.data?.message || 'Booking failed. Please try again.'}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={createBookingMutation.isPending}
                  className="w-full bg-secondary text-on-secondary font-sans font-semibold py-4 rounded-lg hover:bg-secondary-container hover:text-on-secondary-container transition-colors duration-300 ease-out mb-4 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-on-secondary"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Booking</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>

                <p className="font-sans text-[12px] text-center text-white/70">
                  You won't be charged yet. Payment processed at the hotel.
                </p>

                {/* Trust Badges */}
                <div className="flex justify-center gap-6 mt-4 text-white/60">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-widest">Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-widest">Verified Property</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 px-4 py-3 md:hidden flex items-center justify-between shadow-lg shadow-black/5">
        <div>
          <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-on-surface-variant">Total</p>
          <p className="font-serif text-2xl font-bold text-on-surface">${total.toFixed(2)}</p>
        </div>
        <button
          onClick={handleBooking}
          disabled={createBookingMutation.isPending}
          className="bg-secondary text-on-secondary font-sans text-[11px] font-semibold uppercase tracking-widest px-6 py-3 rounded-full hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2"
        >
          {createBookingMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-on-secondary"></div>
              Processing
            </>
          ) : (
            <>
              Confirm Booking
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BookingPage;
