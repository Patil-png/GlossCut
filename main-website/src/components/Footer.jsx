import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Ship,
  ArrowRight,
  Heart
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-[#09090b] text-slate-400 font-sans border-t border-white/10 overflow-hidden">
      
      {/* --- SUBTLE BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[100px] bg-orange-500/10 blur-[60px] opacity-40"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]"></div>
      </div>

      {/* CHANGED: Reduced top padding from pt-12/16 to pt-8/12 and bottom from pb-8 to pb-6 */}
      <div className="relative z-0 max-w-7xl mx-auto px-6 pt-8 md:pt-12 pb-6 lg:px-8">
        
        {/* --- SECTION 1: BRAND & NEWSLETTER --- */}
        {/* CHANGED: Reduced bottom padding/margin from pb-8/12 to pb-6/8 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8 border-b border-white/5 pb-6 md:pb-8 mb-6 md:mb-8">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(249,115,22,0.1)] overflow-hidden">
              <img
                src="/GlossCut.png"
                alt="GlossCut Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">GlossCut</h2>
              {/* Hidden on Mobile */}
              <p className="hidden md:block text-[10px] font-medium text-slate-500 uppercase tracking-widest">Premium Grooming</p>
            </div>
          </div>

          {/* Newsletter Input */}
          <div className="w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative w-full">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                />
              </div>
              <Link 
                to="/customer-account-creation" 
                className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2"
              >
                Join <span className="hidden sm:inline">Guild</span> <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: LINKS GRID --- */}
        {/* CHANGED: Reduced margin bottom from mb-12/16 to mb-8/10 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-8 md:mb-10">
          
          {/* About Column - HIDDEN on Mobile */}
          <div className="hidden md:block col-span-2 md:col-span-1">
            <h4 className="text-white font-semibold mb-3 text-sm">About Us</h4>
            <p className="text-xs leading-relaxed text-slate-500 mb-4 pr-4">
              GlossCut connects discerning gentlemen with the finest grooming artisans. Style is a language, and we help you speak it fluently.
            </p>
          </div>

          {/* Explore Column */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Explore</h4>
            <ul className="space-y-2 text-xs">
              <FooterLink to="/all-services-search">Find a Barber</FooterLink>
              <FooterLink to="/top-rated">Top Rated Shops</FooterLink>
              <FooterLink to="/blog">Grooming Tips</FooterLink>
              <FooterLink to="/careers">Careers</FooterLink>
            </ul>
          </div>

          {/* Accounts Column */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Accounts</h4>
            <ul className="space-y-2 text-xs">
              <FooterLink to="/login">Login</FooterLink>
              <FooterLink to="/customer-account-creation">Join as Member</FooterLink>
              <FooterLink to="/barber-account-creation">For Barbers</FooterLink>
              <FooterLink to="/help">Help Center</FooterLink>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-white font-semibold mb-3 text-sm">Contact</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center md:items-start gap-3 text-slate-400">
                <Mail size={14} className="text-orange-500 shrink-0" />
                <span>post@glosscut.com</span>
              </li>
              <li className="flex items-center md:items-start gap-3 text-slate-400">
                <Phone size={14} className="text-orange-500 shrink-0" />
                <span>+1 (555) 808-2077</span>
              </li>
              <li className="hidden md:flex items-start gap-3 text-slate-400">
                <MapPin size={14} className="mt-0.5 text-orange-500 shrink-0" />
                <span>Old Port, Sector 7<br/>Postal Code 444601</span>
              </li>
            </ul>
          </div>
        </div>

        {/* --- SECTION 3: FOOTER BOTTOM --- */}
        {/* CHANGED: Reduced padding top from pt-8 to pt-6 */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          
          <div className="text-slate-600 flex flex-col-reverse md:flex-row items-center gap-4">
            <span>© {currentYear} GlossCut Inc.</span>
            
            <div className="hidden md:flex gap-4">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>

          {/* Designer Credit */}
          <a 
            href="https://github.com/ompatil" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 transition-all"
          >
            <span className="text-[10px] text-slate-500 group-hover:text-slate-300">Crafted by</span>
            <span className="text-[10px] font-semibold text-orange-500">Om B. Patil</span>
            <Heart size={10} className="text-red-500 fill-red-500" />
          </a>
        </div>
      </div>
    </footer>
  );
};

// --- STYLED COMPONENTS ---

const FooterLink = ({ to, children }) => (
  <li>
    <Link 
      to={to} 
      className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
    >
      {children}
    </Link>
  </li>
);

export default Footer;
