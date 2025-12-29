import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu,
  X,
  Scissors,
  Home,
  LogIn,
  LogOut,
  UserPlus,
  Briefcase,
  Search,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  User,
  Calendar,
  Wallet,
  Settings,
  Lock
} from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Handle scroll effect for floating navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu and user dropdown when route changes
  useEffect(() => {
    setIsOpen(false);
    setUserDropdownOpen(false);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.user-dropdown-container')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/all-services-search', label: 'Search Services', icon: Search },
  ];

  const publicNavLinks = [
    { to: '/customer-account-creation', label: 'Customer', icon: UserPlus },
    { to: '/barber-account-creation', label: 'Barber', icon: Briefcase },
  ];

  const authenticatedNavLinks = [
    { to: '/customer-history', label: 'My Bookings', icon: Calendar },
    { to: '/customer-setkar-coins', label: 'My Wallet', icon: Wallet },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed left-1/2 -translate-x-1/2 w-[90%] md:w-[95%] max-w-7xl z-50 rounded-2xl md:top-4 top-2 transition-all duration-300 ease-in-out border ${
          scrolled || isOpen
            ? 'bg-white backdrop-blur-md shadow-2xl border-black/10 py-2'
            : 'bg-white backdrop-blur-md border-black/5 py-3 shadow-xl'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo Area */}
            <Link to="/" className="flex-shrink-0 cursor-pointer group py-0 -mt-1 -mb-1 md:-mt-2 md:-mb-2">
              <img
                src="/GlossCut.jpeg"
                alt="GlossCut"
                className="h-9 md:h-10 w-auto transform group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 group flex items-center gap-2
                      ${active
                        ? 'text-black bg-black/10 shadow-inner'
                        : 'text-gray-700 hover:text-black hover:bg-black/5'
                      }`}
                  >
                    <Icon size={16} className={active ? 'text-indigo-400' : 'group-hover:text-indigo-400 transition-colors'} />
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full mb-1.5" />
                    )}
                  </Link>
                );
              })}

              {!isAuthenticated && publicNavLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 group flex items-center gap-2
                      ${active
                        ? 'text-black bg-black/10 shadow-inner'
                        : 'text-gray-700 hover:text-black hover:bg-black/5'
                      }`}
                  >
                    <Icon size={16} className={active ? 'text-indigo-400' : 'group-hover:text-indigo-400 transition-colors'} />
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full mb-1.5" />
                    )}
                  </Link>
                );
              })}

              {isAuthenticated && authenticatedNavLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 group flex items-center gap-2
                      ${active
                        ? 'text-black bg-black/10 shadow-inner'
                        : 'text-gray-700 hover:text-black hover:bg-black/5'
                      }`}
                  >
                    <Icon size={16} className={active ? 'text-indigo-400' : 'group-hover:text-indigo-400 transition-colors'} />
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full mb-1.5" />
                    )}
                  </Link>
                );
              })}

              {/* Authentication Section */}
              {isAuthenticated ? (
                <div className="ml-4 flex items-center gap-3 relative user-dropdown-container">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-black/10 rounded-full hover:bg-black/15 transition-colors"
                  >
                    <User size={16} className="text-indigo-400" />
                    <span className="text-sm font-medium text-black">{user?.name || 'User'}</span>
                    <ChevronDown size={14} className={`text-gray-600 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-md transform hover:-translate-y-0.5 bg-red-600 text-white hover:bg-red-500 hover:shadow-red-500/25 border border-red-500/50 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>

                  {/* User Dropdown */}
                  {userDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 w-64 rounded-2xl bg-white backdrop-blur-md border border-black/10 shadow-2xl z-50">
                      <div className="p-2">
                        <Link
                          to="/personal-info"
                          className="flex items-center gap-3 p-3 rounded-xl text-gray-800 hover:bg-black/5 hover:text-black transition-all duration-200 group"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <div className="p-2 rounded-lg bg-black/5 group-hover:bg-indigo-50 transition-colors">
                            <Settings size={18} className="text-indigo-400 group-hover:text-indigo-500 transition-colors" />
                          </div>
                          <span className="font-semibold text-sm tracking-wide">Personal Info</span>
                        </Link>
                        <Link
                          to="/change-password"
                          className="flex items-center gap-3 p-3 rounded-xl text-gray-800 hover:bg-black/5 hover:text-black transition-all duration-200 group"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <div className="p-2 rounded-lg bg-black/5 group-hover:bg-indigo-50 transition-colors">
                            <Lock size={18} className="text-indigo-400 group-hover:text-indigo-500 transition-colors" />
                          </div>
                          <span className="font-semibold text-sm tracking-wide">Change Password</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-md transform hover:-translate-y-0.5 bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-500/25 border border-indigo-500/50"
                >
                  <span className="flex items-center gap-2">
                    <LogIn size={16} />
                    Login
                  </span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-lg focus:outline-none transition-colors duration-200 text-gray-700 hover:text-black hover:bg-black/10"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden absolute top-[calc(100%+8px)] left-0 w-full rounded-2xl bg-white backdrop-blur-md border border-black/10 shadow-2xl transition-all duration-300 ease-in-out transform origin-top max-h-[70vh] overflow-y-auto ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="p-2 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-black/10 text-black shadow-sm'
                      : 'text-gray-900 hover:bg-black/5 hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${active ? 'bg-indigo-500/20' : 'bg-black/5'}`}>
                      <Icon size={18} className={active ? 'text-indigo-400' : 'text-gray-600'} />
                    </div>
                    <span className="font-bold text-sm tracking-wide">{link.label}</span>
                  </div>
                  {active && <ChevronRight size={16} className="text-indigo-400" />}
                </Link>
              );
            })}

            {!isAuthenticated && publicNavLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-black/10 text-black shadow-sm'
                      : 'text-gray-900 hover:bg-black/5 hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${active ? 'bg-indigo-500/20' : 'bg-black/5'}`}>
                      <Icon size={18} className={active ? 'text-indigo-400' : 'text-gray-600'} />
                    </div>
                    <span className="font-bold text-sm tracking-wide">{link.label}</span>
                  </div>
                  {active && <ChevronRight size={16} className="text-indigo-400" />}
                </Link>
              );
            })}

            {isAuthenticated && authenticatedNavLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-black/10 text-black shadow-sm'
                      : 'text-gray-900 hover:bg-black/5 hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${active ? 'bg-indigo-500/20' : 'bg-black/5'}`}>
                      <Icon size={18} className={active ? 'text-indigo-400' : 'text-gray-600'} />
                    </div>
                    <span className="font-bold text-sm tracking-wide">{link.label}</span>
                  </div>
                  {active && <ChevronRight size={16} className="text-indigo-400" />}
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-black/10">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-black/10 rounded-xl">
                    <User size={18} className="text-indigo-400" />
                    <span className="text-sm font-medium text-black">{user?.name || 'User'}</span>
                  </div>
                  <Link
                    to="/personal-info"
                    className="flex items-center gap-3 p-3 rounded-xl text-gray-900 hover:bg-black/5 hover:text-black transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-lg bg-black/5 group-hover:bg-indigo-50 transition-colors">
                      <Settings size={18} className="text-indigo-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <span className="font-bold text-sm tracking-wide">Personal Info</span>
                  </Link>
                  <Link
                    to="/change-password"
                    className="flex items-center gap-3 p-3 rounded-xl text-gray-900 hover:bg-black/5 hover:text-black transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-lg bg-black/5 group-hover:bg-indigo-50 transition-colors">
                      <Lock size={18} className="text-indigo-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <span className="font-bold text-sm tracking-wide">Change Password</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-500 text-white p-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all shadow-lg shadow-red-900/20"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all shadow-lg shadow-indigo-900/20"
                >
                  <LogIn size={18} />
                  Login to Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
