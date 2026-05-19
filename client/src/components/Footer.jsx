import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-primary-container border-t border-white/10" style={{ backgroundColor: '#131b2e' }}>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-5 md:px-16 py-20 max-w-[1440px] mx-auto">
      <div className="md:col-span-1">
        <div className="font-serif text-2xl text-white mb-6">Ascendant Luxury</div>
        <p className="text-white/80 font-sans text-base mb-6 max-w-xs">
          Elevating the art of travel through exclusive access and uncompromising service.
        </p>
        <div className="text-white/60 font-sans text-sm">
          © 2024 Ascendant Luxury. All rights reserved.
        </div>
      </div>
      <div>
        <h4 className="font-sans font-bold text-secondary-fixed-dim mb-4 uppercase tracking-wider text-sm">Explore</h4>
        <ul className="space-y-3">
          <li><Link to="/hotels" className="text-white/80 font-sans text-base hover:text-secondary-fixed-dim transition-colors duration-300">Hotels</Link></li>
          <li><Link to="/about" className="text-white/80 font-sans text-base hover:text-secondary-fixed-dim transition-colors duration-300">About</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-sans font-bold text-secondary-fixed-dim mb-4 uppercase tracking-wider text-sm">Support</h4>
        <ul className="space-y-3">
          <li><a href="#" className="text-white/80 font-sans text-base hover:text-secondary-fixed-dim transition-colors duration-300">Help Center</a></li>
          <li><a href="#" className="text-white/80 font-sans text-base hover:text-secondary-fixed-dim transition-colors duration-300">Contact Us</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-sans font-bold text-secondary-fixed-dim mb-4 uppercase tracking-wider text-sm">Legal</h4>
        <ul className="space-y-3">
          <li><a href="#" className="text-white/80 font-sans text-base hover:text-secondary-fixed-dim transition-colors duration-300">Privacy Policy</a></li>
          <li><a href="#" className="text-white/80 font-sans text-base hover:text-secondary-fixed-dim transition-colors duration-300">Terms of Service</a></li>
        </ul>
      </div>
    </div>
  </footer>
);

export default Footer;
