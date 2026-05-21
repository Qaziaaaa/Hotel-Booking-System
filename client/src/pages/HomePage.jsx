import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import dayjs from 'dayjs';
import { hotelsAPI } from '../services/api';
import AIRecommendations from '../components/AIRecommendations';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: dayjs().format('YYYY-MM-DD'),
    checkOut: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    guests: 2,
  });
  const [searchErrors, setSearchErrors] = useState({});

  const searchSchema = yup.object({
    checkIn: yup
      .date()
      .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Check-in cannot be in the past')
      .required(),
    checkOut: yup
      .date()
      .min(yup.ref('checkIn'), 'Check-out must be after check-in')
      .required(),
    guests: yup.number().min(1, 'At least 1 guest required').required(),
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      await searchSchema.validate(
        {
          checkIn: new Date(searchParams.checkIn),
          checkOut: new Date(searchParams.checkOut),
          guests: searchParams.guests,
        },
        { abortEarly: false }
      );
      setSearchErrors({});
    } catch (err) {
      const errors = {};
      err.inner?.forEach((e) => {
        errors[e.path] = e.message;
      });
      setSearchErrors(errors);
      return;
    }
    const params = new URLSearchParams();
    if (searchParams.location) params.append('location', searchParams.location);
    params.append('checkIn', searchParams.checkIn);
    params.append('checkOut', searchParams.checkOut);
    params.append('guests', searchParams.guests);
    navigate(`/hotels?${params.toString()}`);
  };

  const { data: hotelsData, isLoading: hotelsLoading } = useQuery({
    queryKey: ['hotels', {}],
    queryFn: () => hotelsAPI.getAll({ limit: 3 }),
  });

  const featuredHotels = hotelsData?.data?.data?.hotels || [];

  return (
    <div className="bg-background text-on-surface font-sans antialiased">

      {/* ── Hero Section ── */}
      <section
        className="relative w-full min-h-[85dvh] md:min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC23Q1cUZAlp6GzPejf0L358AZ96k-gdq3Y7P620bzxC_xJMoWZcX4qyQnIFK5p_jtaihMAy35xQFcN4byAbMA9ItLCG3Nu2yeXVBNJP7RZvl3c0IN8Hb-eavExl3Wl3zQW2m93gIrf6MtGAu2a0vZDsNBda-MuITLYFocO7ghsYnSHJ7AGLfl9PZfilhFqYFo_CIZ4B7Xd0FcK6Ra_IduvLx7Vg_5KwkavO1yQ-9z2c0Cn5BF2qkRcDQWsIVBNBbg5DlwCh2ckoFQ')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-primary bg-opacity-30" />

        <div className="relative z-10 text-center px-4 md:px-16 max-w-[1440px] mx-auto w-full mt-16 md:mt-0">
          <h1 className="font-serif text-[32px] md:text-[64px] leading-tight font-bold text-on-primary mb-6 md:mb-8 drop-shadow-lg px-2">
            Find Your Perfect Stay
          </h1>

          <form
            onSubmit={handleSearch}
            className="bg-surface-container-lowest rounded-xl shadow-2xl p-4 md:p-8 max-w-5xl mx-auto w-full mx-2 md:mx-auto"
          >
            <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-6">

              <div className="flex-1 border-b md:border-b-0 md:border-r border-outline-variant pb-3 md:pb-0 md:pr-6 flex items-start gap-2">
                <span className="material-symbols-outlined text-on-surface-variant mt-1 text-[20px]">location_on</span>
                <div className="flex flex-col w-full">
                  <label className="label-caps text-on-surface-variant mb-0.5 text-[10px]">Location</label>
                  <input
                    type="text"
                    placeholder="Where are you going?"
                    value={searchParams.location}
                    onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-base md:text-body-lg text-on-surface placeholder-on-surface-variant"
                  />
                </div>
              </div>

              <div className="flex-1 border-b md:border-b-0 md:border-r border-outline-variant pb-3 md:pb-0 md:px-6 flex items-start gap-2">
                <span className="material-symbols-outlined text-on-surface-variant mt-1 text-[20px]">calendar_today</span>
                <div className="flex flex-col w-full">
                  <label className="label-caps text-on-surface-variant mb-0.5 text-[10px]">Check-in</label>
                  <input
                    type="date"
                    value={searchParams.checkIn}
                    min={dayjs().format('YYYY-MM-DD')}
                    onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-base md:text-body-lg text-on-surface"
                  />
                  {searchErrors.checkIn && (
                    <p className="text-error text-xs mt-1">{searchErrors.checkIn}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 border-b md:border-b-0 md:border-r border-outline-variant pb-3 md:pb-0 md:px-6 flex items-start gap-2">
                <span className="material-symbols-outlined text-on-surface-variant mt-1 text-[20px]">calendar_today</span>
                <div className="flex flex-col w-full">
                  <label className="label-caps text-on-surface-variant mb-0.5 text-[10px]">Check-out</label>
                  <input
                    type="date"
                    value={searchParams.checkOut}
                    min={dayjs(searchParams.checkIn).add(1, 'day').format('YYYY-MM-DD')}
                    onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-base md:text-body-lg text-on-surface"
                  />
                  {searchErrors.checkOut && (
                    <p className="text-error text-xs mt-1">{searchErrors.checkOut}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 pb-3 md:pb-0 md:px-6 flex items-start gap-2">
                <span className="material-symbols-outlined text-on-surface-variant mt-1 text-[20px]">group</span>
                <div className="flex flex-col w-full">
                  <label className="label-caps text-on-surface-variant mb-0.5 text-[10px]">Guests</label>
                  <select
                    value={searchParams.guests}
                    onChange={(e) =>
                      setSearchParams({ ...searchParams, guests: parseInt(e.target.value) })
                    }
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-base md:text-body-lg text-on-surface"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                  {searchErrors.guests && (
                    <p className="text-error text-xs mt-1">{searchErrors.guests}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <button
                  type="submit"
                  className="btn-gold w-full md:w-auto whitespace-nowrap text-sm md:text-base px-6 md:px-8 py-3 md:py-4"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-16 md:py-24 px-4 md:px-16 bg-surface">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            {[
              { value: '500+', label: 'Hotels' },
              { value: '50k+', label: 'Happy Guests' },
              { value: '120+', label: 'Cities' },
              { value: '4.9', label: 'Rating', icon: true },
            ].map((stat, i) => (
              <div key={i} className="p-4 md:p-6">
                <div className="font-serif text-3xl md:text-5xl font-semibold text-on-surface mb-1 md:mb-2 flex items-center justify-center gap-1">
                  {stat.value}
                  {stat.icon && (
                    <span className="material-symbols-outlined fill text-secondary align-middle text-xl md:text-3xl">star</span>
                  )}
                </div>
                <div className="font-sans text-sm md:text-body-md text-on-surface-variant">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Hotels Section ── */}
      <section className="py-16 md:py-24 px-4 md:px-16 bg-background">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex justify-between items-end mb-8 md:mb-12">
            <div>
              <h2 className="font-serif text-[28px] md:text-[48px] leading-tight font-semibold text-on-surface mb-2 md:mb-4">
                Top Destinations
              </h2>
              <p className="font-sans text-sm md:text-body-lg text-on-surface-variant max-w-2xl">
                Discover our handpicked selection of the world's most exquisite properties, curated for the discerning traveler.
              </p>
            </div>
            <Link
              to="/hotels"
              className="hidden md:flex items-center gap-2 text-secondary font-sans text-body-md font-semibold hover:text-on-secondary-container transition-colors"
            >
              View All <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {hotelsLoading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-ambient animate-pulse">
                    <div className="h-48 md:h-64 bg-surface-container-high" />
                    <div className="p-4 md:p-6 space-y-3">
                      <div className="h-5 bg-surface-container-high rounded w-3/4" />
                      <div className="h-4 bg-surface-container-high rounded w-1/2" />
                      <div className="h-4 bg-surface-container-high rounded w-1/3 mt-4" />
                    </div>
                  </div>
                ))
              : featuredHotels.length > 0
              ? featuredHotels.map((hotel) => (
                  <Link
                    key={hotel.id}
                    to={`/hotels/${hotel.id}`}
                    className="group luxury-card overflow-hidden block"
                  >
                    <div className="relative h-48 md:h-64 overflow-hidden">
                      {hotel.images?.[0] ? (
                        <img
                          src={hotel.images[0]}
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                          <span className="material-symbols-outlined text-5xl md:text-6xl text-on-surface-variant">hotel</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined fill text-secondary text-sm">star</span>
                        <span className="label-caps text-on-surface text-[10px]">
                          {hotel.rating ? hotel.rating.toFixed(1) : 'New'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 md:p-6">
                      <h3 className="font-serif text-xl md:text-2xl font-semibold text-on-surface mb-1 md:mb-2">
                        {hotel.name}
                      </h3>
                      <p className="font-sans text-sm md:text-body-md text-on-surface-variant mb-3 md:mb-4 flex items-center gap-1 md:gap-2">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {hotel.location}
                      </p>
                      <div className="flex justify-between items-center mt-4 md:mt-6 pt-3 md:pt-4 border-t border-outline-variant/30">
                        <div className="font-sans text-sm md:text-body-md text-on-surface-variant">
                          From{' '}
                          <span className="font-semibold text-on-surface text-lg md:text-xl">
                            ${hotel.cheapestRoom?.price ?? hotel.pricePerNight ?? '—'}
                          </span>{' '}
                          /night
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              : [
                  { name: 'The Azure Atoll', location: 'Maldives', rating: 4.9, price: 1200 },
                  { name: 'The Metropolitan', location: 'New York', rating: 4.8, price: 850 },
                  { name: 'Oasis Retreat', location: 'Bali', rating: 5.0, price: 950 },
                ].map((hotel, i) => (
                  <Link key={i} to="/hotels" className="group luxury-card overflow-hidden block">
                    <div className="relative h-48 md:h-64 overflow-hidden bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl md:text-6xl text-on-surface-variant">hotel</span>
                      <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined fill text-secondary text-sm">star</span>
                        <span className="label-caps text-on-surface text-[10px]">{hotel.rating}</span>
                      </div>
                    </div>
                    <div className="p-4 md:p-6">
                      <h3 className="font-serif text-xl md:text-2xl font-semibold text-on-surface mb-1 md:mb-2">{hotel.name}</h3>
                      <p className="font-sans text-sm md:text-body-md text-on-surface-variant mb-3 md:mb-4 flex items-center gap-1 md:gap-2">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {hotel.location}
                      </p>
                      <div className="flex justify-between items-center mt-4 md:mt-6 pt-3 md:pt-4 border-t border-outline-variant/30">
                        <div className="font-sans text-sm md:text-body-md text-on-surface-variant">
                          From <span className="font-semibold text-on-surface text-lg md:text-xl">${hotel.price}</span> /night
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>

          <Link
            to="/hotels"
            className="md:hidden mt-6 w-full flex items-center justify-center gap-2 text-secondary font-sans text-sm font-semibold border border-secondary rounded-lg py-3 hover:bg-secondary hover:text-on-secondary transition-colors"
          >
            View All <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section className="py-16 md:py-24 px-4 md:px-16 bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto text-center">
          <h2 className="font-serif text-[28px] md:text-[48px] leading-tight font-semibold text-on-surface mb-10 md:mb-16">
            Effortless Elegance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-outline-variant/50 z-0" />

            {[
              { icon: 'search', title: 'Search', desc: 'Explore our curated collection of exclusive properties worldwide.' },
              { icon: 'book_online', title: 'Book', desc: 'Secure your reservation instantly with our seamless booking experience.' },
              { icon: 'wine_bar', title: 'Enjoy', desc: 'Immerse yourself in unparalleled luxury and personalized service.' },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-surface-container-lowest shadow-card flex items-center justify-center mb-4 md:mb-6 text-secondary">
                  <span className="material-symbols-outlined text-3xl md:text-4xl">{step.icon}</span>
                </div>
                <h3 className="font-serif text-xl md:text-2xl font-semibold text-on-surface mb-2 md:mb-3">{step.title}</h3>
                <p className="font-sans text-sm md:text-body-md text-on-surface-variant max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Banner Section ── */}
      <section className="py-16 md:py-24 px-4 md:px-16 bg-background">
        <div className="max-w-[1440px] mx-auto">
          <div className="bg-primary-container rounded-xl overflow-hidden relative shadow-2xl flex flex-col md:flex-row items-center">
            <div className="p-8 md:p-16 md:w-1/2 z-10">
              <h2 className="font-serif text-[24px] md:text-[48px] leading-tight font-semibold text-on-primary mb-4 md:mb-6">
                Let AI Plan Your Perfect Escape
              </h2>
              <p className="font-sans text-sm md:text-body-lg text-white/80 mb-6 md:mb-8">
                Our intelligent concierge analyzes your preferences to suggest tailored itineraries and properties that match your unique taste.
              </p>
              <AIRecommendations />
            </div>
            <div className="w-full h-48 md:h-auto md:w-1/2 md:absolute md:right-0 md:top-0 md:bottom-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3cnHS7I7o6T1Z1JEHTK-35Jam_wJER0oG1U_e3RNdPmnyOiwbmvzYjIXS-UVZSNhvc2JcQFrO0oFjbTgHrEcPEXB-iMaIHAMHgNFJBuUmjmLru-apT3hkLaAtoFAUPj5KHKodV-o7BSvyeeeXaGTij2AefLeoGv0wKMS-KXETEhqbSfTtVrSyT93cl2p_FUWNM5EV6EUULzQ6i3c4qRCQE2dYhmLKDzqHH7ZN0mDSkq8x2b9LAe4nl9ap4XTDZx6dxeTc_lIu-yg"
                alt="AI Concierge"
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
