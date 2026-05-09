import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop"
        alt="Luxury hotel corridor"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background/80" />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {/* 404 */}
        <h1 className="font-serif text-[64px] leading-none text-primary-container mb-4">
          404
        </h1>

        {/* Gold divider */}
        <div className="w-16 h-[2px] bg-secondary mx-auto mb-6" />

        {/* Message */}
        <p className="font-sans text-on-surface-variant text-lg mb-10 max-w-sm mx-auto">
          The page you are looking for has checked out.
        </p>

        {/* CTA button */}
        <Link
          to="/"
          className="group inline-flex items-center gap-2 bg-secondary text-on-secondary rounded-full px-8 py-4 label-caps uppercase hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
        >
          Return to Homepage
          <span className="material-symbols-outlined text-[18px] translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
            arrow_forward
          </span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
