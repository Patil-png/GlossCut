import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Scissors,
  Settings, // Using as Gear
  Star,
  Zap,
  Ticket
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-[#111] text-[#e0e0e0] overflow-hidden font-serif pt-12 pb-6 border-t-4 border-[#1a1a1a] z-0">

      {/* =========================================
          1. GLOBAL CSS & ANIMATIONS
      ========================================= */}
      <style>{`
        /* Barber Pole - Static & Polished */
        .barber-pole {
          background-image: repeating-linear-gradient(
            45deg,
            #8B0000 0px,
            #8B0000 10px,
            #e5e5e5 10px,
            #e5e5e5 20px,
            #191970 20px,
            #191970 30px,
            #e5e5e5 30px,
            #e5e5e5 40px
          );
          /* Increased shadow opacity for a 3D "Glass Tube" look since it is now static */
          box-shadow: inset 0 0 12px rgba(0,0,0,0.9); 
        }

        /* Metal Mesh Texture */
        .metal-mesh {
          background-color: #151515;
          background-image: radial-gradient(#222 15%, transparent 16%), radial-gradient(#222 15%, transparent 16%);
          background-size: 10px 10px;
          background-position: 0 0, 5px 5px;
          box-shadow: inset 0 0 20px #000;
        }

        /* Neon Flicker Animation */
        @keyframes neonFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            text-shadow: 
              0 0 5px #fff,
              0 0 10px #fff,
              0 0 20px #d4af37,
              0 0 40px #d4af37,
              0 0 80px #d4af37;
            opacity: 1;
          }
          20%, 24%, 55% {
            text-shadow: none;
            opacity: 0.5;
          }
        }
        .neon-text {
          animation: neonFlicker 4s infinite alternate;
          color: #fff;
        }

        /* Gear Rotation */
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .gear-spin { animation: spin-slow 12s linear infinite; }
        .gear-spin-reverse { animation: spin-slow 15s linear infinite reverse; }

        /* Hanging Sign Swing */
        @keyframes swing {
          0% { transform: rotate(3deg); }
          100% { transform: rotate(-3deg); }
        }
        .hanging-sign {
          transform-origin: top center;
          animation: swing 3s ease-in-out infinite alternate;
        }
      `}</style>

      {/* TOP DECORATIVE STRIP (Static Barber Pole) */}
      <div className="absolute top-0 left-0 right-0 h-4 z-20 barber-pole border-b-2 border-black"></div>

      {/* MOBILE SIGN */}
      <div className="absolute top-0 right-5 z-30 block lg:hidden">
        <div className="w-[2px] h-10 bg-[#222] absolute left-2 top-0"></div>
        <div className="w-[2px] h-10 bg-[#222] absolute right-2 top-0"></div>
        <div className="mt-8 hanging-sign bg-[#1a1a1a] border-2 border-[#d4af37] px-3 py-1 rounded-sm shadow-xl">
          <span className="text-[9px] font-bold text-[#d4af37] uppercase tracking-widest">Shop Open</span>
        </div>
      </div>

      {/* BACKGROUND GEARS (Decorative) */}
      <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none overflow-hidden">
        <Settings size={300} className="gear-spin absolute -top-20 -right-20" />
        <Settings size={180} className="gear-spin-reverse absolute top-40 right-20" />
      </div>


      {/* =========================================
          2. CONTENT GRID
      ========================================= */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

        {/* --- COL 1: THE NEON SHOP SIGN (4 Cols) --- */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
          <div className="relative w-full max-w-md lg:max-w-none p-6 metal-mesh rounded-lg border-4 border-[#333] shadow-2xl mb-8 group overflow-hidden">
            <Screw position="top-2 left-2" />
            <Screw position="top-2 right-2" />
            <Screw position="bottom-2 left-2" />
            <Screw position="bottom-2 right-2" />
            <div className="absolute top-0 left-1/2 w-[2px] h-12 bg-black/80"></div>
            <div className="flex flex-col items-center justify-center pt-4">
              <h2 className="text-4xl lg:text-5xl font-bold uppercase tracking-wider mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                <span className="neon-text">Gloss</span>
                <span className="text-[#444] drop-shadow-md ml-1">Cut</span>
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-[1px] w-8 bg-[#d4af37]"></div>
                <span className="text-[10px] text-[#d4af37] tracking-[0.3em] font-sans uppercase">Premium Grooming</span>
                <div className="h-[1px] w-8 bg-[#d4af37]"></div>
              </div>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-40">
              <Zap size={10} className="text-yellow-500" />
              <span className="text-[8px] font-mono text-yellow-500">220V</span>
            </div>
          </div>
          <p className="text-sm text-center lg:text-left text-gray-500 font-mono leading-relaxed lg:pl-2 lg:border-l-2 lg:border-[#333] lg:ml-2">
            "A gentleman's presence is his first introduction. Let us ensure it is a memorable one."
          </p>
        </div>


        {/* --- COL 2: THE MENU BOARD (4 Cols) --- */}
        <div className="lg:col-span-4 relative flex flex-col items-center lg:block">
          {/* DESKTOP SIGN */}
          <div className="hidden lg:block absolute -top-16 left-1/2 -translate-x-1/2 z-20">
            <div className="w-[2px] h-12 bg-[#444] absolute left-2"></div>
            <div className="w-[2px] h-12 bg-[#444] absolute right-2"></div>
            <div className="mt-12 hanging-sign bg-[#1a1a1a] border-2 border-[#d4af37] px-4 py-1 rounded-sm shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Shop Open</span>
            </div>
          </div>

          <div className="w-full max-w-md lg:max-w-none bg-[#1a1a1a] p-6 border border-[#333] shadow-lg relative mt-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#333] shadow-inner border border-[#555]"></div>
            <div className="flex justify-between mb-6 border-b border-[#333] pb-2">
              <h4 className="text-[#888] font-bold uppercase text-xs tracking-widest">Directory</h4>
              <Scissors size={14} className="text-[#444]" />
            </div>
            <ul className="space-y-4 font-mono text-sm text-gray-400">
              <RetroLink to="/all-services-search" label="01. Find A Barber" />
              <RetroLink to="/about-us" label="02. About-Us" />
              <RetroLink to="/customer-account-creation" label="03. Membership" />
              <RetroLink to="/barber-account-creation" label="04. Professional" />
              <RetroLink to="login" label="05. Login" />
            </ul>
          </div>
        </div>


        {/* --- COL 3: THE TELEGRAPH (Newsletter) (4 Cols) --- */}
        <div className="lg:col-span-4 flex flex-col items-center lg:block">
          {/* NEWSLETTER (Hidden on mobile) */}
          <div className="hidden lg:block w-full max-w-md lg:max-w-none bg-[#e5e5e5] p-1 rounded-sm lg:rotate-1 hover:rotate-0 transition-transform duration-500 shadow-xl">
            <div className="bg-[#f0f0f0] p-6 border-2 border-dashed border-[#999] h-full text-[#1a1a1a]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl font-serif uppercase tracking-tight text-black">The GlossCut</h3>
                  <p className="text-[10px] font-mono text-gray-600">WEEKLY DISPATCH NO. 244</p>
                </div>
                <Ticket size={24} className="text-black opacity-80" />
              </div>
              <p className="text-xs font-serif text-gray-700 italic mb-4 leading-tight">
                Subscribe to receive grooming tips and exclusive parlor offers via electric mail.
              </p>
              <form className="flex flex-col gap-3">
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    placeholder="ENTER ADDRESS..."
                    className="w-full bg-[#e8e8e8] border-b-2 border-gray-400 px-8 py-2 text-xs font-mono focus:outline-none focus:border-black focus:bg-white transition-colors uppercase placeholder:text-gray-400"
                  />
                </div>
                <button className="group relative w-full h-10 bg-[#1a1a1a] text-[#d4af37] font-bold text-xs uppercase tracking-widest mt-2 active:top-[2px] transition-all shadow-[0_4px_0_#000] active:shadow-none hover:bg-black">
                  <span className="flex items-center justify-center gap-2">
                    Transmit <Zap size={12} className="group-hover:text-white transition-colors" />
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* 1. DESKTOP ONLY: Contact Info */}
          <div className="hidden lg:flex w-full max-w-md mx-auto lg:mx-0 mt-8 items-center justify-between text-[10px] text-gray-500 font-mono border-t border-[#333] pt-4">
            <div className="flex items-center gap-2">
              <MapPin size={12} />
              <span>Dastur Nagar ,Amravati ,Maharashtra, India </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={12} />
              <span>+91 8799866811</span>
            </div>
          </div>

          {/* 2. MOBILE ONLY: Copyright & Credits (Moved here from bottom) */}
          <div className="flex lg:hidden flex-col items-center justify-center gap-2 w-full max-w-md mx-auto mt-0 text-[10px] text-gray-500 font-mono border-t border-[#333] pt-4 pb-8">
            <span className="opacity-75">© {currentYear} GlossCut Inc.</span>
            <a href="https://github.com/ompatil" className="flex items-center gap-2 hover:text-white transition-colors">
              <span>Crafted by Om B. Patil</span>
              <Star size={8} className="text-[#d4af37] fill-[#d4af37]" />
            </a>
          </div>

        </div>

      </div>


      {/* =========================================
          3. FOOTER BOTTOM (Bolted Plate)
      ========================================= */}
      {/* HIDDEN ON MOBILE: Since credits are moved up, we hide this section on mobile to avoid duplication */}
      <div className="hidden lg:block relative mt-16 bg-[#0a0a0a] border-t border-[#222] py-4">
        {/* Bolts */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 w-3 h-3 rounded-full bg-[#222] shadow-[inset_0_1px_3px_#000] flex items-center justify-center"><div className="w-2 h-[1px] bg-[#111] rotate-45"></div></div>
        <div className="absolute top-1/2 -translate-y-1/2 right-4 w-3 h-3 rounded-full bg-[#222] shadow-[inset_0_1px_3px_#000] flex items-center justify-center"><div className="w-2 h-[1px] bg-[#111] rotate-45"></div></div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-center md:justify-between items-center gap-6 md:gap-4 text-[10px] font-mono text-[#444] uppercase tracking-widest">

          <div className="flex gap-6 text-center">
            <Link to="/privacy" className="hover:text-[#d4af37] transition-colors">Privacy Protocol</Link>
            <Link to="/terms" className="hover:text-[#d4af37] transition-colors">Service Terms</Link>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-center">
            <span className="opacity-75">© {currentYear} GlossCut Inc.</span>
            <span className="hidden md:block w-1 h-1 rounded-full bg-[#333]"></span>
            <a href="https://github.com/ompatil" className="hover:text-white transition-colors flex items-center gap-2">
              <span>Crafted by Om B. Patil</span>
              <Star size={8} className="text-[#d4af37] fill-[#d4af37]" />
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

// --- SUB-COMPONENTS ---

const Screw = ({ position }) => (
  <div className={`absolute ${position} w-3 h-3 rounded-full bg-[#444] border border-[#222] shadow-inner flex items-center justify-center z-10`}>
    <div className="w-2 h-[1px] bg-[#1a1a1a] rotate-12"></div>
    <div className="w-2 h-[1px] bg-[#1a1a1a] -rotate-12 absolute"></div>
  </div>
);

const RetroLink = ({ to, label }) => (
  <li className="group">
    <Link to={to} className="flex items-center justify-between hover:text-[#d4af37] transition-colors p-1 px-2 hover:bg-[#222] rounded-sm border border-transparent hover:border-[#333]">
      <span>{label}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">»</span>
    </Link>
  </li>
);

export default Footer;
