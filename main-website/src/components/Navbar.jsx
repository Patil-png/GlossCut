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

// --- UTILITY COMPONENTS (Kept EXACTLY as requested) ---

const NavItem = ({ to, icon: Icon, label, isActive }) => {
  return (
    <Link
      to={to}
      className={`relative group px-4 py-2 mx-1 border font-mono text-sm font-bold uppercase tracking-tighter transition-all duration-200 ease-out flex items-center gap-2 rounded-sm
      ${isActive 
        ? 'bg-[#1a1109] border-[#e69635] text-[#e69635] shadow-[0_0_15px_rgba(230,150,53,0.5),inset_0_0_10px_rgba(230,150,53,0.2)] translate-y-[1px]' 
        : 'bg-[#0f0f0f] border-[#3a3a3a] text-[#8a6c48] hover:text-[#e69635] hover:border-[#e69635] hover:bg-[#1a1109] hover:shadow-[0_0_10px_rgba(230,150,53,0.3)]'
      }`}
    >
      <Icon 
        size={16} 
        strokeWidth={2.5}
        className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-[#e69635]' : 'text-[#8a6c48] group-hover:text-[#e69635]'}`} 
      />
      <span className="relative z-10">{label}</span>
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[3px] bg-[#e69635] shadow-[0_-2px_15px_rgba(230,150,53,1)] blur-[1px]"></span>
      )}
    </Link>
  );
};

const PrimaryButton = ({ to, icon: Icon, label, onClick, className = '' }) => {
  const Component = to ? Link : 'button';
  return (
    <Component
      to={to}
      onClick={onClick}
      className={`relative group px-5 py-2 font-mono font-bold uppercase text-sm border-2 border-[#0affd9] bg-[#0affd9]/10 text-[#0affd9] shadow-[0_0_15px_rgba(10,255,217,0.4),inset_0_0_10px_rgba(10,255,217,0.2)] transition-all duration-200 hover:bg-[#0affd9]/20 hover:shadow-[0_0_25px_rgba(10,255,217,0.7),inset_0_0_15px_rgba(10,255,217,0.3)] flex items-center gap-2 rounded-sm ${className}`}
    >
      <div className="relative flex items-center gap-2 mx-auto">
        {Icon && <Icon size={16} strokeWidth={3} className="drop-shadow-[0_0_5px_rgba(10,255,217,0.8)]" />}
        <span className="drop-shadow-[0_0_2px_rgba(10,255,217,0.5)]">{label}</span>
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
    { to: '/all-services-search', label: 'Search', icon: Search },
  ];
  const publicNavLinks = [
    { to: '/customer-account-creation', label: 'Join', icon: UserPlus },
    { to: '/barber-account-creation', label: 'Work', icon: Briefcase },
  ];
  const authenticatedNavLinks = [
    { to: '/customer-history', label: 'History', icon: Calendar },
    { to: '/customer-setkar-coins', label: 'Coins', icon: Wallet },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        .retro-grid-solid {
          background-image: 
            linear-gradient(to right, rgba(230, 150, 53, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(230, 150, 53, 0.1) 1px, transparent 1px);
          background-size: 24px 24px;
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.4;
        }
        .scanlines-solid {
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 2px,
            rgba(0, 0, 0, 0.8) 2px,
            rgba(0, 0, 0, 0.8) 4px
          );
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.15;
        }
      `}</style>

      {/* NAVBAR CONTAINER:
         - Uses 'fixed' to stay on top.
         - 'flex justify-center' centers the island.
         - Top position changes on scroll (top-4 -> top-2) for floating effect.
      */}
      <nav
        className={`fixed z-50 left-0 right-0 flex justify-center transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]
          ${scrolled ? 'top-2' : 'top-4'}
        `}
      >
        <div 
          className={`
            relative transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden flex flex-col
            /* FLOATING ISLAND LOGIC */
            ${isOpen 
              ? 'w-[95%] max-w-lg rounded-3xl bg-[#0a0a0a] border-2 border-[#e69635] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_40px_rgba(230,150,53,0.2)]' 
              : scrolled
                ? 'w-[92%] md:w-[85%] max-w-7xl rounded-2xl bg-[#0a0a0a]/95 border-2 border-[#e69635]/80 shadow-[0_10px_30px_-5px_rgba(0,0,0,1),0_0_20px_rgba(230,150,53,0.15)] backdrop-blur-md'
                : 'w-[95%] md:w-[95%] max-w-7xl rounded-xl bg-[#0a0a0a] border-2 border-[#e69635]/50 shadow-[0_5px_20px_-5px_rgba(0,0,0,0.8)]'
            }
          `}
        >
          {/* Background Effects */}
          <div className="retro-grid-solid"></div>
          <div className="scanlines-solid"></div>

          {/* NAVBAR HEADER CONTENT */}
          <div className="px-4 md:px-6 relative z-20 shrink-0">
            <div className="flex justify-between items-center h-16 md:h-20">

              {/* LOGO */}
              <Link to="/" className="relative group flex items-center gap-3 select-none">
                <div className="relative w-10 h-10 md:w-11 md:h-11 bg-[#0a0a0a] border-2 border-[#e69635] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(230,150,53,0.4)] group-hover:shadow-[0_0_30px_rgba(230,150,53,0.7)] transition-all duration-300 rounded-md">
                  <img src="/../GlossCut.png" alt="Logo" className="w-full h-full object-cover grayscale contrast-125 brightness-90 group-hover:grayscale-0 group-hover:brightness-110 transition-all duration-300 z-10" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#e69635]/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl font-mono font-black text-[#e69635] tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(230,150,53,0.8)]">
                    GlossCut
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#0affd9] font-bold px-1 drop-shadow-[0_0_8px_rgba(10,255,217,1)] bg-black/80 w-max rounded-sm">
                    NEXUS.SYS
                  </span>
                </div>
              </Link>

              {/* DESKTOP NAV */}
              <div className="hidden lg:flex items-center gap-2 p-1 rounded-lg bg-[#0f0f0f] border-2 border-[#3a3a3a] shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                {mainLinks.map(link => (
                  <NavItem key={link.to} {...link} isActive={isActive(link.to)} />
                ))}
                <div className="w-0.5 h-8 bg-[#e69635] mx-1 shadow-[0_0_15px_rgba(230,150,53,1)] opacity-50" />
                {!isAuthenticated && publicNavLinks.map(link => (
                  <NavItem key={link.to} {...link} isActive={isActive(link.to)} />
                ))}
                {isAuthenticated && authenticatedNavLinks.map(link => (
                  <NavItem key={link.to} {...link} isActive={isActive(link.to)} />
                ))}
              </div>

              {/* DESKTOP AUTH */}
              <div className="hidden lg:flex items-center gap-4">
                {isAuthenticated ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className={`flex items-center gap-3 pl-2 pr-4 py-1.5 border-2 font-mono transition-all duration-200 rounded-sm ${
                        userDropdownOpen 
                          ? 'bg-[#1a1109] border-[#e69635] text-[#e69635] shadow-[0_0_20px_rgba(230,150,53,0.4)]' 
                          : 'bg-[#0f0f0f] border-[#3a3a3a] text-[#8a6c48] hover:text-[#e69635] hover:border-[#e69635] hover:bg-[#1a1109]'
                      }`}
                    >
                      <div className="w-8 h-8 bg-[#0affd9]/10 border-2 border-[#0affd9] flex items-center justify-center shadow-[0_0_10px_rgba(10,255,217,0.4)]">
                           <User size={18} className="text-[#0affd9] drop-shadow-[0_0_5px_currentColor]" />
                      </div>
                      <div className="flex flex-col items-start">
                          <span className="text-[9px] text-[#0affd9] font-bold uppercase leading-none tracking-wider drop-shadow-[0_0_2px_currentColor]">Operator:</span>
                          <span className="text-sm font-bold leading-none uppercase">{user?.name?.split(' ')[0] || 'GUEST'}</span>
                      </div>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-[#e69635]' : ''}`} />
                    </button>

                    <div 
                      className={`absolute top-[calc(100%+12px)] right-0 w-80 bg-[#0a0a0a] border-2 border-[#e69635] shadow-[0_15px_50px_-10px_rgba(0,0,0,1),_0_0_30px_rgba(230,150,53,0.2)] transition-all duration-200 origin-top-right z-50 rounded-sm overflow-hidden
                      ${userDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                    >
                        <div className="retro-grid-solid opacity-30"></div>
                        <div className="relative p-4 bg-gradient-to-r from-[#e69635]/30 via-[#1a1109] to-transparent border-b-2 border-[#e69635]">
                          <p className="text-xs text-[#0affd9] font-bold uppercase mb-1 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(10,255,217,0.8)]">
                             <Sparkles size={12} /> STATUS: NETRUNNER
                          </p>
                          <p className="text-[#e69635] font-mono font-black truncate drop-shadow-[0_0_5px_rgba(230,150,53,0.5)]">{user?.email}</p>
                        </div>
                        
                        <div className="p-2 space-y-2 font-mono relative z-10 bg-[#0a0a0a]">
                          <Link to="/personal-info" className="flex items-center gap-3 p-2 bg-[#0f0f0f] hover:bg-[#1a1109] text-[#8a6c48] hover:text-[#e69635] transition-all group border border-[#3a3a3a] hover:border-[#e69635] rounded-sm shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                             <Settings size={18} className="group-hover:drop-shadow-[0_0_8px_rgba(230,150,53,1)] transition-all" />
                             <div>
                                <span className="block text-sm font-bold uppercase">Settings</span>
                             </div>
                          </Link>
                          <Link to="/change-password" className="flex items-center gap-3 p-2 bg-[#0f0f0f] hover:bg-[#1a1109] text-[#8a6c48] hover:text-[#e69635] transition-all group border border-[#3a3a3a] hover:border-[#e69635] rounded-sm shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                             <Lock size={18} className="group-hover:drop-shadow-[0_0_8px_rgba(230,150,53,1)] transition-all" />
                             <div>
                                <span className="block text-sm font-bold uppercase">Security</span>
                             </div>
                          </Link>
                        </div>
                        
                        <div className="p-2 border-t-2 border-[#3a3a3a] relative z-10 bg-[#0a0a0a]">
                          <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center justify-center gap-2 p-2 bg-[#ff0afe]/10 text-[#ff0afe] font-mono font-bold uppercase border-2 border-[#ff0afe] hover:bg-[#ff0afe]/30 transition-all shadow-[0_0_15px_rgba(255,10,254,0.4)] hover:shadow-[0_0_25px_rgba(255,10,254,0.6)] rounded-sm">
                             <LogOut size={16} className="drop-shadow-[0_0_5px_currentColor]" /> Jack Out
                          </button>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 font-mono">
                    <Link to="/login" className="text-[#8a6c48] hover:text-[#e69635] text-sm font-bold uppercase px-3 py-1 border border-transparent hover:border-[#e69635] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(230,150,53,0.8)] rounded-sm">
                        // Log In
                    </Link>
                    <PrimaryButton to="/customer-account-creation" label="Initialize" icon={Zap} />
                  </div>
                )}
              </div>

              {/* MOBILE TOGGLE */}
              <div className="lg:hidden">
                 <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`relative p-2.5 border-2 transition-all duration-200 rounded-md ${
                       isOpen 
                       ? 'bg-[#1a1109] text-[#e69635] border-[#e69635] shadow-[0_0_20px_rgba(230,150,53,0.5)]' 
                       : 'bg-[#0f0f0f] text-[#8a6c48] border-[#3a3a3a] hover:text-[#e69635] hover:border-[#e69635] hover:bg-[#1a1109]'
                    }`}
                 >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                 </button>
              </div>
            </div>
          </div>

          {/* MOBILE MENU - FLOATING ISLAND MORPH 
             - Instead of sliding down *below* the bar, the bar *grows* to contain it.
             - Uses 'transition-all' on the parent height.
          */}
          <div 
             className={`lg:hidden overflow-hidden font-mono transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] relative
                ${isOpen ? 'max-h-[85vh] opacity-100 border-t-2 border-[#e69635]/50' : 'max-h-0 opacity-0'}
             `}
          >
             <div className="px-4 pb-8 pt-4 space-y-5 relative z-10">
                {/* Search */}
                <div className="relative group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a6c48] group-hover:text-[#e69635] transition-colors z-20" size={18} />
                   <input 
                      type="text" 
                      placeholder="SEARCH DATABASE..." 
                      className="w-full bg-[#0f0f0f] border-2 border-[#3a3a3a] py-3 pl-10 pr-4 text-[#e69635] placeholder:text-[#8a6c48] font-bold focus:outline-none focus:border-[#e69635] focus:bg-[#1a1109] focus:shadow-[0_0_20px_rgba(230,150,53,0.4)] uppercase transition-all rounded-sm relative z-10"
                      readOnly 
                      onClick={() => { setIsOpen(false); navigate('/all-services-search'); }}
                   />
                </div>

                {/* Grid Links */}
                <div className="grid grid-cols-2 gap-3">
                   {mainLinks.map(link => (
                      <Link 
                         key={link.to} 
                         to={link.to}
                         onClick={() => setIsOpen(false)}
                         className={`flex flex-col items-center justify-center p-4 border-2 transition-all rounded-sm ${
                            isActive(link.to) 
                            ? 'bg-[#0affd9]/10 text-[#0affd9] border-[#0affd9] shadow-[0_0_20px_rgba(10,255,217,0.4),inset_0_0_10px_rgba(10,255,217,0.2)]' 
                            : 'bg-[#0f0f0f] text-[#8a6c48] border-[#3a3a3a] hover:text-[#e69635] hover:border-[#e69635] hover:bg-[#1a1109]'
                         }`}
                      >
                         <link.icon size={24} className="mb-2 drop-shadow-[0_0_5px_currentColor]" />
                         <span className="text-xs font-bold uppercase tracking-wider">{link.label}</span>
                      </Link>
                   ))}
                </div>

                {/* Vertical Links */}
                <div className="space-y-2">
                   <p className="text-xs font-bold text-[#8a6c48] uppercase tracking-[0.2em] pl-1 mb-2">/// NAVIGATION</p>
                   {isAuthenticated ? authenticatedNavLinks.map(link => (
                      <Link 
                         key={link.to} to={link.to}
                         onClick={() => setIsOpen(false)}
                         className="flex items-center justify-between p-3 border-2 border-[#3a3a3a] bg-[#0f0f0f] hover:border-[#e69635] hover:bg-[#1a1109] text-[#8a6c48] hover:text-[#e69635] transition-all rounded-sm group shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                      >
                         <div className="flex items-center gap-3">
                            <link.icon size={18} className="text-[#0affd9] group-hover:drop-shadow-[0_0_8px_rgba(10,255,217,1)] transition-all" />
                            <span className="font-bold uppercase tracking-wider">{link.label}</span>
                         </div>
                         <ChevronRight size={16} />
                      </Link>
                   )) : publicNavLinks.map(link => (
                      <Link 
                         key={link.to} to={link.to} 
                         onClick={() => setIsOpen(false)}
                         className="flex items-center justify-between p-3 border-2 border-[#3a3a3a] bg-[#0f0f0f] hover:border-[#e69635] hover:bg-[#1a1109] text-[#8a6c48] hover:text-[#e69635] transition-all rounded-sm group shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                      >
                         <div className="flex items-center gap-3">
                            <link.icon size={18} className="text-[#0affd9] group-hover:drop-shadow-[0_0_8px_rgba(10,255,217,1)] transition-all" />
                            <span className="font-bold uppercase tracking-wider">{link.label}</span>
                         </div>
                         <ChevronRight size={16} />
                      </Link>
                   ))}
                </div>

                {/* Mobile Footer */}
                <div className="pt-6 border-t-2 border-[#3a3a3a]">
                   {isAuthenticated ? (
                      <div className="space-y-4">
                         <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#e69635]/20 to-transparent border-2 border-[#e69635] rounded-sm shadow-[0_0_20px_rgba(230,150,53,0.3)]">
                            <div className="w-12 h-12 bg-[#1a1109] border-2 border-[#e69635] flex items-center justify-center text-[#e69635] font-bold text-xl shadow-[0_0_15px_rgba(230,150,53,0.5)]">
                               {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                               <p className="text-[#e69635] font-bold uppercase text-lg drop-shadow-[0_0_8px_rgba(230,150,53,0.8)]">{user?.name}</p>
                               <p className="text-xs text-[#0affd9] font-mono tracking-wider drop-shadow-[0_0_5px_rgba(10,255,217,0.8)]">:: SIGNAL STRONG ::</p>
                            </div>
                         </div>
                         <div className="flex gap-3">
                            <Link to="/personal-info" onClick={() => setIsOpen(false)} className="flex-1 p-3 text-center bg-[#0f0f0f] text-xs font-bold text-[#8a6c48] border-2 border-[#3a3a3a] uppercase hover:bg-[#1a1109] hover:text-[#e69635] hover:border-[#e69635] transition-all rounded-sm shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">Settings</Link>
                            <button onClick={() => { logout(); setIsOpen(false); }} className="flex-1 p-3 text-center bg-[#ff0afe]/10 text-xs font-bold text-[#ff0afe] border-2 border-[#ff0afe] uppercase hover:bg-[#ff0afe]/30 hover:shadow-[0_0_20px_rgba(255,10,254,0.5)] transition-all rounded-sm">Log Out</button>
                         </div>
                      </div>
                   ) : (
                      <PrimaryButton to="/login" label="Log In System" icon={LogIn} onClick={() => setIsOpen(false)} className="w-full justify-center py-3" />
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