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
  Calendar,
  Wallet,
  Settings,
  Sparkles
} from 'lucide-react';

// --- UTILITY COMPONENTS ---

const NavItem = ({ to, icon: Icon, label, isActive }) => {
  return (
    <Link
      to={to}
      className={`relative group px-4 py-2 mx-1 text-sm font-medium transition-all duration-300 ease-out flex items-center gap-2 rounded-full overflow-hidden
      ${isActive
          ? 'text-amber-600 bg-amber-50 border border-amber-100 shadow-sm'
          : 'text-gray-600 hover:text-black hover:bg-gray-100 border border-transparent'
        }`}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-100" />
      )}
      <Icon
        size={18}
        strokeWidth={isActive ? 2.5 : 2}
        className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
      />
      <span className="relative z-10">{label}</span>
    </Link>
  );
};

const PrimaryButton = ({ to, icon: Icon, label, onClick, className = '' }) => {
  const Component = to ? Link : 'button';
  return (
    <Component
      to={to}
      onClick={onClick}
      className={`relative group overflow-hidden px-6 py-2.5 font-bold text-sm text-white shadow-lg shadow-amber-600/20 hover:shadow-amber-500/40 transition-all duration-300 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 ${className}`}
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-0 transition-transform duration-500 ease-out" />
      <div className="relative flex items-center gap-2 mx-auto justify-center">
        {Icon && <Icon size={18} strokeWidth={2.5} />}
        <span>{label}</span>
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setUserDropdownOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  const mainLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/all-services-search', label: 'Book Now', icon: Search },
  ];
  const publicNavLinks = [
    { to: '/customer-account-creation', label: 'Sign Up', icon: UserPlus },
    { to: '/barber-account-creation', label: 'For Barbers', icon: Briefcase },
  ];
  const authenticatedNavLinks = [
    { to: '/customer-history', label: 'My Appointments', icon: Calendar },
    { to: '/customer-setkar-coins', label: 'Wallet & Coins', icon: Wallet },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`fixed z-50 left-0 right-0 flex flex-col items-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${scrolled ? 'top-2 md:top-3' : 'top-4 md:top-5'}`}>

        {/* --- NEW BACKDROP OVERLAY --- */}
        {/* This div covers the entire screen behind the menu to create the blur effect */}
        <div
          className={`
                fixed inset-0 h-[100dvh] w-screen bg-black/60 backdrop-blur-md
                transition-all duration-500 ease-in-out -z-10
                ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
            `}
          onClick={() => setIsOpen(false)} // Clicking the blurred area closes menu
          aria-hidden="true"
        />

        {/* --- MAIN HEADER PILL (Fixed Size) --- */}
        <div
          className={`
            relative z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col justify-center
            backdrop-blur-2xl border border-white/20
            ${scrolled
              ? 'w-[92%] md:w-[80%] max-w-6xl rounded-full bg-slate-50/90 shadow-xl shadow-black/10 border-gray-300/50'
              : 'w-[95%] max-w-7xl rounded-full bg-slate-50/70 shadow-md border-white/20'
            }
          `}
        >
          <div className="px-4 md:px-8 shrink-0">
            <div className="flex justify-between items-center h-16 md:h-[72px]">

              {/* LOGO */}
              <Link to="/" className="flex items-center gap-3 select-none group">
                <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                  <img
                    src="/GlossCut.png"
                    alt="GlossCut Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl font-bold text-gray-900 tracking-tight leading-none">GlossCut</span>
                  <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">Grooming</span>
                </div>
              </Link>

              {/* DESKTOP NAV */}
              <div className="hidden lg:flex items-center gap-1 bg-gray-100/50 p-1 rounded-full border border-gray-200 backdrop-blur-sm">
                {mainLinks.map(link => <NavItem key={link.to} {...link} isActive={isActive(link.to)} />)}
                <div className="w-px h-5 bg-white/10 mx-2" />
                {!isAuthenticated && publicNavLinks.map(link => <NavItem key={link.to} {...link} isActive={isActive(link.to)} />)}
                {isAuthenticated && authenticatedNavLinks.map(link => <NavItem key={link.to} {...link} isActive={isActive(link.to)} />)}
              </div>

              {/* DESKTOP AUTH */}
              <div className="hidden lg:flex items-center gap-4">
                {isAuthenticated ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-3 pl-2 pr-4 py-1.5 border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all rounded-full"
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-900 border border-gray-200 flex items-center justify-center text-white text-sm font-bold">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm text-gray-700 font-bold">{user?.name?.split(' ')[0] || 'User'}</span>
                      <ChevronDown size={14} className="text-gray-500" />
                    </button>
                    {/* Desktop Dropdown Content */}
                    <div className={`absolute top-[calc(100%+16px)] right-0 w-72 bg-[#121212] border border-white/10 shadow-xl transition-all duration-200 rounded-2xl overflow-hidden ${userDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                      <div className="p-4 border-b border-white/5 bg-white/5">
                        <p className="text-white font-bold">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <Link to="/personal-info" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all"><Settings size={18} /> Settings</Link>
                        <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all font-bold"><LogOut size={18} /> Sign Out</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/login" className="px-5 py-2.5 rounded-full bg-gray-100 text-gray-900 font-bold text-sm hover:bg-gray-200 transition-all">Log In</Link>
                    <Link
                      to="/customer-account-creation"
                      className="px-5 py-2.5 rounded-full bg-black text-white font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>

              {/* MOBILE TOGGLE BUTTON */}
              <div className="lg:hidden">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 border
                     ${isOpen
                      ? 'bg-gray-100 text-gray-900 border-gray-200 rotate-90'
                      : 'text-gray-900 bg-transparent border-transparent hover:bg-black/5'
                    }`}
                >
                  {isOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- MOBILE MENU (DETACHED CARD ANIMATION) --- */}
        <div
          className={`
             lg:hidden absolute top-full left-0 right-0 mx-auto mt-2
             w-[95%] max-w-lg rounded-[28px] bg-white/95 backdrop-blur-2xl border border-gray-200 shadow-2xl
             overflow-hidden transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) origin-top z-50
             ${isOpen
              ? 'opacity-100 translate-y-0 scale-100 visible'
              : 'opacity-0 -translate-y-4 scale-95 invisible pointer-events-none'
            }
           `}
        >
          <div className="px-5 pb-8 pt-6 overflow-y-auto max-h-[75vh] flex flex-col gap-6">

            {/* 1. Mobile Search Bar */}
            <div className={`transition-all duration-700 delay-100 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="relative group shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Find services..."
                  className="w-full bg-gray-100 border border-gray-200 py-3.5 pl-12 pr-4 text-gray-900 placeholder:text-gray-500 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:bg-white transition-all"
                  readOnly
                  onClick={() => { setIsOpen(false); navigate('/all-services-search'); }}
                />
              </div>
            </div>

            {/* 2. Main Action Grid */}
            <div className={`transition-all duration-700 delay-150 shrink-0 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Quick Actions</p>
              <div className="grid grid-cols-2 gap-3">
                {mainLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 active:scale-95 ${isActive(link.to)
                      ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/30'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    <link.icon size={24} className="mb-2" />
                    <span className="text-xs font-bold">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 3. Navigation List */}
            <div className={`transition-all duration-700 delay-200 shrink-0 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Menu</p>
              <div className="space-y-2">
                {isAuthenticated ? authenticatedNavLinks.map(link => (
                  <MobileNavLink key={link.to} {...link} onClick={() => setIsOpen(false)} isActive={isActive(link.to)} />
                )) : publicNavLinks.map(link => (
                  <MobileNavLink key={link.to} {...link} onClick={() => setIsOpen(false)} isActive={isActive(link.to)} />
                ))}
              </div>
            </div>

            {/* 4. User Profile / Auth Section */}
            <div className={`transition-all duration-700 delay-300 pt-2 shrink-0 pb-4 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {isAuthenticated ? (
                <div className="bg-gradient-to-br from-[#1a1a1a] to-black rounded-3xl p-5 border border-white/10 relative overflow-hidden group">
                  {/* Decorative shine */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                  <div className="flex items-center gap-4 mb-5 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center text-white text-lg font-bold shadow-lg ring-2 ring-black">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-white font-bold text-lg truncate">{user?.name}</p>
                      <p className="text-xs text-amber-500 font-medium flex items-center gap-1">
                        <Sparkles size={10} /> Member
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <Link
                      to="/personal-info"
                      onClick={() => setIsOpen(false)}
                      className="col-span-1 py-3 px-4 flex items-center justify-center gap-2 bg-white/5 rounded-xl border border-white/5 text-gray-300 hover:bg-white/10 active:scale-95 transition-all"
                    >
                      <Settings size={16} />
                      <span className="text-xs font-bold">Settings</span>
                    </Link>
                    <button
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="col-span-1 py-3 px-4 flex items-center justify-center gap-2 bg-red-500/10 rounded-xl border border-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
                    >
                      <LogOut size={16} />
                      <span className="text-xs font-bold">Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <PrimaryButton
                    to="/login"
                    label="Log In / Sign Up"
                    icon={LogIn}
                    onClick={() => setIsOpen(false)}
                    className="w-full justify-center py-4 text-base shadow-amber-900/20"
                  />
                  <p className="text-center text-[10px] text-gray-500">
                    Join thousands of customers booking premium cuts.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

      </nav>
    </>
  );
};

// --- MOBILE NAV LINK HELPER ---
const MobileNavLink = ({ to, icon: Icon, label, onClick, isActive }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 active:scale-[0.98] border
     ${isActive
        ? 'bg-amber-50 border-amber-200 shadow-sm'
        : 'bg-gray-50 border-transparent hover:bg-gray-100'
      }`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
          ${isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-gray-200 text-gray-500'}`}
      >
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <span className={`font-semibold text-sm ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
        {label}
      </span>
    </div>
    <ChevronRight size={16} className={`transition-colors ${isActive ? 'text-amber-500' : 'text-gray-400'}`} />
  </Link>
);

export default Navbar;
