import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { hotelsAPI } from '../../services/api';
import { MapPin, Star, Users, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
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
    queryKey: ['hotels', { location: filters.location, page }],
    queryFn: () => hotelsAPI.getAll({ location: filters.location, page, limit: 9 }),
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="inline h-4 w-4 mr-1" /> Location
              </label>
              <input
                type="text"
                placeholder="Search by city, hotel name..."
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
              <input
                type="date"
                value={filters.checkIn}
                min={dayjs().format('YYYY-MM-DD')}
                onChange={(e) => setFilters({ ...filters, checkIn: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
              <input
                type="date"
                value={filters.checkOut}
                min={dayjs(filters.checkIn).add(1, 'day').format('YYYY-MM-DD')}
                onChange={(e) => setFilters({ ...filters, checkOut: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
              <select
                value={filters.guests}
                onChange={(e) => setFilters({ ...filters, guests: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>{num} Guests</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Search className="h-5 w-5" />
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {filters.location ? `Hotels in "${filters.location}"` : 'All Hotels'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${pagination?.total || 0} hotels found`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load hotels. Please try again.</p>
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500 text-lg">No hotels found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <Link
                  key={hotel.id}
                  to={`/hotels/${hotel.id}?${searchParams.toString()}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-gray-200 relative">
                    {hotel.images && hotel.images[0] ? (
                      <img
                        src={hotel.images[0]}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <MapPin className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{hotel.avgRating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{hotel.name}</h3>
                    <p className="text-gray-500 text-sm flex items-center mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {hotel.location}
                    </p>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{hotel.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{hotel._count?.reviews || 0} reviews</span>
                      </div>
                      <div className="text-right">
                        {hotel.rooms && hotel.rooms[0] && (
                          <p className="text-lg font-bold text-primary-600">
                            ${hotel.rooms[0].price}
                            <span className="text-sm font-normal text-gray-500">/night</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-4 py-2 rounded-lg ${
                      page === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="h-5 w-5" />
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
