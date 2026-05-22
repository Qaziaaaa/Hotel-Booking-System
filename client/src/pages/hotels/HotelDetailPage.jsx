import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { hotelsAPI, roomsAPI, reviewsAPI } from '../../services/api';
import dayjs from 'dayjs';

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
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-on-surface mb-2">Hotel not found</h2>
          <Link to="/hotels" className="text-secondary hover:underline font-sans">
            Back to hotels
          </Link>
        </div>
      </div>
    );
  }

  const nights = dayjs(checkOut).diff(dayjs(checkIn), 'day');

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          to={`/hotels?${searchParams.toString()}`}
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-secondary font-sans text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          Back to search
        </Link>
      </div>

      {/* Image Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[500px]">
          {/* Hero Image — 60% */}
          <div className="w-full md:w-[60%] rounded-xl overflow-hidden h-[300px] md:h-full relative group">
            <img
              src={hotel.images?.[selectedImage] || '/placeholder-hotel.jpg'}
              alt={hotel.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          {/* 2x2 Thumbnail Grid — 40%, hidden on mobile */}
          <div className="hidden md:grid w-full md:w-[40%] grid-cols-2 grid-rows-2 gap-4 h-full">
            {[0, 1, 2, 3].map((idx) => {
              const img = hotel.images?.[idx];
              const isLast = idx === 3;
              return (
                <button
                  key={idx}
                  onClick={() => img && setSelectedImage(idx)}
                  className="rounded-xl overflow-hidden relative group focus:outline-none"
                >
                  {img ? (
                    <img
                      src={img}
                      alt={`${hotel.name} ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container-high" />
                  )}
                  {isLast && hotel.images?.length > 4 && (
                    <div className="absolute inset-0 bg-primary-container/30 flex items-center justify-center">
                      <span className="bg-surface-container-lowest text-on-surface font-sans text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">grid_view</span>
                        View all photos
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column — 8 cols */}
          <div className="lg:col-span-8 flex flex-col gap-12">

            {/* Hotel Header */}
            <section className="flex flex-col gap-4 border-b border-outline-variant pb-8">
              <h1 className="font-serif text-[28px] md:text-[48px] leading-tight text-primary-container tracking-tight break-words">
                {hotel.name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-on-surface-variant font-sans text-base">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-bold text-on-surface">{hotel.avgRating?.toFixed(1) || '0.0'}</span>
                  <span>({hotel.reviews?.length || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                  <span className="break-words">{hotel.address || hotel.location}</span>
                </div>
              </div>
              {hotel.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {hotel.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="bg-surface-variant text-on-surface-variant font-sans text-[12px] font-semibold uppercase tracking-widest px-4 py-2 rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* About Section */}
            <section className="flex flex-col gap-6">
              <h2 className="font-serif text-[32px] text-primary-container">About this property</h2>
              <p className="font-sans text-body-lg text-on-surface-variant leading-relaxed break-words">
                {hotel.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2 bg-surface-container-low rounded-xl p-6">
                <div>
                  <p className="font-sans text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Check-in</p>
                  <p className="font-sans text-body-lg text-on-surface font-medium">3:00 PM</p>
                </div>
                <div>
                  <p className="font-sans text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Check-out</p>
                  <p className="font-sans text-body-lg text-on-surface font-medium">11:00 AM</p>
                </div>
                <div>
                  <p className="font-sans text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Policies</p>
                  <p className="font-sans text-base text-on-surface">No smoking. No pets.</p>
                </div>
                <div>
                  <p className="font-sans text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Languages</p>
                  <p className="font-sans text-base text-on-surface">English, French</p>
                </div>
              </div>
            </section>

            {/* Available Rooms Section */}
            <section className="flex flex-col gap-6 pt-8 border-t border-outline-variant">
              <h2 className="font-serif text-[32px] text-primary-container">Available Suites</h2>
              {roomsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
                </div>
              ) : rooms.length === 0 ? (
                <p className="text-on-surface-variant font-sans text-center py-6">
                  No rooms available for the selected dates.
                </p>
              ) : (
                <div className="flex flex-col gap-6">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`flex flex-col md:flex-row bg-surface-container-lowest rounded-xl overflow-hidden shadow-card-3d border border-outline-variant/30 card-edge hover:shadow-card-raised transition-all duration-300 ${!room.isAvailable ? 'opacity-60' : ''}`}
                    >
                      {/* Room Image */}
                      <div className="w-full md:w-1/3 h-48 md:h-auto">
                        {room.images?.[0] ? (
                          <img
                            src={room.images[0]}
                            alt={room.roomType}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">bed</span>
                          </div>
                        )}
                      </div>
                      {/* Room Info */}
                      <div className="w-full md:w-2/3 p-6 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-serif text-[24px] font-semibold text-primary-container">
                              {room.roomType}
                            </h3>
                            {!room.isAvailable && (
                              <span className="font-sans text-[11px] font-semibold uppercase tracking-widest bg-error-container text-on-error-container px-3 py-1 rounded-full">
                                Unavailable
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-base text-on-surface-variant">
                            Up to {room.capacity} guests
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface-variant font-sans text-sm">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            Up to {room.capacity} guests
                          </span>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <div>
                            <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Per Night</p>
                            <p className="font-serif text-[28px] font-bold text-on-surface break-words">${room.price}</p>
                            <p className="font-sans text-sm text-on-surface-variant">
                              Total: <span className="font-semibold">${room.price * nights}</span> for {nights} night{nights !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {room.isAvailable ? (
                            <Link
                              to={`/book/${hotel.id}/${room.id}?${searchParams.toString()}`}
                              className="bg-primary-container text-on-primary font-sans text-[12px] font-semibold uppercase tracking-widest px-8 py-3 rounded-full hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                            >
                              Book Now
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="bg-outline-variant text-on-surface-variant font-sans text-[12px] font-semibold uppercase tracking-widest px-8 py-3 rounded-full cursor-not-allowed opacity-60"
                            >
                              Unavailable
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <section className="flex flex-col gap-6 pt-8 border-t border-outline-variant">
                <div className="flex items-center gap-4 mb-2">
                  <span className="material-symbols-outlined text-secondary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <div>
                    <h2 className="font-serif text-[32px] text-primary-container leading-none">
                      {hotel.avgRating?.toFixed(1) || '0.0'}
                    </h2>
                    <p className="font-sans text-base text-on-surface-variant">
                      Exceptional · {hotel.reviews?.length || 0} verified reviews
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface-dim rounded-full flex items-center justify-center font-serif text-[18px] text-on-surface flex-shrink-0">
                          {getInitials(`${review.user?.firstName} ${review.user?.lastName}`)}
                        </div>
                        <div>
                          <p className="font-sans font-semibold text-on-surface leading-none">
                            {review.user?.firstName} {review.user?.lastName}
                          </p>
                          <p className="font-sans text-sm text-on-surface-variant mt-1">
                            {dayjs(review.createdAt).format('MMMM YYYY')}
                          </p>
                        </div>
                      </div>
                      <p className="font-sans text-base text-on-surface-variant line-clamp-4">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
                {reviewPagination && reviewPagination.pages > 1 && (
                  <div className="flex justify-center mt-4 items-center gap-3 mb-20 md:mb-0">
                    <button
                      onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                      disabled={reviewPage === 1}
                      className="inline-flex items-center gap-1 px-4 py-2 border border-outline-variant rounded-full font-sans text-sm text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                      Prev
                    </button>
                    <span className="font-sans text-sm text-on-surface-variant">
                      {reviewPage} / {reviewPagination.pages}
                    </span>
                    <button
                      onClick={() => setReviewPage((p) => Math.min(reviewPagination.pages, p + 1))}
                      disabled={reviewPage === reviewPagination.pages}
                      className="inline-flex items-center gap-1 px-4 py-2 border border-outline-variant rounded-full font-sans text-sm text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Sticky Column — Booking Summary */}
          <div className="hidden lg:block lg:col-span-4 relative">
            <div className="sticky top-[100px] bg-surface-container-lowest rounded-xl p-6 shadow-card-raised border border-outline-variant/20 flex flex-col gap-6">
              <div>
                <p className="font-serif text-[28px] font-bold text-on-surface">
                  {rooms.length > 0 ? `$${rooms[0]?.price}` : 'From $—'}
                  <span className="font-sans text-base font-normal text-on-surface-variant"> / night</span>
                </p>
                <p className="font-sans text-sm text-on-surface-variant mt-1">Prices subject to availability</p>
              </div>

              {/* Date Selector Boxes */}
              <div className="flex flex-col border border-outline-variant rounded-lg overflow-hidden">
                <div className="flex border-b border-outline-variant">
                  <div className="flex-1 p-3 border-r border-outline-variant">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Check-in</p>
                    <p className="font-sans text-base text-on-surface mt-1">
                      {checkIn ? dayjs(checkIn).format('MMM D, YYYY') : 'Select date'}
                    </p>
                  </div>
                  <div className="flex-1 p-3">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Check-out</p>
                    <p className="font-sans text-base text-on-surface mt-1">
                      {checkOut ? dayjs(checkOut).format('MMM D, YYYY') : 'Select date'}
                    </p>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Guests</p>
                  <p className="font-sans text-base text-on-surface mt-1">{guests} Guest{guests !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <button className="w-full bg-primary-container text-on-primary font-sans text-[12px] font-semibold uppercase tracking-widest py-4 rounded-full hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                Check Availability
              </button>

              <div className="text-center">
                <p className="font-sans text-sm text-on-surface-variant">You won't be charged yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 px-4 py-3 md:hidden flex items-center justify-between shadow-lg shadow-black/5">
        <div>
          <p className="font-serif text-xl font-bold text-on-surface">
            {rooms.length > 0 ? `$${rooms[0]?.price}` : 'From $—'}
            <span className="font-sans text-sm font-normal text-on-surface-variant"> / night</span>
          </p>
        </div>
        <button className="bg-primary-container text-on-primary font-sans text-[11px] font-semibold uppercase tracking-widest px-6 py-3 rounded-full hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 active:scale-95">
          Check Availability
        </button>
      </div>
    </div>
  );
};

export default HotelDetailPage;
