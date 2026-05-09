import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { hotelsAPI } from '../../services/api';
import dayjs from 'dayjs';

const HotelListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    checkIn: searchParams.get('checkIn') || dayjs().format('YYYY-MM-DD'),
    checkOut: searchParams.get('checkOut') || dayjs().add(1, 'day').format('YYYY-MM-DD'),
    guests: parseInt(searchParams.get('guests')) || 2,
  });

  const page = parseInt(searchParams.get('page')) || 1;

  const { data, isLoading, error } = useQuery({
    queryKey: ['hotels', { location: filters.location, page, checkIn: filters.checkIn, checkOut: filters.checkOut, guests: filters.guests }],
    queryFn: () => hotelsAPI.getAll({ location: filters.location, page, limit: 9, checkIn: filters.checkIn, checkOut: filters.checkOut, guests: filters.guests }),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    params.set('checkIn', filters.checkIn);
    params.set('checkOut', filters.checkOut);
    params.set('guests', filters.guests);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hotels = data?.data.data.hotels || [];
  const pagination = data?.data.pagination;

  const amenityIcons = [
    { icon: 'wifi', label: 'WiFi' },
    { icon: 'pool', label: 'Pool' },
    { icon: 'fitness_center', label: 'Gym' },
    { icon: 'spa', label: 'Spa' },
    { icon: 'restaurant', label: 'Restaurant' },
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Sticky Search Bar */}
      <div className="sticky top-16 z-30 bg-surface-container-lowest border-b border-outline-variant/20 shadow-ambient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <form onSubmit={handleSearch}>
            <div className="flex items-center gap-2 bg-background border border-outline-variant/40 rounded-full px-4 py-2 shadow-sm">
              {/* Location */}
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">location_on</span>
              <input
                type="text"
                placeholder="Where are you going?"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="flex-1 min-w-[120px] bg-transparent text-on-surface placeholder-on-surface-variant font-sans text-sm focus:outline-none"
              />
              <div className="w-px h-5 bg-outline-variant/60" />
              {/* Check-in */}
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">calendar_today</span>
              <input
                type="date"
                value={filters.checkIn}
                min={dayjs().format('YYYY-MM-DD')}
                onChange={(e) => setFilters({ ...filters, checkIn: e.target.value })}
                className="bg-transparent text-on-surface font-sans text-sm focus:outline-none cursor-pointer"
              />
              <div className="w-px h-5 bg-outline-variant/60" />
              {/* Check-out */}
              <input
                type="date"
                value={filters.checkOut}
                min={dayjs(filters.checkIn).add(1, 'day').format('YYYY-MM-DD')}
                onChange={(e) => setFilters({ ...filters, checkOut: e.target.value })}
                className="bg-transparent text-on-surface font-sans text-sm focus:outline-none cursor-pointer"
              />
              <div className="w-px h-5 bg-outline-variant/60" />
              {/* Guests */}
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
              <select
                value={filters.guests}
                onChange={(e) => setFilters({ ...filters, guests: parseInt(e.target.value) })}
                className="bg-transparent text-on-surface font-sans text-sm focus:outline-none cursor-pointer pr-1"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                ))}
              </select>
              {/* Search button */}
              <button
                type="submit"
                className="ml-1 bg-primary-container text-secondary-fixed-dim w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-tint transition-colors flex-shrink-0"
                aria-label="Search"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Results Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-serif text-[48px] leading-tight text-on-surface">
              {isLoading
                ? 'Searching...'
                : `${pagination?.total || 0} hotel${(pagination?.total || 0) !== 1 ? 's' : ''} found${filters.location ? ` in ${filters.location}` : ''}`}
            </h1>
            <p className="font-sans text-on-surface-variant mt-1">
              {filters.checkIn && filters.checkOut
                ? `${dayjs(filters.checkIn).format('MMM D')} – ${dayjs(filters.checkOut).format('MMM D, YYYY')} · ${filters.guests} guest${filters.guests !== 1 ? 's' : ''}`
                : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm text-on-surface-variant">Sort by:</span>
            <select className="font-sans text-sm text-on-surface bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2 focus:outline-none focus:border-secondary">
              <option>Recommended</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Top Rated</option>
            </select>
          </div>
        </div>

        {/* States */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-surface-container-lowest shadow-ambient border border-outline-variant/20 animate-pulse">
                <div className="aspect-video bg-outline-variant/20" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-outline-variant/20 rounded w-3/4" />
                  <div className="h-4 bg-outline-variant/20 rounded w-1/2" />
                  <div className="h-4 bg-outline-variant/20 rounded w-full" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 bg-outline-variant/20 rounded w-1/3" />
                    <div className="h-9 bg-outline-variant/20 rounded-lg w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-[48px] text-error mb-4 block">error_outline</span>
            <p className="font-sans text-on-surface-variant">Failed to load hotels. Please try again.</p>
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/40 block mb-4">search_off</span>
            <h3 className="font-serif text-2xl text-on-surface mb-2">No hotels found</h3>
            <p className="font-sans text-on-surface-variant">Try adjusting your search criteria or explore a different destination.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <article
                  key={hotel.id}
                  className="rounded-xl overflow-hidden bg-surface-container-lowest shadow-ambient border border-outline-variant/20 hover:shadow-ambient-hover hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Image */}
                  <div className="aspect-video bg-outline-variant/10 relative overflow-hidden">
                    {hotel.images && hotel.images[0] ? (
                      <img
                        src={hotel.images[0]}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-container">
                        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">hotel</span>
                      </div>
                    )}
                    {/* Available badge */}
                    <div className="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface px-3 py-1 rounded-full label-caps uppercase text-xs">
                      Available
                    </div>
                    {/* Rating badge */}
                    {hotel.avgRating > 0 && (
                      <div className="absolute top-4 right-4 bg-primary-container/90 backdrop-blur-sm text-secondary-fixed-dim px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined fill text-[14px]">star</span>
                        <span className="font-sans text-xs font-semibold">{hotel.avgRating?.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-serif text-[24px] font-semibold text-on-surface leading-tight mb-1">
                      {hotel.name}
                    </h3>
                    <p className="flex items-center text-on-surface-variant font-sans text-sm mb-3">
                      <span className="material-symbols-outlined text-[16px] mr-1">location_on</span>
                      {hotel.location}
                    </p>

                    {/* Amenity icons */}
                    <div className="flex items-center gap-3 mb-4">
                      {amenityIcons.map(({ icon, label }) => (
                        <span
                          key={icon}
                          className="material-symbols-outlined text-[18px] text-on-surface-variant/60"
                          title={label}
                        >
                          {icon}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        {hotel.rooms && hotel.rooms[0] ? (
                          <>
                            <span className="font-serif text-[28px] font-semibold text-on-surface leading-none">
                              ${hotel.rooms[0].price}
                            </span>
                            <span className="font-sans text-sm text-on-surface-variant ml-1">/night</span>
                          </>
                        ) : (
                          <span className="font-sans text-sm text-on-surface-variant">Contact for pricing</span>
                        )}
                        <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                          {hotel._count?.reviews || 0} review{(hotel._count?.reviews || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Link
                        to={`/hotels/${hotel.id}?${searchParams.toString()}`}
                        className="bg-primary-container text-secondary-fixed-dim px-6 py-2.5 rounded-lg font-sans font-medium text-sm hover:bg-surface-tint hover:text-on-primary transition-colors"
                      >
                        View Hotel
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center mt-12 gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-colors"
                  aria-label="Previous page"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-10 h-10 rounded-full font-sans text-sm font-medium transition-colors ${
                      page === i + 1
                        ? 'bg-primary-container text-secondary-fixed-dim'
                        : 'border border-outline-variant hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.pages}
                  className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-colors"
                  aria-label="Next page"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HotelListPage;
