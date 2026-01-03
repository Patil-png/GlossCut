import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu,
  X,
  Home,
  LogIn,
  LogOut,
  UserPlus,
  Briefcase,
  Search,
  ChevronRight,
  ChevronDown,
  User,
  Calendar,
  Wallet,
  Settings,
  Lock,
  Sparkles,
  Zap
} from 'lucide-react';

// --- UTILITY COMPONENTS ---

/**
 * A specialized button for the navigation links with hover glow effects
 */
const NavItem = ({ to, icon: Icon, label, isActive }) => {
  return (
    <Link
      to={to}
      className={`relative group px-5 py-2.5 rounded-2xl transition-all duration-500 ease-out flex items-center gap-2 overflow-hidden
      ${isActive 
        ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-white/20' 
        : 'hover:bg-white/5 text-slate-400 hover:text-white'
      }`}
    >
      {/* Active State Background Gradient (Subtle Aurora) */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 opacity-100 blur-xl transition-all duration-500" />
      )}
      
      {/* Hover Spotlight Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-white/5 to-transparent" />

      {/* Icon & Text */}
      <Icon 
        size={18} 
        className={`relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-300'}`} 
      />
      <span className="relative z-10 text-sm font-semibold tracking-wide">{label}</span>
      
      {/* Active Indicator Dot */}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_-4px_10px_rgba(99,102,241,1)]" />
      )}
    </Link>
  );
};

/**
 * The Login Button with a "Shine" animation
 */
const PrimaryButton = ({ to, icon: Icon, label, onClick, className = '' }) => {
  const Component = to ? Link : 'button';
  return (
    <Component
      to={to}
      onClick={onClick}
      className={`relative group px-6 py-2.5 rounded-xl overflow-hidden bg-indigo-600 text-white shadow-[0_4px_20px_rgba(79,70,229,0.4)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_6px_25px_rgba(79,70,229,0.6)] border border-indigo-400/30 flex items-center gap-2 ${className}`}
    >
      {/* Animated Shine Effect */}
      <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[25deg] transition-all duration-1000 group-hover:animate-[shimmer_1s_infinite]" />
      
      <div className="relative flex items-center gap-2 font-bold text-sm tracking-wide mx-auto">
        {Icon && <Icon size={16} className="group-hover:text-indigo-100" />}
        {label}
      </div>
    </Component>
  );
};

// --- MAIN NAVBAR COMPONENT ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const dropdownRef = useRef(null);

  // Scroll Detection for Glass Morphism intensity
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setIsOpen(false);
    setUserDropdownOpen(false);
  }, [location]);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // Navigation Data
  const mainLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/all-services-search', label: 'Discover', icon: Search },
  ];
  
  // Renamed back to publicNavLinks to match usage
  const publicNavLinks = [
    { to: '/customer-account-creation', label: 'For Customers', icon: UserPlus },
    { to: '/barber-account-creation', label: 'For Barbers', icon: Briefcase },
  ];

  // Renamed back to authenticatedNavLinks to match usage
  const authenticatedNavLinks = [
    { to: '/customer-history', label: 'Bookings', icon: Calendar },
    { to: '/customer-setkar-coins', label: 'Wallet', icon: Wallet },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Inject custom shimmer animation for the button */}
      <style>{`
        @keyframes shimmer {
          100% { left: 200%; }
        }
      `}</style>

      <nav
        className={`fixed z-50 transition-all duration-500 ease-out left-0 right-0 flex justify-center
          ${scrolled ? 'top-2' : 'top-4 md:top-6'}
        `}
      >
        <div 
          className={`
            relative w-[95%] max-w-7xl rounded-3xl transition-all duration-500
            ${scrolled || isOpen
              ? 'bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_40px_-10px_rgba(0,0,0,0.8)]' 
              : 'bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/5 shadow-2xl'
            }
          `}
        >
          {/* Top light border highlight for 3D effect */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
          
          <div className="px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 md:h-20">

              {/* --- LOGO SECTION --- */}
              <Link to="/" className="relative group flex items-center gap-3">
                <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img src="/GlossCut.jpeg" alt="Logo" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
                    GlossCut
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold">
                    Premium
                  </span>
                </div>
              </Link>

              {/* --- DESKTOP NAVIGATION --- */}
              <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                {mainLinks.map(link => (
                  <NavItem key={link.to} {...link} isActive={isActive(link.to)} />
                ))}
                
                {/* Vertical Divider */}
                <div className="w-px h-6 bg-white/10 mx-2" />
                
                {!isAuthenticated && publicNavLinks.map(link => (
                  <NavItem key={link.to} {...link} isActive={isActive(link.to)} />
                ))}
                
                {isAuthenticated && authenticatedNavLinks.map(link => (
                  <NavItem key={link.to} {...link} isActive={isActive(link.to)} />
                ))}
              </div>

              {/* --- AUTH SECTION (Desktop) --- */}
              <div className="hidden lg:flex items-center gap-4">
                {isAuthenticated ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className={`flex items-center gap-3 pl-1 pr-4 py-1.5 rounded-full border transition-all duration-300 group ${
                        userDropdownOpen 
                          ? 'bg-slate-800 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                          : 'bg-black/20 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 p-[2px] shadow-inner">
                        <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                           <User size={16} className="text-white" />
                        </div>
                      </div>
                      <div className="flex flex-col items-start">
                         <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Hello</span>
                         <span className="text-sm font-semibold leading-none">{user?.name?.split(' ')[0] || 'User'}</span>
                      </div>
                      <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                    </button>

                    {/* HUD Style Dropdown */}
                    <div 
                      className={`absolute top-[calc(100%+12px)] right-0 w-80 bg-[#0f1115] border border-white/10 rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,1)] overflow-hidden transition-all duration-300 transform origin-top-right z-50
                      ${userDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'}`}
                    >
                       {/* Dropdown Header */}
                       <div className="relative p-5 bg-gradient-to-b from-indigo-900/20 to-transparent border-b border-white/5">
                          <div className="absolute top-0 right-0 p-4 opacity-20">
                             <Sparkles size={40} className="text-indigo-500" />
                          </div>
                          <p className="text-xs text-indigo-400 font-bold tracking-widest uppercase mb-1">Signed in as</p>
                          <p className="text-white font-medium truncate pr-4">{user?.email}</p>
                       </div>
                       
                       <div className="p-2 space-y-1">
                          <Link to="/personal-info" className="flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all group">
                             <div className="p-2 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 transition-colors">
                                <Settings size={18} className="group-hover:text-indigo-400" />
                             </div>
                             <div>
                                <span className="block text-sm font-bold">Personal Info</span>
                                <span className="block text-xs text-slate-500">Update details</span>
                             </div>
                          </Link>
                          <Link to="/change-password" className="flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all group">
                             <div className="p-2 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 transition-colors">
                                <Lock size={18} className="group-hover:text-indigo-400" />
                             </div>
                             <div>
                                <span className="block text-sm font-bold">Security</span>
                                <span className="block text-xs text-slate-500">Password & Safety</span>
                             </div>
                          </Link>
                       </div>
                       
                       <div className="p-2 border-t border-white/5">
                          <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-sm font-bold">
                             <LogOut size={16} /> Log Out
                          </button>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/login" className="text-slate-300 hover:text-white text-sm font-semibold transition-colors px-2">
                        Log In
                    </Link>
                    <PrimaryButton to="/customer-account-creation" label="Get Started" icon={Zap} />
                  </div>
                )}
              </div>

              {/* --- MOBILE TOGGLE --- */}
              <div className="lg:hidden">
                 <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`relative p-3 rounded-xl border transition-all duration-300 ${
                       isOpen 
                       ? 'bg-white/10 text-white border-white/20 rotate-90' 
                       : 'text-slate-300 border-white/5 hover:bg-white/5'
                    }`}
                 >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                 </button>
              </div>

            </div>
          </div>

          {/* --- MOBILE MENU (Slide Down) --- */}
          <div 
             className={`lg:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.725,0.25,1)] ${
                isOpen ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0'
             }`}
          >
             <div className="px-4 pb-6 pt-2 space-y-4">
                {/* Search Bar Visual */}
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                   <input 
                      type="text" 
                      placeholder="Search services..." 
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      readOnly // visual only for navbar
                      onClick={() => { setIsOpen(false); navigate('/all-services-search'); }}
                   />
                </div>

                <div className="grid grid-cols-2 gap-2">
                   {mainLinks.map(link => (
                      <Link 
                         key={link.to} 
                         to={link.to}
                         className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                            isActive(link.to) 
                            ? 'bg-indigo-600 text-white border-indigo-400' 
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                         }`}
                      >
                         <link.icon size={24} className="mb-2" />
                         <span className="text-xs font-bold">{link.label}</span>
                      </Link>
                   ))}
                </div>

                <div className="space-y-1">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 mb-2">Menu</p>
                   {isAuthenticated ? authenticatedNavLinks.map(link => (
                      <Link 
                         key={link.to} to={link.to} 
                         className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 transition-all"
                      >
                         <div className="flex items-center gap-3">
                            <link.icon size={18} className="text-indigo-400" />
                            <span className="font-semibold">{link.label}</span>
                         </div>
                         <ChevronRight size={16} className="text-slate-600" />
                      </Link>
                   )) : publicNavLinks.map(link => (
                      <Link 
                         key={link.to} to={link.to} 
                         className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 transition-all"
                      >
                         <div className="flex items-center gap-3">
                            <link.icon size={18} className="text-indigo-400" />
                            <span className="font-semibold">{link.label}</span>
                         </div>
                         <ChevronRight size={16} className="text-slate-600" />
                      </Link>
                   ))}
                </div>

                {/* Mobile Auth Actions */}
                <div className="pt-4 border-t border-white/10">
                   {isAuthenticated ? (
                      <div className="space-y-3">
                         <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-900/20 to-transparent rounded-2xl border border-indigo-500/20">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                               {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                               <p className="text-white font-bold">{user?.name}</p>
                               <p className="text-xs text-indigo-300">Logged in</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <Link to="/personal-info" className="flex-1 p-3 text-center rounded-xl bg-white/5 text-xs font-bold text-slate-300 border border-white/5">Settings</Link>
                            <button onClick={logout} className="flex-1 p-3 text-center rounded-xl bg-red-500/10 text-xs font-bold text-red-400 border border-red-500/20">Log Out</button>
                         </div>
                      </div>
                   ) : (
                      <PrimaryButton to="/login" label="Log In to Account" icon={LogIn} className="w-full justify-center" />
                   )}
                </div>
             </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;