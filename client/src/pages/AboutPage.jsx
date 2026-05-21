import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="bg-background text-on-surface font-sans antialiased">

      {/* ── Hero Section ── */}
      <section
        className="relative w-full min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-primary-container/70" />
        <div className="relative z-10 text-center px-5 md:px-16 max-w-[1440px] mx-auto">
          <span className="label-caps text-secondary-fixed-dim tracking-[0.2em] mb-4 block">
            Welcome to
          </span>
          <h1 className="font-serif text-[48px] md:text-[72px] leading-tight font-bold text-on-primary mb-6 drop-shadow-lg">
            Ascendant Luxury
          </h1>
          <p className="font-sans text-body-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Elevating the art of travel through exclusive access, handpicked properties, and uncompromising service tailored to the discerning explorer.
          </p>
        </div>
      </section>

      {/* ── Our Story Section ── */}
      <section className="py-16 md:py-24 px-5 md:px-16 bg-background">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <span className="label-caps text-secondary mb-3 block">Our Story</span>
              <h2 className="font-serif text-[28px] md:text-[40px] leading-tight font-semibold text-on-surface mb-4 md:mb-6">
                Redefining the Art of Travel
              </h2>
              <div className="w-16 h-[2px] bg-secondary mb-6" />
              <p className="font-sans text-body-lg text-on-surface-variant leading-relaxed mb-4">
                Ascendant Luxury is a premium hotel booking platform designed for travelers who seek more than just accommodation. We curate exceptional properties across the globe, from private island resorts to urban sanctuaries, ensuring every stay is an experience unto itself.
              </p>
              <p className="font-sans text-body-lg text-on-surface-variant leading-relaxed">
                Our platform combines intelligent technology with a human touch, offering personalized recommendations, seamless booking, and dedicated support at every step of your journey.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2025&auto=format&fit=crop"
                alt="Luxury hotel lobby"
                className="rounded-xl shadow-ambient-hover w-full h-[400px] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-secondary text-on-secondary rounded-xl p-6 shadow-ambient-hover hidden md:block">
                <div className="font-serif text-4xl font-bold">50k+</div>
                <div className="font-sans text-sm mt-1">Happy Guests</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section className="py-16 md:py-24 px-5 md:px-16 bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto text-center">
          <span className="label-caps text-secondary mb-3 block">Simple & Seamless</span>
          <h2 className="font-serif text-[28px] md:text-[40px] leading-tight font-semibold text-on-surface mb-3 md:mb-4">
            How It Works
          </h2>
          <p className="font-sans text-sm md:text-body-lg text-on-surface-variant max-w-xl mx-auto mb-10 md:mb-16">
            Finding and booking your perfect luxury stay is effortless. Follow these simple steps to begin your journey.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-[2px] bg-outline-variant/50 z-0" />

            {[
              {
                icon: 'search',
                title: 'Browse Hotels',
                description: 'Explore our curated collection of luxury properties worldwide. Filter by location, amenities, and price to find your perfect match.',
              },
              {
                icon: 'calendar_month',
                title: 'Choose Dates',
                description: 'Select your check-in and check-out dates, specify the number of guests, and check real-time availability for your stay.',
              },
              {
                icon: 'book_online',
                title: 'Book Instantly',
                description: 'Secure your reservation with a seamless checkout process. Receive immediate confirmation and detailed itinerary via email.',
              },
              {
                icon: 'wine_bar',
                title: 'Enjoy Your Stay',
                description: 'Arrive at your handpicked property and immerse yourself in unparalleled comfort, service, and sophistication.',
              },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-surface-container-lowest shadow-card flex items-center justify-center mb-6 text-secondary">
                  <span className="material-symbols-outlined text-4xl">{step.icon}</span>
                </div>
                <h3 className="font-serif text-2xl font-semibold text-on-surface mb-3">{step.title}</h3>
                <p className="font-sans text-body-md text-on-surface-variant max-w-xs leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-16 md:py-24 px-5 md:px-16 bg-background">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <span className="label-caps text-secondary mb-3 block">Why Choose Us</span>
            <h2 className="font-serif text-[28px] md:text-[40px] leading-tight font-semibold text-on-surface mb-3 md:mb-4">
              The Ascendant Difference
            </h2>
            <p className="font-sans text-sm md:text-body-lg text-on-surface-variant max-w-xl mx-auto">
              We go beyond booking to deliver an elevated travel experience at every touchpoint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                icon: 'verified',
                title: 'Curated Collection',
                description: 'Every property on our platform is hand-selected and verified for quality, ensuring you enjoy nothing less than exceptional standards.',
              },
              {
                icon: 'smart_toy',
                title: 'AI-Powered Recommendations',
                description: 'Our intelligent concierge learns your preferences and suggests tailored itineraries and properties that match your unique travel style.',
              },
              {
                icon: 'support_agent',
                title: '24/7 Concierge Support',
                description: 'From booking to check-out, our dedicated support team is available around the clock to assist with any request or concern.',
              },
              {
                icon: 'shield',
                title: 'Secure & Hassle-Free',
                description: 'Book with confidence using our secure payment system. Enjoy flexible cancellation policies and protected reservations.',
              },
              {
                icon: 'payments',
                title: 'Best Price Guarantee',
                description: 'We ensure you receive the most competitive rates for every property. Find a lower price elsewhere and we will match it.',
              },
              {
                icon: 'travel_explore',
                title: 'Global Destinations',
                description: 'Discover exceptional properties in over 120 cities worldwide, from boutique urban hotels to remote island retreats.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest rounded-xl shadow-ambient p-8 hover:shadow-ambient-hover hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mb-5 text-secondary">
                  <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                </div>
                <h3 className="font-serif text-2xl font-semibold text-on-surface mb-3">{feature.title}</h3>
                <p className="font-sans text-body-md text-on-surface-variant leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 md:py-24 px-5 md:px-16">
        <div className="max-w-[1440px] mx-auto">
          <div className="bg-primary-container rounded-xl overflow-hidden relative shadow-2xl">
            <div className="p-8 md:p-20 text-center relative z-10">
              <h2 className="font-serif text-[28px] md:text-[48px] leading-tight font-semibold text-on-primary mb-4 md:mb-6">
                Ready to Experience Luxury?
              </h2>
              <p className="font-sans text-sm md:text-body-lg text-white/80 max-w-xl mx-auto mb-8 md:mb-10">
                Begin your journey with Ascendant Luxury. Browse our curated collection of exceptional properties and book your next unforgettable stay.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                <Link
                  to="/hotels"
                  className="btn-gold inline-flex items-center gap-2 text-sm md:text-base px-6 md:px-8 py-3 md:py-4"
                >
                  Browse Hotels
                  <span className="material-symbols-outlined text-[16px] md:text-[18px]">arrow_forward</span>
                </Link>
                <Link
                  to="/register"
                  className="border border-white/30 text-on-primary font-sans font-semibold px-6 md:px-8 py-3 md:py-4 rounded-lg text-sm md:text-base hover:bg-white/10 transition-all duration-300"
                >
                  Create an Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom spacer for mobile nav */}
      <div className="h-4 md:h-0" />

    </div>
  );
};

export default AboutPage;
