import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const navBg = isHomePage && !scrolled
    ? 'bg-transparent'
    : 'bg-surface-container-lowest/95 backdrop-blur-md shadow-sm';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="flex justify-between items-center w-full px-5 md:px-16 py-4 max-w-[1440px] mx-auto">
        {/* Logo */}
        <Link to="/" className={`font-serif text-2xl font-semibold transition-colors duration-300 ${isHomePage && !scrolled ? 'text-white' : 'text-on-surface'}`}>
          Ascendant Luxury
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/hotels"
            className={`font-sans transition-colors duration-300 ${
              isHomePage && !scrolled
                ? 'text-secondary-fixed-dim border-b-2 border-secondary-fixed-dim pb-1'
                : 'text-secondary border-b-2 border-secondary pb-1'
            }`}
          >
            Hotels
          </Link>
          <Link
            to="/about"
            className={`font-sans transition-colors duration-300 ${
              isHomePage && !scrolled ? 'text-white/90 hover:text-white' : 'text-on-surface hover:text-secondary'
            }`}
          >
            About
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-6">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 transition-colors duration-300 ${isHomePage && !scrolled ? 'text-white/90 hover:text-white' : 'text-on-surface hover:text-secondary'}`}
              >
                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-sans font-semibold text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <span className={`font-sans text-sm ${isHomePage && !scrolled ? 'text-white/90' : 'text-on-surface'}`}>{user?.firstName}</span>
                <span className={`material-symbols-outlined text-base ${isHomePage && !scrolled ? 'text-white/90' : 'text-on-surface'}`}>expand_more</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-surface-container-lowest rounded-xl shadow-ambient-hover border border-outline-variant/30 py-2 z-50">
                  <Link to="/my-bookings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 font-sans text-sm text-on-surface hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined text-base">luggage</span>
                    My Bookings
                  </Link>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 font-sans text-sm text-on-surface hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined text-base">person</span>
                    Profile
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 font-sans text-sm text-on-surface hover:bg-surface-container-low transition-colors">
                      <span className="material-symbols-outlined text-base">dashboard</span>
                      Dashboard
                    </Link>
                  )}
                  <div className="border-t border-outline-variant/30 my-1" />
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 font-sans text-sm text-error hover:bg-surface-container-low transition-colors w-full text-left">
                    <span className="material-symbols-outlined text-base">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className={`font-sans transition-colors duration-300 ${
                  isHomePage && !scrolled ? 'text-white/90 hover:text-white' : 'text-secondary hover:text-on-secondary-container'
                }`}
              >
                Login/Register
              </Link>
              <button
                className={`transition-colors duration-300 ${
                  isHomePage && !scrolled ? 'text-white/90 hover:text-white' : 'text-on-surface hover:text-secondary'
                }`}
              >
                <span className="material-symbols-outlined">person</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`md:hidden transition-colors duration-300 ${isHomePage && !scrolled ? 'text-white' : 'text-on-surface'}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-surface-container-lowest border-t border-outline-variant/30 px-5 py-4 space-y-4">
          <Link to="/hotels" onClick={() => setMenuOpen(false)} className="block font-sans text-on-surface hover:text-secondary transition-colors">Hotels</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)} className="block font-sans text-on-surface hover:text-secondary transition-colors">About</Link>
          {isAuthenticated ? (
            <>
              <Link to="/my-bookings" onClick={() => setMenuOpen(false)} className="block font-sans text-on-surface hover:text-secondary transition-colors">My Bookings</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block font-sans text-on-surface hover:text-secondary transition-colors">Profile</Link>
              {user?.role === 'ADMIN' && (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block font-sans text-on-surface hover:text-secondary transition-colors">Dashboard</Link>
              )}
              <button onClick={handleLogout} className="block font-sans text-error hover:opacity-80 transition-colors">Sign Out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block font-sans text-secondary">Login / Register</Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
